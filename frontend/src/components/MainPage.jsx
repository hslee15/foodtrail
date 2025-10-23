import React from 'react';
import './styles/MainPage.scss'

function MainPage({ user, onLogout }) {
    return (
        <div className="main-container">
        <header className="main-header">
            <h1>FoodTrail</h1>
            <div className="user-info">
            <span>{user.displayName || user.email}님</span>
            <button onClick={onLogout} className="logout-button">
                로그아웃
            </button>
            </div>
        </header>

        <main className="content-area">
            <h2>환영합니다!</h2>
            <p>FoodTrail 서비스를 이용할 수 있습니다.</p>

            


        </main>
        </div>
    );
}
export default MainPage;