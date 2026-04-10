import { detectUprightFace } from "./uprightFaceDetection.js";

/**
 * Anti-spoof (Silent-Face): ưu tiên full khung + PNG + không làm mịn — giữ moiré màn hình.
 *
 * VITE_FACE_ANTISPOOF_FULL_FRAME=1 (mặc định) — gửi full video (giống cap.read()); server crop 3:4.
 * VITE_FACE_ANTISPOOF_FULL_FRAME=0 — chỉ gửi crop oval (nhẹ hơn, PAD kém hơn với ảnh màn hình).
 *
 * VITE_FACE_ANTISPOOF_IMAGE_FORMAT=png (mặc định) — lossless.
 * VITE_FACE_ANTISPOOF_IMAGE_FORMAT=jpeg — nhẹ hơn, có thể làm mất chi tiết moiré.
 */
const USE_FULL_FRAME_FOR_ANTISPOOF =
  String(import.meta.env.VITE_FACE_ANTISPOOF_FULL_FRAME ?? "1").trim() !== "0";

const ANTISPOOF_IMAGE_FORMAT = String(
  import.meta.env.VITE_FACE_ANTISPOOF_IMAGE_FORMAT || "png"
)
  .toLowerCase()
  .trim();

const JPEG_QUALITY_FULL = 0.95;
const JPEG_QUALITY_GUIDE = 0.9;

/** Đồng bộ với khung vừa giải mã (tránh “bóng ma” / lệch với luồng nén). */
function waitForVideoFrame(video) {
  return new Promise((resolve) => {
    if (!video) {
      resolve();
      return;
    }
    if (typeof video.requestVideoFrameCallback === "function") {
      video.requestVideoFrameCallback(() => resolve());
      return;
    }
    requestAnimationFrame(() => resolve());
  });
}

/**
 * FaceScan: video có object-fit: cover — không được map bằng videoW/elW.
 * Zoom đồng nhất s = max(elW/vw, elH/vh); phần bị cắt căn giữa.
 */
function guideRectToVideoSpriteRect(videoEl, guideRectViewport) {
  const vr = videoEl.getBoundingClientRect();
  const vw = videoEl.videoWidth;
  const vh = videoEl.videoHeight;
  if (!vw || !vh || vr.width <= 0 || vr.height <= 0) return null;
  const elW = vr.width;
  const elH = vr.height;
  const s = Math.max(elW / vw, elH / vh);
  const dispW = s * vw;
  const dispH = s * vh;
  const offX = (elW - dispW) / 2;
  const offY = (elH - dispH) / 2;
  const gx0 = guideRectViewport.left - vr.left;
  const gy0 = guideRectViewport.top - vr.top;
  const gw = guideRectViewport.width;
  const gh = guideRectViewport.height;
  let sx = (gx0 - offX) / s;
  let sy = (gy0 - offY) / s;
  let sw = gw / s;
  let sh = gh / s;
  sx = Math.max(0, Math.round(sx));
  sy = Math.max(0, Math.round(sy));
  sw = Math.min(vw - sx, Math.round(sw));
  sh = Math.min(vh - sy, Math.round(sh));
  if (sw <= 0 || sh <= 0) return null;
  return { sx, sy, sw, sh };
}

/** Encode snapshot canvas (đã vẽ từ video) — không đọc lại element video (tránh lệch thời điểm sau FaceDetector). */
function encodeSnapshotCanvasForAntiSpoof(fullCanvas) {
  if (!fullCanvas) return Promise.resolve(null);
  const usePng = ANTISPOOF_IMAGE_FORMAT !== "jpeg" && ANTISPOOF_IMAGE_FORMAT !== "jpg";
  return new Promise((resolve) => {
    if (usePng) {
      fullCanvas.toBlob((b) => resolve(b), "image/png");
    } else {
      fullCanvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY_FULL);
    }
  });
}

function encodeGuideCanvasForAntiSpoof(canvas) {
  const usePng = ANTISPOOF_IMAGE_FORMAT !== "jpeg" && ANTISPOOF_IMAGE_FORMAT !== "jpg";
  return new Promise((resolve) => {
    if (usePng) {
      canvas.toBlob((b) => resolve(b), "image/png");
    } else {
      canvas.toBlob((b) => resolve(b), "image/jpeg", JPEG_QUALITY_GUIDE);
    }
  });
}

/**
 * Chụp một frame: blob cho anti-spoof (full frame hoặc oval theo env);
 * upright + avg-hash luôn từ crop oval.
 */
export async function captureFaceFromVideo({ video, canvas, guideEl, faceDetector }) {
  if (!video || !canvas) return null;
  if (!video.videoWidth || !video.videoHeight) return null;

  await waitForVideoFrame(video);

  let sx = Math.round(video.videoWidth * 0.375);
  let sy = Math.round(video.videoHeight * 0.25);
  let sw = Math.round(video.videoWidth * 0.25);
  let sh = Math.round(video.videoHeight * 0.5);

  if (guideEl) {
    const mapped = guideRectToVideoSpriteRect(video, guideEl.getBoundingClientRect());
    if (mapped) {
      ({ sx, sy, sw, sh } = mapped);
    }
  }

  if (sw <= 0 || sh <= 0) return null;

  const vw = video.videoWidth;
  const vh = video.videoHeight;
  let snapshotFull = null;

  canvas.width = sw;
  canvas.height = sh;
  const ctx2d = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx2d) return null;
  ctx2d.imageSmoothingEnabled = false;

  if (USE_FULL_FRAME_FOR_ANTISPOOF) {
    snapshotFull = document.createElement("canvas");
    snapshotFull.width = vw;
    snapshotFull.height = vh;
    const fctx = snapshotFull.getContext("2d", { willReadFrequently: true });
    if (!fctx) return null;
    fctx.imageSmoothingEnabled = false;
    fctx.drawImage(video, 0, 0, vw, vh);
    ctx2d.drawImage(snapshotFull, sx, sy, sw, sh, 0, 0, sw, sh);
  } else {
    ctx2d.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
  }

  const upright = await detectUprightFace(faceDetector, canvas);

  const sampleSize = 16;
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!sampleCtx) return null;
  sampleCtx.imageSmoothingEnabled = false;
  sampleCtx.drawImage(canvas, 0, 0, sampleSize, sampleSize);
  const pixels = sampleCtx.getImageData(0, 0, sampleSize, sampleSize).data;
  const gray = [];
  let total = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const v = Math.round(0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2]);
    gray.push(v);
    total += v;
  }
  const avg = total / gray.length;
  const hash = gray.map((v) => (v >= avg ? "1" : "0")).join("");

  const blob = USE_FULL_FRAME_FOR_ANTISPOOF
    ? await encodeSnapshotCanvasForAntiSpoof(snapshotFull)
    : await encodeGuideCanvasForAntiSpoof(canvas);
  if (!blob) return null;
  return { blob, hash, upright };
}

export async function captureFrameBatch({
  targetCount,
  frameDelayMs,
  captureOne,
}) {
  const frames = [];
  for (let i = 0; i < targetCount; i += 1) {
    const frame = await captureOne();
    if (frame) frames.push(frame);
    await new Promise((resolve) => setTimeout(resolve, frameDelayMs));
  }
  return frames;
}
