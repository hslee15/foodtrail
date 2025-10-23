import React from 'react';
import { useNavigate } from 'react-router-dom';
import './style/Landing.scss';


function Landing({ onStartClick }) {

  const navigate=useNavigate();
  const handleStartClick=()=>{
    navigate('/login');
  }

  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>FoodTrail</h1>
        <p>당신의 맛있는 여정을 기록하고 공유하세요.</p>
      </header>

      <main className="landing-main">
        <button onClick={handleStartClick} className="start-button">
          시작하기
        </button>
      </main>
    </div>
  );
}

export default Landing;