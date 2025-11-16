import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/Landing.scss';

const images = [
  '/images/p.jpg', // 파스타
  '/images/s.jpg', // 샐러드
  '/images/g.jpg', // 국밥
  '/images/c.jpg', // 케이크
];

function Landing() {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0); 

  const handleStartClick = () => {
    navigate('/login');
  };

  // 배경 이미지 슬라이드쇼 효과
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000); 

    return () => clearInterval(intervalId);
  }, []);

  const backgroundImageUrl = `url(${images[currentImageIndex]})`;

  return (
    <div className="landing-container">
      <div className="landing-overlay"></div> 
      
      <div className="landing-content"> 
        <header className="landing-header">
          <h1>FoodTrail</h1>
          <p>당신의 맛있는 여정을 기록하고 공유하세요.</p>
        </header>

        <main className="landing-main">
          <button onClick={handleStartClick} className="start-button">
            시작하기
          </button>
        </main>

        <div className="animated-previews">
          <img 
            src="/images/p.jpg" 
            alt="Preview Pasta" 
            className="preview-image" 
          />
          <img 
            src="/images/g.jpg" 
            alt="Preview Gukbap" 
            className="preview-image" 
          />
          <img 
            src="/images/s.jpg" 
            alt="Preview Salad" 
            className="preview-image" 
          />
        </div>
        {/* --- [ ⬆️ 1. 여기까지 ⬆️ ] --- */}

      </div>
    </div>
  );
}

export default Landing;