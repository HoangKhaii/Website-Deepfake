import { useEffect, useState } from "react";

export default function OtpTimer() {
  const [time, setTime] = useState(120);

  useEffect(() => {
    if (time === 0) return;
    const t = setInterval(() => setTime(time - 1), 1000);
    return () => clearInterval(t);
  }, [time]);

  return (
    <div className="text-sm text-gray-500">
      OTP valid for: {Math.floor(time / 60)}:{String(time % 60).padStart(2, "0")}
      <br />
      {time === 0 && <button className="text-blue-500">Resend code</button>}
    </div>
  );
}
