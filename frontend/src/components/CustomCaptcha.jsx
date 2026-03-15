import { useState, useEffect } from "react";

// Dữ liệu các loại hình ảnh với hình thật từ Unsplash
const IMAGE_SETS = [
  {
    id: "traffic",
    question: "Chọn tất cả hình có xe ô tô",
    images: [
      { id: 1, url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=100&h=100&fit=crop", isCorrect: true },
      { id: 2, url: "https://images.unsplash.com/photo-1580273916550-e323be2ed5fa?w=100&h=100&fit=crop", isCorrect: false },
      { id: 3, url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop", isCorrect: true },
      { id: 4, url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=100&h=100&fit=crop", isCorrect: false },
      { id: 5, url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=100&h=100&fit=crop", isCorrect: false },
      { id: 6, url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d1?w=100&h=100&fit=crop", isCorrect: false },
      { id: 7, url: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=100&h=100&fit=crop", isCorrect: false },
      { id: 8, url: "https://images.unsplash.com/photo-1533473359331-0135ef1bcfb0?w=100&h=100&fit=crop", isCorrect: false },
      { id: 9, url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=100&h=100&fit=crop", isCorrect: true },
    ]
  },
  {
    id: "street",
    question: "Chọn tất cả hình có đường phố",
    images: [
      { id: 1, url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=100&h=100&fit=crop", isCorrect: true },
      { id: 2, url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100&h=100&fit=crop", isCorrect: false },
      { id: 3, url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=100&h=100&fit=crop", isCorrect: true },
      { id: 4, url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=100&h=100&fit=crop", isCorrect: false },
      { id: 5, url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=100&h=100&fit=crop", isCorrect: true },
      { id: 6, url: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=100&h=100&fit=crop", isCorrect: false },
      { id: 7, url: "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=100&h=100&fit=crop", isCorrect: false },
      { id: 8, url: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=100&h=100&fit=crop", isCorrect: false },
      { id: 9, url: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=100&h=100&fit=crop", isCorrect: false },
    ]
  },
  {
    id: "nature",
    question: "Chọn tất cả hình có cây cối",
    images: [
      { id: 1, url: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=100&h=100&fit=crop", isCorrect: true },
      { id: 2, url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", isCorrect: false },
      { id: 3, url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=100&h=100&fit=crop", isCorrect: true },
      { id: 4, url: "https://images.unsplash.com/photo-1504567961542-e24d9439a724?w=100&h=100&fit=crop", isCorrect: false },
      { id: 5, url: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=100&h=100&fit=crop", isCorrect: false },
      { id: 6, url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&h=100&fit=crop", isCorrect: true },
      { id: 7, url: "https://images.unsplash.com/photo-1505765050516-f72dcac9c60e?w=100&h=100&fit=crop", isCorrect: false },
      { id: 8, url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=100&h=100&fit=crop", isCorrect: false },
      { id: 9, url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=100&h=100&fit=crop", isCorrect: false },
    ]
  },
  {
    id: "building",
    question: "Chọn tất cả hình có tòa nhà",
    images: [
      { id: 1, url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=100&h=100&fit=crop", isCorrect: true },
      { id: 2, url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", isCorrect: false },
      { id: 3, url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop", isCorrect: true },
      { id: 4, url: "https://images.unsplash.com/photo-1464938050520-ef2571bbdd29?w=100&h=100&fit=crop", isCorrect: false },
      { id: 5, url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=100&h=100&fit=crop", isCorrect: false },
      { id: 6, url: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=100&h=100&fit=crop", isCorrect: false },
      { id: 7, url: "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?w=100&h=100&fit=crop", isCorrect: true },
      { id: 8, url: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=100&h=100&fit=crop", isCorrect: false },
      { id: 9, url: "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?w=100&h=100&fit=crop", isCorrect: false },
    ]
  },
];

// Xáo trộn mảng
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function CustomCaptcha({ onSuccess, onClose }) {
  const [challenge, setChallenge] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Chọn ngẫu nhiên 1 challenge
    const randomChallenge = IMAGE_SETS[Math.floor(Math.random() * IMAGE_SETS.length)];
    // Xáo trộn hình ảnh
    const shuffledImages = shuffleArray(randomChallenge.images);
    setChallenge({
      ...randomChallenge,
      images: shuffledImages
    });
  }, []);

  const handleSelect = (imageId) => {
    if (verified || isVerifying) return;
    
    setError(false);
    if (selected.includes(imageId)) {
      setSelected(selected.filter((id) => id !== imageId));
    } else {
      setSelected([...selected, imageId]);
    }
  };

  const handleVerify = () => {
    if (selected.length === 0) return;
    
    setIsVerifying(true);
    
    // Giả lập xác minh
    setTimeout(() => {
      const correctImages = challenge.images.filter(img => img.isCorrect);
      const correctIds = correctImages.map(img => img.id);
      
      // Kiểm tra: chọn đúng hết và không chọn hình sai
      const isCorrect = 
        selected.length === correctIds.length &&
        selected.every(id => correctIds.includes(id));
      
      if (isCorrect) {
        setVerified(true);
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        setError(true);
        setSelected([]);
        // Tạo challenge mới
        const randomChallenge = IMAGE_SETS[Math.floor(Math.random() * IMAGE_SETS.length)];
        const shuffledImages = shuffleArray(randomChallenge.images);
        setChallenge({
          ...randomChallenge,
          images: shuffledImages
        });
      }
      setIsVerifying(false);
    }, 800);
  };

  const handleRetry = () => {
    setError(false);
    setSelected([]);
    const randomChallenge = IMAGE_SETS[Math.floor(Math.random() * IMAGE_SETS.length)];
    const shuffledImages = shuffleArray(randomChallenge.images);
    setChallenge({
      ...randomChallenge,
      images: shuffledImages
    });
  };

  if (!challenge) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-2xl max-w-[400px] w-full overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-base">Xác minh bạn là người</h3>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Question */}
        <div className="mb-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{challenge.question}</span>
          </p>
        </div>

        {/* Image Grid - 3x3 */}
        <div className="grid grid-cols-3 gap-1 mb-3 bg-gray-200 p-1 rounded-lg">
          {challenge.images.map((image) => (
            <button
              key={image.id}
              onClick={() => handleSelect(image.id)}
              disabled={verified || isVerifying}
              className={`
                aspect-square rounded-md overflow-hidden transition-all duration-200
                relative border-2
                ${
                  selected.includes(image.id)
                    ? "border-cyan-500 ring-2 ring-cyan-500/50 scale-95"
                    : "border-transparent hover:border-white hover:scale-105"
                }
                ${error ? "opacity-50" : ""}
                cursor-pointer
              `}
            >
              <img 
                src={image.url} 
                alt="" 
                className="w-full h-full object-cover"
              />
              {selected.includes(image.id) && (
                <div className="absolute top-1 right-1 bg-cyan-500 rounded-full p-0.5">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sai rồi. Vui lòng thử lại.
            </p>
          </div>
        )}

        {/* Verified message */}
        {verified && (
          <div className="mb-3 p-2 bg-cyan-50 border border-cyan-200 rounded-md">
            <p className="text-xs text-cyan-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Xác minh thành công!
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <button
            onClick={handleRetry}
            disabled={isVerifying}
            className="text-sm text-gray-500 hover:text-gray-700 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Tải lại
          </button>
          <button
            onClick={handleVerify}
            disabled={selected.length === 0 || isVerifying || verified}
            className={`
              px-5 py-2 rounded-md text-sm font-medium transition flex items-center gap-2
              ${
                selected.length === 0 || verified
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600"
              }
            `}
          >
            {isVerifying ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xác minh...
              </>
            ) : verified ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Đã xác minh
              </>
            ) : (
              "Xác minh"
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-center gap-1 text-[11px] text-gray-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Bảo mật bởi DeepCheck
        </div>
      </div>
    </div>
  );
}
