export const isImage = (f) => f?.type?.startsWith("image/");

export const formatPercent = (value) => {
  if (typeof value !== "number") return String(value);
  const v = value <= 1 ? value * 100 : value;
  return Number.isFinite(v) ? `${v.toFixed(1)}%` : String(value);
};

export const toPercentNumber = (value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value <= 1 ? value * 100 : value;
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const loadImageFromFile = (selectedFile) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(selectedFile);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(blobUrl);
      reject(err);
    };
    img.src = blobUrl;
  });

export const extractVideoFrame = (selectedFile, seekSecond = 0.3) =>
  new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const blobUrl = URL.createObjectURL(selectedFile);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(blobUrl);
      video.removeAttribute("src");
    };

    video.onloadedmetadata = () => {
      const safeDuration = Number.isFinite(video.duration) ? video.duration : 0;
      const target = clamp(seekSecond, 0, Math.max(0, safeDuration - 0.05));
      video.currentTime = target;
    };

    video.onseeked = () => {
      cleanup();
      resolve(video);
    };

    video.onerror = (err) => {
      cleanup();
      reject(err);
    };

    video.src = blobUrl;
  });

export async function analyzeVisualSignals(selectedFile, isImageFile) {
  if (!selectedFile) return null;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  let mediaWidth = 0;
  let mediaHeight = 0;

  if (isImageFile) {
    const img = await loadImageFromFile(selectedFile);
    mediaWidth = img.naturalWidth || img.width;
    mediaHeight = img.naturalHeight || img.height;
    canvas.width = mediaWidth;
    canvas.height = mediaHeight;
    ctx.drawImage(img, 0, 0, mediaWidth, mediaHeight);
  } else {
    const frame = await extractVideoFrame(selectedFile);
    mediaWidth = frame.videoWidth;
    mediaHeight = frame.videoHeight;
    canvas.width = mediaWidth;
    canvas.height = mediaHeight;
    ctx.drawImage(frame, 0, 0, mediaWidth, mediaHeight);
  }

  if (!canvas.width || !canvas.height) return null;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const pixelCount = Math.max(1, imageData.length / 4);

  let brightnessSum = 0;
  let brightnessSqSum = 0;
  let edgeSum = 0;

  for (let i = 0; i < imageData.length; i += 4) {
    const r = imageData[i];
    const g = imageData[i + 1];
    const b = imageData[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    brightnessSum += gray;
    brightnessSqSum += gray * gray;
    if (i >= 4) {
      const prevGray =
        0.299 * imageData[i - 4] + 0.587 * imageData[i - 3] + 0.114 * imageData[i - 2];
      edgeSum += Math.abs(gray - prevGray);
    }
  }

  const meanBrightness = brightnessSum / pixelCount;
  const variance = Math.max(0, brightnessSqSum / pixelCount - meanBrightness * meanBrightness);
  const brightnessStd = Math.sqrt(variance);
  const edgeDensity = clamp(edgeSum / (pixelCount * 255), 0, 1);

  let faceBox = null;
  let faceLandmarks = [];
  if (typeof window !== "undefined" && "FaceDetector" in window) {
    try {
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      const faces = await detector.detect(canvas);
      if (faces?.length > 0) {
        faceBox = faces[0]?.boundingBox || null;
        faceLandmarks = faces[0]?.landmarks || [];
      }
    } catch {
      // Keep analysis without landmarks when FaceDetector unsupported/error.
    }
  }

  const fullBox = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
  };
  const box = faceBox || fullBox;

  const getPoint = (type) => {
    const lm = faceLandmarks.find((item) => item?.type === type);
    if (!lm) return null;
    if (lm.location) return lm.location;
    if (Array.isArray(lm.locations) && lm.locations.length > 0) {
      const sum = lm.locations.reduce(
        (acc, p) => ({ x: acc.x + (p?.x || 0), y: acc.y + (p?.y || 0) }),
        { x: 0, y: 0 }
      );
      return { x: sum.x / lm.locations.length, y: sum.y / lm.locations.length };
    }
    return null;
  };

  const leftEye = getPoint("leftEye");
  const rightEye = getPoint("rightEye");
  const nose = getPoint("noseTip");
  const mouth = getPoint("mouth");

  const faceCoverage = clamp((box.width * box.height) / (canvas.width * canvas.height), 0, 1);
  const faceCenterX = box.x + box.width / 2;
  const centerOffset = Math.abs(faceCenterX - canvas.width / 2) / (canvas.width / 2);
  const centerScore = clamp(1 - centerOffset, 0, 1);

  const roiX = Math.max(0, Math.floor(box.x));
  const roiY = Math.max(0, Math.floor(box.y));
  const roiW = Math.max(2, Math.min(canvas.width - roiX, Math.floor(box.width)));
  const roiH = Math.max(2, Math.min(canvas.height - roiY, Math.floor(box.height)));
  const roiData = ctx.getImageData(roiX, roiY, roiW, roiH).data;

  let symmetryDiff = 0;
  let symmetrySamples = 0;
  for (let y = 0; y < roiH; y += 2) {
    for (let x = 0; x < Math.floor(roiW / 2); x += 2) {
      const lx = x;
      const rx = roiW - 1 - x;
      const li = (y * roiW + lx) * 4;
      const ri = (y * roiW + rx) * 4;
      const lg = 0.299 * roiData[li] + 0.587 * roiData[li + 1] + 0.114 * roiData[li + 2];
      const rg = 0.299 * roiData[ri] + 0.587 * roiData[ri + 1] + 0.114 * roiData[ri + 2];
      symmetryDiff += Math.abs(lg - rg);
      symmetrySamples += 1;
    }
  }
  const avgSymDiff = symmetrySamples > 0 ? symmetryDiff / symmetrySamples : 255;
  const symmetryScore = clamp(1 - avgSymDiff / 85, 0, 1);

  let poseScore = 0.5;
  if (leftEye && rightEye && nose && mouth) {
    const eyeAvgY = (leftEye.y + rightEye.y) / 2;
    const roll = Math.abs(Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180 / Math.PI);
    const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
    const yaw = eyeDistance > 0 ? Math.abs(nose.x - (leftEye.x + rightEye.x) / 2) / eyeDistance : 1;
    const pitchNumerator = Math.max(0.001, nose.y - eyeAvgY);
    const pitchDenominator = Math.max(0.001, mouth.y - nose.y);
    const pitchRatio = pitchNumerator / pitchDenominator;

    const rollScore = clamp(1 - roll / 28, 0, 1);
    const yawScore = clamp(1 - yaw / 0.55, 0, 1);
    const pitchScore = clamp(1 - Math.abs(pitchRatio - 1) / 1.2, 0, 1);
    poseScore = clamp((rollScore + yawScore + pitchScore) / 3, 0, 1);
  }

  const shoulderBandY = Math.floor(canvas.height * 0.7);
  const shoulderBandH = Math.max(2, Math.floor(canvas.height * 0.22));
  const shoulderData = ctx.getImageData(0, shoulderBandY, canvas.width, Math.min(shoulderBandH, canvas.height - shoulderBandY)).data;
  let shoulderVarianceAccum = 0;
  for (let i = 0; i < shoulderData.length; i += 4) {
    const gray = 0.299 * shoulderData[i] + 0.587 * shoulderData[i + 1] + 0.114 * shoulderData[i + 2];
    shoulderVarianceAccum += Math.abs(gray - meanBrightness);
  }
  const shoulderConsistency = clamp(1 - shoulderVarianceAccum / Math.max(1, shoulderData.length * 0.7), 0, 1);

  const textureContinuity = clamp(1 - Math.abs(edgeDensity - 0.18) / 0.24, 0, 1);

  return {
    hasFace: Boolean(faceBox),
    faceCoverage,
    centerScore,
    symmetryScore,
    poseScore,
    shoulderConsistency,
    textureContinuity,
    brightnessStdNorm: clamp(brightnessStd / 80, 0, 1),
    edgeDensity,
  };
}

/** Impact labels for UI (must match className checks in LandingHero). */
export const IMPACT = {
  weak: "Weak",
  medium: "Medium",
  strong: "Strong",
};

export function buildScoreExplainRows(visualSignals, scorePercent, scoreType) {
  const safeScore = clamp(Number(scorePercent || 0), 0, 100);
  const sig = visualSignals || {};
  const quality = {
    face: clamp((sig.faceCoverage || 0) * 0.55 + (sig.centerScore || 0) * 0.45, 0, 1),
    eyes: clamp(sig.poseScore || 0, 0, 1),
    noseMouth: clamp((sig.poseScore || 0) * 0.75 + (sig.symmetryScore || 0) * 0.25, 0, 1),
    contour: clamp(sig.symmetryScore || 0, 0, 1),
    shoulder: clamp(sig.shoulderConsistency || 0, 0, 1),
    texture: clamp((sig.textureContinuity || 0) * 0.7 + (1 - (sig.edgeDensity || 0)) * 0.3, 0, 1),
  };
  const anomaly = {
    face: 1 - quality.face,
    eyes: 1 - quality.eyes,
    noseMouth: 1 - quality.noseMouth,
    contour: 1 - quality.contour,
    shoulder: 1 - quality.shoulder,
    texture: 1 - quality.texture,
  };

  const rowsByType = scoreType === "real"
    ? [
        { feature: "Overall face", value: quality.face, note: `Coverage ${(sig.faceCoverage || 0).toFixed(2)}, center ${(sig.centerScore || 0).toFixed(2)}` },
        { feature: "Eyes & gaze", value: quality.eyes, note: `Pose consistency ${(sig.poseScore || 0).toFixed(2)}` },
        { feature: "Nose & mouth", value: quality.noseMouth, note: `Landmark harmony ${(quality.noseMouth || 0).toFixed(2)}` },
        { feature: "Ears & jawline", value: quality.contour, note: `Symmetry ${(sig.symmetryScore || 0).toFixed(2)}` },
        { feature: "Shoulders / neck & posture", value: quality.shoulder, note: `Shoulder coherence ${(sig.shoulderConsistency || 0).toFixed(2)}` },
        { feature: "Skin texture & lighting", value: quality.texture, note: `Texture continuity ${(sig.textureContinuity || 0).toFixed(2)}` },
      ]
    : [
        { feature: "Face distortion", value: anomaly.face, note: `Face anomaly ${(anomaly.face || 0).toFixed(2)}` },
        { feature: "Abnormal eye / blink", value: anomaly.eyes, note: `Pose drift ${(anomaly.eyes || 0).toFixed(2)}` },
        { feature: "Misaligned nose–mouth", value: anomaly.noseMouth, note: `Landmark mismatch ${(anomaly.noseMouth || 0).toFixed(2)}` },
        { feature: "Noisy ear / hairline", value: anomaly.contour, note: `Contour instability ${(anomaly.contour || 0).toFixed(2)}` },
        { feature: "Inconsistent shoulders / neck", value: anomaly.shoulder, note: `Neck–shoulder inconsistency ${(anomaly.shoulder || 0).toFixed(2)}` },
        { feature: "Skin / lighting / compression noise", value: anomaly.texture, note: `Texture artifact ${(anomaly.texture || 0).toFixed(2)}` },
      ];

  return rowsByType.map((row) => {
    const calibrated = clamp(row.value * (safeScore / 100), 0, 1);
    let impactLevel = IMPACT.weak;
    if (calibrated >= 0.55) impactLevel = IMPACT.strong;
    else if (calibrated >= 0.32) impactLevel = IMPACT.medium;
    return {
      feature: row.feature,
      level: impactLevel,
      note: row.note,
    };
  });
}

export function buildComparisonRows(res, selectedFile) {
  const rows = [];
  const usedKeys = new Set();
  if (selectedFile) {
    rows.push({ metric: "File", value: selectedFile.name });
    rows.push({ metric: "Type", value: selectedFile.type || "unknown" });
    rows.push({ metric: "Size", value: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` });
  }
  if (res && typeof res === "object") {
    if (res.isDeepfake !== undefined) {
      rows.push({ metric: "Verdict", value: res.isDeepfake ? "Deepfake" : "Real" });
      usedKeys.add("isDeepfake");
    }
    if (res.score !== undefined) {
      rows.push({ metric: "Confidence", value: formatPercent(res.score) });
      usedKeys.add("score");
    }
    const probs = res.probabilities || res.probs || res.scores || null;
    if (probs && typeof probs === "object") {
      for (const [k, v] of Object.entries(probs)) {
        if (typeof v === "number") {
          rows.push({
            metric: `Score • ${k}`,
            value: formatPercent(v),
            kind: "score",
            scoreKey: String(k).toLowerCase(),
            scorePercent: toPercentNumber(v),
          });
        }
      }
    }
    if (res.models && typeof res.models === "object") {
      usedKeys.add("models");
      usedKeys.add("fusion_rule");
      usedKeys.add("source");
    }
    const extraKeys = Object.keys(res).filter((k) => !usedKeys.has(k)).sort();
    for (const k of extraKeys) {
      const v = res[k];
      if (v === null || v === undefined) continue;
      if (typeof v === "object") continue;
      rows.push({ metric: k, value: String(v) });
    }
  }
  return rows;
}
