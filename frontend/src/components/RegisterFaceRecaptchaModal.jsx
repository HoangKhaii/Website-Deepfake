import { useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

/** reCAPTCHA v2 before POST /auth/register-face (token sent in FormData). */
export default function RegisterFaceRecaptchaModal({ siteKey, onSubmitToken, onClose }) {
  const recaptchaRef = useRef(null);
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    if (!token || busy) return;
    setBusy(true);
    try {
      await onSubmitToken(token);
    } catch {
      recaptchaRef.current?.reset();
      setToken(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden font-sans max-w-md w-full border border-slate-200">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">reCAPTCHA verification</h3>
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10 disabled:opacity-50"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-sm text-slate-600">
          Complete the check below, then tap <span className="font-medium text-slate-800">Submit face registration</span> so the server can analyze your photos.
        </p>
        <div className="flex justify-center">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={siteKey}
            hl="en"
            onChange={(t) => setToken(t)}
            onExpired={() => {
              setToken(null);
            }}
          />
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!token || busy}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-500 hover:to-cyan-400 transition"
          >
            {busy ? "Processing…" : "Submit face registration"}
          </button>
        </div>
      </div>
    </div>
  );
}
