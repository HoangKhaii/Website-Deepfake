/**
 * Face registration / verify — Single Responsibility: chỉ nghiệp vụ khuôn mặt + lưu trữ.
 * Phụ thuộc vào abstraction (detect.service, DB) qua import (Dependency Inversion).
 */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jpegDecode = require('jpeg-js').decode;
const { query } = require('../config/db');
const { findUserByEmail, updateUserFace, activateUserIfPendingFace } = require('../repos/user.repo');
const { JWT_SECRET } = require('../middlewares/auth.middleware');
const { getPendingGoogleProfile, clearPendingGoogleProfile } = require('../config/passport-google');
const { callAIFaceCompare, callAntiSpoofPredict } = require('./detect.service');
const { toSafeUser } = require('../utils/safeUser');
const { normalizeEmailKey } = require('../utils/normalizeEmailKey');
const {
  getPendingRegistration,
  clearPendingRegistration,
} = require('../stores/pendingRegistration.store');
const { verifyRecaptchaToken } = require('../utils/verifyRecaptcha');
const { getClientIp } = require('../utils/requestIp');
const {
  runPassiveLiveness,
  userMessageForLivenessFailure,
  serializeAntiSpoofDetailsForClient,
} = require('../utils/faceLiveness');

const BCRYPT_ROUNDS = 10;
const FACE_SCAN_FRAME_COUNT = 23;
const FACE_VERIFY_MAX_ATTEMPTS = 3;
const FACE_COMPARE_MODE = (process.env.FACE_COMPARE_MODE || 'hash').toLowerCase();

const FACE_UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'faces');

if (!fs.existsSync(FACE_UPLOADS_DIR)) {
  fs.mkdirSync(FACE_UPLOADS_DIR, { recursive: true });
}

function parseFrameHashes(rawValue) {
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) return rawValue;
  if (typeof rawValue !== 'string') return [];
  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function normalizeFaceFramesFromRequest(req) {
  const files = Array.isArray(req.files) ? req.files : [];
  const frameFiles = files
    .filter((file) => file?.fieldname === 'frames' && Buffer.isBuffer(file.buffer))
    .slice(0, FACE_SCAN_FRAME_COUNT);
  const frameHashes = parseFrameHashes(req.body?.frameHashes);

  return frameFiles.map((file, idx) => ({
    buffer: file.buffer,
    mimetype: file.mimetype || 'image/jpeg',
    filename: file.originalname || `frame-${idx + 1}.jpg`,
    hash: typeof frameHashes[idx] === 'string' ? frameHashes[idx] : null,
  }));
}

function hashSimilarityScore(hashA, hashB) {
  if (!hashA || !hashB || typeof hashA !== 'string' || typeof hashB !== 'string') return 0;
  const len = Math.min(hashA.length, hashB.length);
  if (len === 0) return 0;
  let same = 0;
  for (let i = 0; i < len; i += 1) {
    if (hashA[i] === hashB[i]) same += 1;
  }
  return same / len;
}

function compareFrameHashes(hashA, hashB, minScore = 0.78) {
  const score = hashSimilarityScore(hashA, hashB);
  return { matched: score >= minScore, score };
}

function bestEnrollMatchAmongLiveFrames(enrollHash, liveFrames, minScore) {
  let bestScore = 0;
  if (!enrollHash || !Array.isArray(liveFrames)) return { matched: false, score: 0 };
  for (const f of liveFrames) {
    if (!f?.hash) continue;
    const s = hashSimilarityScore(enrollHash, f.hash);
    if (s > bestScore) bestScore = s;
  }
  return { matched: bestScore >= minScore, score: bestScore };
}

function averageHashFromImageBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) return null;
  let raw;
  try {
    raw = jpegDecode(buffer, { useTArray: true });
  } catch (err) {
    return null;
  }
  if (!raw?.data || raw.width < 2 || raw.height < 2) return null;
  const { data, width, height } = raw;
  const out = [];
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const fx = ((x + 0.5) / 16) * width;
      const fy = ((y + 0.5) / 16) * height;
      const x0 = Math.min(Math.floor(fx), width - 1);
      const y0 = Math.min(Math.floor(fy), height - 1);
      const x1 = Math.min(x0 + 1, width - 1);
      const y1 = Math.min(y0 + 1, height - 1);
      const wx = fx - x0;
      const wy = fy - y0;
      const samp = (px, py) => {
        const i = (py * width + px) * 4;
        return 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      };
      const g =
        samp(x0, y0) * (1 - wx) * (1 - wy) +
        samp(x1, y0) * wx * (1 - wy) +
        samp(x0, y1) * (1 - wx) * wy +
        samp(x1, y1) * wx * wy;
      out.push(Math.round(g));
    }
  }
  const avg = out.reduce((a, b) => a + b, 0) / out.length;
  return out.map((v) => (v >= avg ? '1' : '0')).join('');
}

function extensionFromMimetype(mimetype) {
  if (mimetype === 'image/png') return '.png';
  if (mimetype === 'image/webp') return '.webp';
  return '.jpg';
}

function mimetypeFromExtension(ext) {
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

async function saveFaceFrameToDisk(userId, frame) {
  const ext = extensionFromMimetype(frame.mimetype);
  const fileName = `user-${userId}-${Date.now()}${ext}`;
  const absolutePath = path.join(FACE_UPLOADS_DIR, fileName);
  await fsp.writeFile(absolutePath, frame.buffer);
  return path.relative(path.resolve(__dirname, '..', '..'), absolutePath).replace(/\\/g, '/');
}

const storedFaceCache = new Map();
const STORED_FACE_CACHE_MAX = Math.max(1, parseInt(process.env.STORED_FACE_CACHE_MAX || '50', 10) || 50);

function cacheGet(key) {
  const hit = storedFaceCache.get(key);
  if (!hit) return null;
  // simple LRU bump
  storedFaceCache.delete(key);
  storedFaceCache.set(key, hit);
  return hit;
}

function cacheSet(key, value) {
  storedFaceCache.set(key, value);
  while (storedFaceCache.size > STORED_FACE_CACHE_MAX) {
    const oldestKey = storedFaceCache.keys().next().value;
    storedFaceCache.delete(oldestKey);
  }
}

async function readStoredFaceBuffer(storedValue) {
  if (!storedValue || typeof storedValue !== 'string') return null;
  const rootDir = path.resolve(__dirname, '..', '..');
  const absolutePath = path.isAbsolute(storedValue) ? storedValue : path.resolve(rootDir, storedValue);
  const cached = cacheGet(absolutePath);
  if (cached) return cached;

  try {
    const [st, buf] = await Promise.all([fsp.stat(absolutePath), fsp.readFile(absolutePath)]);
    const out = {
      buffer: buf,
      mimetype: mimetypeFromExtension(path.extname(absolutePath).toLowerCase()),
      filename: path.basename(absolutePath),
      mtimeMs: st.mtimeMs,
      byteLength: buf.byteLength,
    };
    cacheSet(absolutePath, out);
    return out;
  } catch {
    return null;
  }
}

async function registerFace(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const recaptchaSecret = (process.env.RECAPTCHA_SECRET_KEY || '').trim();
    if (recaptchaSecret) {
      const rawToken = req.body.recaptchaToken;
      if (!rawToken || typeof rawToken !== 'string' || !rawToken.trim()) {
        return res.status(400).json({
          success: false,
          message: 'reCAPTCHA verification missing. Please complete the “I’m not a robot” check.',
        });
      }
      const verifyResult = await verifyRecaptchaToken(rawToken, getClientIp(req));
      if (!verifyResult.ok) {
        return res.status(400).json({
          success: false,
          message: 'reCAPTCHA is invalid or expired. Please try again.',
        });
      }
    }

    const frames = normalizeFaceFramesFromRequest(req);
    if (frames.length === 0) {
      return res.status(400).json({ success: false, message: 'Face frame files are required' });
    }

    const normalizedEmail = normalizeEmailKey(email);

    let userId = null;
    const existingUser = await query(
      `SELECT user_id, email, status FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [normalizedEmail]
    );
    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].user_id;
    }

    const draft = getPendingRegistration(normalizedEmail);
    const googlePending = getPendingGoogleProfile(normalizedEmail);
    if (!userId && !googlePending && (!draft || !draft.verified)) {
      return res.status(400).json({
        success: false,
        message: 'Please finish signup (OTP or Google) before registering your face.',
      });
    }

    const passive = await runPassiveLiveness(frames, 'register', {
      callAntiSpoofPredict,
    });
    if (!passive.ok || !passive.liveness.bestLiveFrame) {
      return res.status(400).json({
        success: false,
        message: userMessageForLivenessFailure(passive.reason, passive.fusion),
        livenessReason: passive.reason,
        livenessStats: {
          nReal: passive.fusion.nReal,
          nFake: passive.fusion.nFake,
          nUnknown: passive.fusion.nUnknown,
          minMajority: passive.fusion.minMajority,
          nPass: passive.fusion.nPass,
          nSpoof: passive.fusion.nSpoof,
          meanReal: passive.fusion.meanReal,
          blurCount: passive.fusion.blurCount,
          votingMin: passive.fusion.votingMin,
          ...(passive.fusion.temporalHashMeanBits != null
            ? {
                temporalHashMeanBits: passive.fusion.temporalHashMeanBits,
                temporalHashMinRequired: passive.fusion.temporalHashMinRequired,
                temporalHashPairCount: passive.fusion.temporalHashPairCount,
              }
            : {}),
        },
      });
    }
    const liveness = passive.liveness;

    if (!userId) {
      let createdUser = null;
      if (draft?.verified) {
        createdUser = await query(
          `INSERT INTO users (username, email, password_hash, phone_number, full_name, birth_date, role, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'user', 'active')
           RETURNING user_id`,
          [
            draft.username || normalizedEmail,
            normalizedEmail,
            draft.password_hash,
            draft.phone_number || null,
            draft.full_name || null,
            draft.birth_date || null,
          ]
        );
      } else if (googlePending) {
        const randomPassword = `google-${Date.now()}-${Math.random()}`;
        const passwordHash = await bcrypt.hash(randomPassword, BCRYPT_ROUNDS);
        const generatedUsername = `${normalizedEmail.split('@')[0]}_${Date.now().toString(36)}`;
        createdUser = await query(
          `INSERT INTO users (username, email, password_hash, google_id, full_name, role, status)
           VALUES ($1, $2, $3, $4, $5, 'user', 'active')
           RETURNING user_id`,
          [
            generatedUsername,
            normalizedEmail,
            passwordHash,
            googlePending.googleId,
            googlePending.full_name || null,
          ]
        );
      }

      userId = createdUser.rows[0]?.user_id || null;
      if (!userId) {
        return res.status(500).json({ success: false, message: 'Unable to create an account after registering with facial recognition.' });
      }
    }

    const storedFacePath = await saveFaceFrameToDisk(userId, liveness.bestLiveFrame);
    const enrollHash = liveness.bestLiveHash || null;
    await updateUserFace(userId, storedFacePath, enrollHash);
    clearPendingRegistration(normalizedEmail);
    clearPendingGoogleProfile(normalizedEmail);

    const token = jwt.sign({ userId, email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      message: 'Face registered successfully',
      frameStats: {
        totalFrames: liveness.totalCount,
        realFrames: liveness.liveCount,
        livenessFusion: passive.fusion,
      },
      storedFacePath,
      storedFaceHash: liveness.bestLiveHash,
      token,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Your email address or phone number has already been registered. Please register again.',
      });
    }
    console.error('Register face error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to register face' });
  }
}

async function verifyFace(req, res) {
  try {
    const { email, faceAttempt = 1 } = req.body || {};
    const attempt = Math.max(1, parseInt(faceAttempt, 10) || 1);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const frames = normalizeFaceFramesFromRequest(req);
    if (frames.length === 0) {
      return res.status(400).json({ success: false, message: 'Face frame files are required' });
    }

    const user = await findUserByEmail(email.trim());
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.face_image) {
      return res.status(400).json({
        success: false,
        message:
          'No facial image has been submitted for verification yet. Please register your face first or log in using your email.',
      });
    }

    const passive = await runPassiveLiveness(frames, 'verify', {
      callAntiSpoofPredict,
    });
    if (!passive.ok || !passive.liveness.bestLiveFrame) {
      return res.status(400).json({
        success: false,
        message: userMessageForLivenessFailure(passive.reason, passive.fusion),
        livenessReason: passive.reason,
        antiSpoofFrames: serializeAntiSpoofDetailsForClient(passive.details),
        livenessStats: {
          nReal: passive.fusion.nReal,
          nFake: passive.fusion.nFake,
          nUnknown: passive.fusion.nUnknown,
          minMajority: passive.fusion.minMajority,
          nPass: passive.fusion.nPass,
          nSpoof: passive.fusion.nSpoof,
          meanReal: passive.fusion.meanReal,
          blurCount: passive.fusion.blurCount,
          votingMin: passive.fusion.votingMin,
          ...(passive.fusion.temporalHashMeanBits != null
            ? {
                temporalHashMeanBits: passive.fusion.temporalHashMeanBits,
                temporalHashMinRequired: passive.fusion.temporalHashMinRequired,
                temporalHashPairCount: passive.fusion.temporalHashPairCount,
              }
            : {}),
        },
      });
    }
    const liveness = passive.liveness;

    const storedFrame = await readStoredFaceBuffer(user.face_image);
    if (!storedFrame) {
      console.warn('Verify face: stored face path is invalid for user_id=%s', user.user_id);
      return res.status(400).json({
        success: false,
        message: 'Unable to read saved facial images. Please re-register your face or log in using email.',
      });
    }

    const hashMinScore = Math.min(
      1,
      Math.max(0.5, parseFloat(process.env.FACE_VERIFY_HASH_MIN_SCORE || '0.80', 10) || 0.8)
    );

    let matched = false;
    let compareModeUsed = 'none';
    let compareScoreOut = null;

    if (FACE_COMPARE_MODE === 'gateway') {
      const liveList = Array.isArray(liveness.liveFrames) ? liveness.liveFrames : [];
      let bestApiScore = -1;
      let anyMatch = false;
      let compareCallsOk = 0;
      for (const frame of liveList) {
        if (!frame?.buffer) continue;
        try {
          const compareResult = await callAIFaceCompare(storedFrame.buffer, frame.buffer);
          compareCallsOk += 1;
          if (compareResult && compareResult.match === true) {
            anyMatch = true;
            const sc = Number(compareResult.score);
            if (!Number.isNaN(sc) && sc > bestApiScore) bestApiScore = sc;
          }
        } catch (e) {
          console.warn('Verify face: compare frame failed', e?.message);
        }
      }
      if (liveList.length > 0 && compareCallsOk === 0) {
        return res.status(503).json({
          success: false,
          message:
            'The system failed to match faces (matching API). Please log in using your email.',
        });
      }
      matched = anyMatch;
      compareModeUsed = 'ai-compare';
      compareScoreOut = bestApiScore >= 0 ? bestApiScore : null;
    } else {
      const enrollHash =
        (user.face_enroll_hash && String(user.face_enroll_hash)) ||
        averageHashFromImageBuffer(storedFrame.buffer);
      if (!enrollHash) {
        return res.status(400).json({
          success: false,
          message:
            'No facial recognition hash has been registered in the system yet. ',
        });
      }
      const liveList = Array.isArray(liveness.liveFrames) ? liveness.liveFrames : [];
      const cmp = bestEnrollMatchAmongLiveFrames(enrollHash, liveList, hashMinScore);
      matched = cmp.matched;
      compareModeUsed = 'hash';
      compareScoreOut = cmp.score;
    }

    if (matched) {
      if (user.status === 'pending_face') {
        await activateUserIfPendingFace(user.user_id);
      }
      const token = jwt.sign(
        { userId: user.user_id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.json({
        success: true,
        message: 'Face verified successfully',
        frameStats: {
          totalFrames: liveness.totalCount,
          realFrames: liveness.liveCount,
          livenessFusion: passive.fusion,
        },
        antiSpoofFrames: serializeAntiSpoofDetailsForClient(passive.details),
        compareMode: compareModeUsed,
        compareScore: compareScoreOut,
        token,
        user: toSafeUser(user),
      });
    }

    const remainingAttempts = FACE_VERIFY_MAX_ATTEMPTS - attempt;
    const spoofRows = serializeAntiSpoofDetailsForClient(passive.details);
    if (remainingAttempts > 0) {
      return res.status(401).json({
        success: false,
        message: "The face doesn't match. Please try again with a new angle or sufficient lighting.",
        remainingAttempts,
        antiSpoofFrames: spoofRows,
        livenessFusion: passive.fusion,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'You have exceeded the maximum number of verification attempts. Please log in using your email.',
      forceEmailLogin: true,
      antiSpoofFrames: spoofRows,
      livenessFusion: passive.fusion,
    });
  } catch (err) {
    console.error('Verify face error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to verify face' });
  }
}

module.exports = {
  registerFace,
  verifyFace,
};
