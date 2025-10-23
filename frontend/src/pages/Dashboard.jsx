import React, { useState, useEffect } from 'react'; // 1. useState, useEffect 임포트
import './style/Dashboard.scss';

// 2. 실제 데이터 대신 사용할 임시 목업(Mock) 데이터
const mockPosts = [
    { 
        id: 1, 
        title: "우리 동네 파스타 맛집", 
        description: "최근에 발견한 최고의 파스타 가게! 면 익힘이 완벽해요.", 
        imageUrl: "https://via.placeholder.com/300x200?text=Pasta" 
    },
    { 
        id: 2, 
        title: "따뜻한 국밥 한 그릇", 
        description: "비 오는 날엔 역시 뜨끈한 국밥이죠. 깍두기도 맛있습니다.", 
        imageUrl: "https://via.placeholder.com/300x200?text=Gukbap" 
    },
    { 
        id: 3, 
        title: "인생 녹차 케이크", 
        description: "디저트 배는 따로 있죠. 쌉싸름한 녹차와 부드러운 크림의 조화.", 
        imageUrl: "https://via.placeholder.com/300x200?text=Green+Tea+Cake" 
    },
    { 
        id: 4, 
        title: "신선한 샐러드", 
        description: "건강한 한 끼 식사. 재료가 정말 신선해서 기분이 좋았습니다.", 
        imageUrl: "https://via.placeholder.com/300x200?text=Salad" 
    },
    ];


    function Dashboard({ user, onLogout }) {
    // 3. 검색어, 게시물 목록을 위한 State 추가
    const [posts, setPosts] = useState([]); // 원본 데이터
    const [filteredPosts, setFilteredPosts] = useState([]); // 검색 결과 데이터
    const [searchTerm, setSearchTerm] = useState(''); // 검색어

    // 4. 컴포넌트 마운트 시 임시 데이터 로드
    useEffect(() => {
        // (나중에 이 부분을 api.get('/api/posts') 같은 실제 API 호출로 대체하세요)
        setPosts(mockPosts);
        setFilteredPosts(mockPosts); // 처음엔 모든 게시물 표시
    }, []);

    // 5. 검색어(searchTerm)가 변경될 때마다 필터링 실행
    useEffect(() => {
        if (!searchTerm) {
        setFilteredPosts(posts); // 검색어가 없으면 전체 목록 표시
        } else {
        const lowerCaseSearch = searchTerm.toLowerCase();
        const filtered = posts.filter(post => 
            post.title.toLowerCase().includes(lowerCaseSearch) ||
            post.description.toLowerCase().includes(lowerCaseSearch)
        );
        setFilteredPosts(filtered);
        }
    }, [searchTerm, posts]); // searchTerm 또는 posts가 변경될 때마다 실행

    // 6. 검색창 입력 핸들러
    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    return (
        <div className="main-container">
        <header className="main-header">
            <h1>FoodTrail</h1>
            <div className="user-info">
            <span>{user?.displayName || user?.email}님</span>
            <button onClick={onLogout} className="logout-button">
                로그아웃
            </button>
            </div>
        </header>

        <main className="content-area">
            {/* 7. 검색 기능 UI 추가 */}
            <div className="search-container">
            <input
                type="text"
                placeholder="맛집, 메뉴, 리뷰 검색..."
                className="search-bar"
                value={searchTerm}
                onChange={handleSearchChange}
            />
            </div>
            
            {/* 8. 게시물 목록 UI 추가 */}
            <h2>내 FoodTrail 📝</h2>
            <div className="posts-grid">
            {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                <div className="post-card" key={post.id}>
                    <img src={post.imageUrl} alt={post.title} className="post-image" />
                    <div className="post-content">
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-description">{post.description}</p>
                    </div>
                </div>
                ))
            ) : (
                // 검색 결과가 없을 때
                <p className="no-results">'{searchTerm}'에 대한 검색 결과가 없습니다.</p>
            )}
            </div>
        </main>
        </div>
    );
}
export default Dashboard;