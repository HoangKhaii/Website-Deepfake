import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import { useNotification } from "../../components/Notification";
import { detectUploadAiMedia } from "../../services/api";
import { appendLog } from "../../services/storage";
import { analyzeVisualSignals, isImage } from "./analysisUtils";

export function useLandingDetection() {
  const navigate = useNavigate();
  const { user, logout: sessionLogout } = useSession();
  const { success, error: showError } = useNotification();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedScoreDetails, setExpandedScoreDetails] = useState({});
  const [visualSignals, setVisualSignals] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const logout = useCallback(() => {
    appendLog({ type: "logout", email: user?.email });
    sessionLogout();
    success("Logged out successfully! See you next time.");
    navigate("/");
  }, [user?.email, sessionLogout, success, navigate]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setResult(null);
      setError(null);
    }
  };

  const handleCheck = async () => {
    if (!file) {
      setError("Please select a video or image file.");
      showError("Please select a video or image file.");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setVisualSignals(null);
    try {
      const imageFile = isImage(file);
      const signalData = await analyzeVisualSignals(file, imageFile);
      setVisualSignals(signalData);
      const data = await detectUploadAiMedia(file, user?.user_id);
      setResult(data);
      appendLog({
        type: "detect",
        email: user?.email,
        meta: { mediaType: imageFile ? "image" : "video", fileName: file.name, size: file.size, verdict: data?.isDeepfake, score: data?.score },
      });

      if (data?.isDeepfake) {
        success(`Analysis complete: Deepfake detected with ${((data?.score || 0) * 100).toFixed(1)}% confidence`);
      } else {
        success(`Analysis complete: Content is authentic with ${((data?.score || 0) * 100).toFixed(1)}% confidence`);
      }
    } catch (err) {
      const errorMsg = err.message || "Check failed. Please try again.";
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetCheck = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setVisualSignals(null);
    setError(null);
    setExpandedScoreDetails({});
    const el = document.getElementById("media-upload");
    if (el) el.value = "";
  };

  return {
    user,
    logout,
    file,
    previewUrl,
    loading,
    result,
    error,
    expandedScoreDetails,
    setExpandedScoreDetails,
    visualSignals,
    handleFileChange,
    handleCheck,
    resetCheck,
  };
}
