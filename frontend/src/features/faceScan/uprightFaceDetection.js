/**
 * Kiểm tra tư thế mặt (FaceDetector) — pure logic, không phụ thuộc React.
 * @param {FaceDetector | null} detector
 * @param {HTMLCanvasElement} canvasEl
 * @returns {Promise<boolean|null>} true/false hoặc null nếu không đo được
 */
export async function detectUprightFace(detector, canvasEl) {
  if (!detector || !canvasEl) return null;

  try {
    const faces = await detector.detect(canvasEl);
    if (!faces || faces.length === 0) return false;

    const face = faces[0];
    const landmarks = face.landmarks || [];
    const box = face.boundingBox;
    const frameWidth = canvasEl.width || 1;
    const frameHeight = canvasEl.height || 1;

    if (!box || !Number.isFinite(box.width) || !Number.isFinite(box.height)) return false;

    const boxLeft = box.x;
    const boxTop = box.y;
    const boxRight = box.x + box.width;
    const boxBottom = box.y + box.height;
    const faceAreaRatio = (box.width * box.height) / (frameWidth * frameHeight);

    const edgePaddingX = frameWidth * 0.06;
    const edgePaddingY = frameHeight * 0.06;
    const fullyInsideFrame =
      boxLeft >= edgePaddingX &&
      boxRight <= frameWidth - edgePaddingX &&
      boxTop >= edgePaddingY &&
      boxBottom <= frameHeight - edgePaddingY;

    const faceSizeValid = faceAreaRatio >= 0.18 && faceAreaRatio <= 0.82;
    const faceCenterX = boxLeft + box.width / 2;
    const centeredEnough = Math.abs(faceCenterX - frameWidth / 2) <= frameWidth * 0.22;

    if (!fullyInsideFrame || !faceSizeValid || !centeredEnough) return false;

    const getPoint = (type) => {
      const lm = landmarks.find((item) => item?.type === type);
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
    if (!leftEye || !rightEye || !nose || !mouth) return false;

    const eyeAvgY = (leftEye.y + rightEye.y) / 2;
    const rollDeg = Math.abs(
      (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI
    );
    const eyesAboveNose = nose.y > eyeAvgY;
    const mouthBelowNose = mouth.y > nose.y;
    const rollOk = rollDeg <= 18;

    const eyeDistance = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y);
    if (!Number.isFinite(eyeDistance) || eyeDistance <= 1) return false;

    const eyeWidthRatio = eyeDistance / Math.max(box.width, 1);
    const yawOk = eyeWidthRatio >= 0.28;

    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const noseHorizontalOffsetRatio = Math.abs(nose.x - eyeMidX) / eyeDistance;
    const noseCentered = noseHorizontalOffsetRatio <= 0.38;

    const eyeToNose = nose.y - eyeAvgY;
    const noseToMouth = mouth.y - nose.y;
    if (eyeToNose <= 0 || noseToMouth <= 0) return false;
    const pitchRatio = eyeToNose / noseToMouth;
    const pitchOk = pitchRatio >= 0.45 && pitchRatio <= 1.75;

    return eyesAboveNose && mouthBelowNose && rollOk && yawOk && noseCentered && pitchOk;
  } catch {
    return null;
  }
}
