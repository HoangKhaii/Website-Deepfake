/** Chuẩn hoá phản hồi AI cho frontend — tách khỏi controller (SRP). */
function normalizeDetectPayload(aiResult, source) {
  if (!aiResult.class) return aiResult;
  const confidence = aiResult.confidence || aiResult.probabilities?.[aiResult.class] || 0.5;
  return {
    isDeepfake:
      aiResult.class.toLowerCase().includes('fake') ||
      aiResult.class.toLowerCase().includes('deepfake') ||
      aiResult.class === 'fake',
    score: confidence,
    probabilities: aiResult.probabilities,
    class: aiResult.class,
    source,
    media_type: aiResult.media_type,
    frames_used: aiResult.frames_used,
    filename: aiResult.filename,
  };
}

module.exports = { normalizeDetectPayload };
