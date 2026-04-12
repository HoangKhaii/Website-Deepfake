/**
 * Facade gọi API — re-export theo miền (ISP: consumer chỉ import một barrel nếu muốn).
 */
export { API_BASE, API_BASE_CANDIDATES, request, fetchWithApiFallback } from "./http/client.js";
export {
  register,
  login,
  otpSend,
  otpVerify,
  registerOtpSend,
  registerOtpVerify,
  getMe,
  registerFace,
  verifyFace,
  forgotPasswordEmail,
  forgotPasswordVerify,
} from "./http/authApi.js";
export {
  detectVideo,
  detectImage,
  detectUploadAiVideo,
  detectUploadAiImage,
  detectUploadAiMedia,
} from "./http/detectApi.js";
