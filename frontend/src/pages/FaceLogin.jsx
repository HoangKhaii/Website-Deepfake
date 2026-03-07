import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export default function FaceLogin() {
  const videoRef = useRef();
  const nav = useNavigate();
  const { user, faceUsers } = useSession();
  const hasFace = user?.hasFace || (user?.email && faceUsers[user.email]);

  useEffect(() => {
    if (!hasFace) {
      alert("Account has not registered face yet!");
      nav("/");
    }

    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => (videoRef.current.srcObject = stream));
  }, [hasFace, nav]);
  

  const handleLogin = () => {
    nav("/");
  };

  return (
    <div className="center">
      <div className="card">
        <h2>Face Authentication</h2>
        <video ref={videoRef} autoPlay className="w-full rounded mt-3" />
        <button className="btn mt-4" onClick={handleLogin}>
          Scan Face
        </button>
      </div>
    </div>
  );
}
