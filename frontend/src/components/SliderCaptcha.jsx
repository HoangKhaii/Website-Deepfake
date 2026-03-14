import { useState, useRef, useEffect, useCallback } from "react";

export default function SliderCaptcha({ onSuccess, onClose }) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);
  const [targetPosition, setTargetPosition] = useState(0);
  const sliderRef = useRef(null);
  const trackRef = useRef(null);

  // Random target position between 30% and 70%
  useEffect(() => {
    const randomPos = Math.floor(Math.random() * 40) + 30; // 30-70%
    setTargetPosition(randomPos);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (verified || isVerifying) return;
    setIsDragging(true);
    setError(false);
  }, [verified, isVerifying]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    let newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    newPosition = Math.max(0, Math.min(100, newPosition));
    setSliderPosition(newPosition);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    // Check if slider is close enough to target (within 5%)
    const diff = Math.abs(sliderPosition - targetPosition);
    
    if (diff <= 5) {
      setIsVerifying(true);
      setSliderPosition(100);
      
      setTimeout(() => {
        setVerified(true);
        setTimeout(() => {
          onSuccess();
        }, 500);
        setIsVerifying(false);
      }, 600);
    } else {
      setError(true);
      setTimeout(() => {
        setSliderPosition(0);
        setError(false);
        // New random position on error
        const randomPos = Math.floor(Math.random() * 40) + 30;
        setTargetPosition(randomPos);
      }, 500);
    }
  }, [isDragging, sliderPosition, targetPosition, onSuccess]);

  // Touch events for mobile
  const handleTouchStart = useCallback((e) => {
    if (verified || isVerifying) return;
    setIsDragging(true);
    setError(false);
  }, [verified, isVerifying]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !trackRef.current || !e.touches[0]) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    let newPosition = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    newPosition = Math.max(0, Math.min(100, newPosition));
    setSliderPosition(newPosition);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-[380px] w-full overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Xác minh bảo mật</h3>
              <p className="text-white/70 text-xs">Kéo thanh trượt đến vị trí đúng</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Puzzle Preview */}
        <div className="relative mb-5">
          <div className="bg-slate-100 rounded-xl p-3">
            <div className="flex items-center justify-center gap-1 mb-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-400 rounded flex items-center justify-center text-white text-xs font-bold"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Slider Track */}
            <div 
              ref={trackRef}
              className="relative h-14 bg-slate-200 rounded-lg overflow-hidden"
            >
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-30">
                <div className="w-full h-full grid grid-cols-8 gap-0.5">
                  {[...Array(32)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`${i % 2 === 0 ? 'bg-indigo-300' : 'bg-purple-300'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Target indicator */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500 opacity-60"
                style={{ left: `${targetPosition}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-500 rotate-45"></div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-500 rotate-45"></div>
              </div>

              {/* Target icon */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 text-green-600 opacity-40"
                style={{ left: `calc(${targetPosition}% - 12px)` }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Slider Button */}
              <div
                ref={sliderRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                className={`
                  absolute top-1 bottom-1 w-12 rounded-lg cursor-grab active:cursor-grabbing
                  transition-transform duration-100
                  flex items-center justify-center
                  ${error 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/30' 
                    : verified || sliderPosition >= 99
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30 hover:scale-105'
                  }
                  ${isDragging ? 'scale-110 z-10' : ''}
                  ${verified ? 'z-10' : ''}
                `}
                style={{ 
                  left: `calc(${sliderPosition}% - 24px)`,
                  boxShadow: error 
                    ? '0 4px 15px rgba(239, 68, 68, 0.4)' 
                    : verified 
                      ? '0 4px 15px rgba(34, 197, 94, 0.4)'
                      : '0 4px 15px rgba(99, 102, 241, 0.3)'
                }}
              >
                {error ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : verified || sliderPosition >= 99 ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Instruction */}
          <div className="text-center mt-3">
            <p className="text-sm font-medium text-slate-600">
              {error ? (
                <span className="text-red-500 flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sai vị trí! Thử lại
                </span>
              ) : verified || sliderPosition >= 99 ? (
                <span className="text-green-600 flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Xác minh thành công!
                </span>
              ) : (
                <span className="text-slate-500">
                  Kéo thanh trượt sang phải đến vị trí đích
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {isVerifying && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3">
            <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-indigo-700 font-medium">Đang xác minh...</span>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Bảo mật bởi</span>
          <span className="font-semibold text-indigo-600">DeepCheck</span>
        </div>
      </div>
    </div>
  );
}
