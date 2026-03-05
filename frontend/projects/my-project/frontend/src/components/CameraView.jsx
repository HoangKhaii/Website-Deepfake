import { useEffect, useRef } from "react";

export default function CameraView() {
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch(() => {
        alert("Could not access camera");
      });
  }, []);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full rounded-xl border"
    />
  );
}
