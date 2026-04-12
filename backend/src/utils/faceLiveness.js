/**

 * Passive liveness — chỉ Silent-Face-Anti-Spoofing (antilogin-gateway → FastAPI).

 *

 * Logic: N frame (vd 23) → gọi AI từng frame. Đếm real vs fake.

 * - Fake chiếm đa số (hơn một nửa N) → không đạt.

 * - Real chiếm đa số → đạt; backend mới so khớp mặt.

 * - Hoà / quá nhiều frame lỗi API → không đạt.

 *

 * Ngưỡng đa số: floor(N/2)+1 (N=23 → cần ≥12 frame cùng loại).

 */

const jpegDecode = require('jpeg-js').decode;



function clamp(n, lo, hi) {

  return Math.min(hi, Math.max(lo, n));

}

/**

 * Trung bình khoảng cách Hamming giữa hash dòng-thời-gian (avg-hash từ frontend).

 * Ảnh/màn hình giữ yên: thường ~0 bit; người thật / rung tay: thường ≥ vài bit trên 256.

 * Chỉ so cặp (i-1, i) khi cả hai đều có hash hợp lệ.

 */

function meanConsecutivePerceptualHashDistance(frames) {

  if (!Array.isArray(frames) || frames.length < 2) return { mean: null, nPairs: 0 };

  let sum = 0;

  let n = 0;

  for (let i = 1; i < frames.length; i += 1) {

    const a = frames[i - 1]?.hash;

    const b = frames[i]?.hash;

    if (typeof a !== 'string' || a.length < 64 || typeof b !== 'string' || b.length < 64) continue;

    const len = Math.min(a.length, b.length);

    let d = Math.abs(a.length - b.length);

    for (let j = 0; j < len; j += 1) {

      if (a[j] !== b[j]) d += 1;

    }

    sum += d;

    n += 1;

  }

  if (n === 0) return { mean: null, nPairs: 0 };

  return { mean: sum / n, nPairs: n };

}



function laplacianVarianceFromJpegBuffer(buffer) {

  if (!buffer || !Buffer.isBuffer(buffer)) return null;

  let raw;

  try {

    raw = jpegDecode(buffer, { useTArray: true });

  } catch {

    return null;

  }

  if (!raw?.data || raw.width < 8 || raw.height < 8) return null;



  const target = 96;

  const w = raw.width;

  const h = raw.height;

  const scale = Math.min(target / w, target / h, 1);

  const ow = Math.max(8, Math.round(w * scale));

  const oh = Math.max(8, Math.round(h * scale));

  const gray = new Float32Array(ow * oh);



  for (let y = 0; y < oh; y += 1) {

    for (let x = 0; x < ow; x += 1) {

      const sx = Math.min(w - 1, Math.floor((x / ow) * w));

      const sy = Math.min(h - 1, Math.floor((y / oh) * h));

      const i = (sy * w + sx) * 4;

      const d = raw.data;

      gray[y * ow + x] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

    }

  }



  let sumSq = 0;

  let cnt = 0;

  for (let y = 1; y < oh - 1; y += 1) {

    for (let x = 1; x < ow - 1; x += 1) {

      const idx = y * ow + x;

      const lap =

        -4 * gray[idx] +

        gray[idx - 1] +

        gray[idx + 1] +

        gray[idx - ow] +

        gray[idx + ow];

      sumSq += lap * lap;

      cnt += 1;

    }

  }

  if (cnt === 0) return null;

  return sumSq / cnt;

}



/** Payload từ api/app.py Silent-Face */

function extractAntiSpoofLiveScore(r) {

  if (!r || typeof r !== 'object') return null;

  const probs = r.probabilities;

  if (probs && typeof probs.class_1 === 'number') {

    return clamp(probs.class_1, 0, 1);

  }

  if (r.label === 1 && typeof r.score === 'number') {

    return clamp(r.score, 0, 1);

  }

  if (r.is_live === true || String(r.class || '').toLowerCase() === 'real') {

    const sc = typeof r.score === 'number' ? r.score : r.confidence;

    if (typeof sc === 'number') return clamp(sc, 0, 1);

  }

  if (typeof r.score === 'number') return clamp(r.score, 0, 1);

  return null;

}



function isAntiSpoofLiveFace(r) {

  if (!r || typeof r !== 'object') return false;

  const probs = r.probabilities;

  if (

    probs &&

    typeof probs.class_0 === 'number' &&

    typeof probs.class_1 === 'number' &&

    typeof probs.class_2 === 'number'

  ) {

    const p0 = probs.class_0;

    const p1 = probs.class_1;

    const p2 = probs.class_2;

    if (p1 > p0 && p1 > p2) return true;

    if (p1 < p0 || p1 < p2) return false;

  }

  if (r.is_live === true) return true;

  const labelNum = Number(r.label);

  if (labelNum === 1) return true;

  const cls = String(r.class || '').toLowerCase();

  if (cls === 'real') return true;

  return false;

}



/**

 * Gọi Silent-Face từng frame; passedFrame = AI trả real/live (dùng cho so khớp mặt).

 * Không còn lọc theo score/blur ở bước này — chỉ tin class real/fake từ model.

 */

async function analyzeFramesAntiSpoofOnly(frames, callAntiSpoofPredict) {

  if (typeof callAntiSpoofPredict !== 'function') {

    throw new Error('callAntiSpoofPredict is required for face auth');

  }



  const details = [];

  for (let i = 0; i < frames.length; i += 1) {

    const frame = frames[i];

    const row = {

      index: i,

      blurVar: null,

      isBlur: false,

      aiRaw: null,

      probReal: null,

      aiOk: false,

      passedFrame: false,

      source: 'silent_face_anti_spoofing',

    };



    const varLap = laplacianVarianceFromJpegBuffer(frame.buffer);

    row.blurVar = varLap;

    const blurTh = parseFloat(String(process.env.FACE_LIVENESS_BLUR_VAR_MIN || '100').trim(), 10);

    const blurCut = Number.isFinite(blurTh) ? blurTh : 100;

    if (varLap != null) {

      row.isBlur = varLap < blurCut;

    }



    try {

      row.aiRaw = await callAntiSpoofPredict(

        frame.buffer,

        frame.filename,

        frame.mimetype

      );

      row.aiOk = row.aiRaw != null;

      row.probReal = extractAntiSpoofLiveScore(row.aiRaw);

    } catch (err) {

      row.aiOk = false;

    }



    row.passedFrame = row.aiOk && isAntiSpoofLiveFace(row.aiRaw);



    details.push(row);

  }

  return details;

}



/** Hơn một nửa: floor(N/2)+1 */

function majorityThreshold(total) {

  return Math.floor(total / 2) + 1;

}



/** Đếm real / fake / không gọi được AI; cùng luật cho register và verify. */

function passiveFusionPass(details, _mode) {

  const total = details.length;

  if (total === 0) {

    return {

      ok: false,

      reason: 'no_frames',

      nReal: 0,

      nFake: 0,

      nUnknown: 0,

      minMajority: 0,

      nPass: 0,

      nSpoof: 0,

      meanReal: 0,

      blurCount: 0,

      votingMin: 0,

    };

  }



  const nReal = details.filter((d) => d.aiOk && isAntiSpoofLiveFace(d.aiRaw)).length;

  const nFake = details.filter((d) => d.aiOk && d.aiRaw && !isAntiSpoofLiveFace(d.aiRaw)).length;

  const nUnknown = total - nReal - nFake;

  const minMajority = majorityThreshold(total);

  const blurCount = details.filter((d) => d.isBlur).length;

  const meanReal =

    details.reduce((s, d) => s + (d.probReal != null ? d.probReal : 0), 0) / total;



  const base = {

    nReal,

    nFake,

    nUnknown,

    minMajority,

    nPass: nReal,

    nSpoof: nFake,

    meanReal,

    blurCount,

    votingMin: minMajority,

  };



  if (nFake >= minMajority) {

    return { ok: false, reason: 'majority_fake', ...base };

  }



  if (nReal >= minMajority) {

    return { ok: true, reason: 'ok', ...base };

  }



  return { ok: false, reason: 'majority_inconclusive', ...base };

}



function buildLiveFramesList(frames, details) {

  const liveFrames = [];

  for (let i = 0; i < frames.length; i += 1) {

    const d = details[i];

    if (!d.passedFrame) continue;

    const frame = frames[i];

    liveFrames.push({

      ...frame,

      confidence:

        d.probReal != null ? d.probReal : Number(d.aiRaw?.score || d.aiRaw?.confidence || 0),

    });

  }

  liveFrames.sort((a, b) => b.confidence - a.confidence);

  const bestLive = liveFrames[0] || null;

  return {

    bestLiveFrame: bestLive,

    bestLiveHash: bestLive?.hash || null,

    liveFrames,

    liveCount: liveFrames.length,

    totalCount: frames.length,

  };

}



/**

 * @param {object} options

 * @param {(buf,name,mime)=>Promise<object>} options.callAntiSpoofPredict

 */

async function runPassiveLiveness(frames, mode, options = {}) {

  const { callAntiSpoofPredict } = options;

  const details = await analyzeFramesAntiSpoofOnly(frames, callAntiSpoofPredict);

  let fusion = passiveFusionPass(details, mode);

  const minMeanBitsRaw = String(process.env.FACE_LIVENESS_MIN_INTERFRAME_HASH_BITS_MEAN || '').trim();

  const minMeanBits = minMeanBitsRaw === '' ? 0 : parseFloat(minMeanBitsRaw, 10);

  if (fusion.ok && Number.isFinite(minMeanBits) && minMeanBits > 0) {

    const { mean, nPairs } = meanConsecutivePerceptualHashDistance(frames);

    const minPairs = Math.max(5, Math.floor(frames.length / 3));

    if (mean != null && nPairs >= minPairs && mean < minMeanBits) {

      fusion = {

        ...fusion,

        ok: false,

        reason: 'temporal_motion_low',

        temporalHashMeanBits: Math.round(mean * 1000) / 1000,

        temporalHashMinRequired: minMeanBits,

        temporalHashPairCount: nPairs,

      };

    }

  }

  const liveness = buildLiveFramesList(frames, details);

  return {

    ok: fusion.ok,

    reason: fusion.reason,

    liveness,

    fusion,

    details,

  };

}



/** Payload gọn cho frontend: không chứa buffer / object lớn. */
function serializeAntiSpoofDetailsForClient(details) {
  if (!Array.isArray(details)) return [];
  return details.map((d) => {
    let verdict = 'unknown';
    if (d.aiOk && d.aiRaw) {
      verdict = isAntiSpoofLiveFace(d.aiRaw) ? 'real' : 'fake';
    }
    const ir = d.aiRaw && typeof d.aiRaw === 'object' ? d.aiRaw : null;
    const probs = ir?.probabilities && typeof ir.probabilities === 'object' ? ir.probabilities : null;
    return {
      index: d.index,
      verdict,
      aiOk: Boolean(d.aiOk),
      isBlur: Boolean(d.isBlur),
      probReal: d.probReal != null ? Math.round(Number(d.probReal) * 10000) / 10000 : null,
      label: ir?.label != null ? ir.label : null,
      class: ir?.class != null ? String(ir.class) : null,
      is_live: ir?.is_live === true,
      confidence:
        typeof ir?.confidence === 'number' && Number.isFinite(ir.confidence)
          ? Math.round(ir.confidence * 10000) / 10000
          : null,
      score:
        typeof ir?.score === 'number' && Number.isFinite(ir.score)
          ? Math.round(ir.score * 10000) / 10000
          : null,
      probabilities: probs
        ? {
            class_0: typeof probs.class_0 === 'number' ? probs.class_0 : undefined,
            class_1: typeof probs.class_1 === 'number' ? probs.class_1 : undefined,
            class_2: typeof probs.class_2 === 'number' ? probs.class_2 : undefined,
          }
        : null,
    };
  });
}

function userMessageForLivenessFailure(reason, fusion) {

  const need = fusion?.minMajority ?? '?';

  const total = (fusion?.nReal ?? 0) + (fusion?.nFake ?? 0) + (fusion?.nUnknown ?? 0);

  switch (reason) {

    case 'majority_fake':

      return `Most frames were classified as fake (${fusion?.nFake} fake / ${fusion?.nReal} real / ${total} frames). You need a majority of real frames (>= ${need}). Please present a live face to the camera.`;

    case 'majority_inconclusive':

      return `Not enough real frames (${fusion?.nReal} real, need >= ${need} out of ${total} frames). Check lighting, antilogin-gateway, and Silent-Face API.`;

    case 'no_frames':

      return 'No valid frames were captured.';

    case 'temporal_motion_low':

      return `Frames are almost unchanged (possible static photo/screen replay). Average difference is only ${

        fusion?.temporalHashMeanBits ?? '?'

      } bits between frames, but >= ${fusion?.temporalHashMinRequired ?? '?'} bits are required. Move slightly or present a live face to the camera.`;

    default:

      return 'Face verification failed. Please try again.';

  }

}



module.exports = {

  laplacianVarianceFromJpegBuffer,

  extractAntiSpoofLiveScore,

  isAntiSpoofLiveFace,

  analyzeFramesAntiSpoofOnly,

  passiveFusionPass,

  runPassiveLiveness,

  userMessageForLivenessFailure,

  serializeAntiSpoofDetailsForClient,

  meanConsecutivePerceptualHashDistance,

};


