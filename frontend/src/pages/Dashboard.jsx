import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './style/Dashboard.scss';
import api from '../api/client'; // 1. api 클라이언트 import

// 2. mockPosts (가짜 데이터) 삭제

function Dashboard({ user, onLogout }) {
    const [posts, setPosts] = useState([]); 
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true); // 3. 로딩 상태 추가
    const [error, setError] = useState(null); // 3. 에러 상태 추가

    // 4. API 호출을 위한 useEffect 추가 (mockPosts 대신)
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            try {
                // 백엔드 API에서 실제 게시물 목록을 가져옵니다.
                const response = await api.get('/api/posts');
                // 백엔드 posts.js (GET /) 라우터는 fileUrl을 S3 주소 배열로 변환해서 줍니다.
                setPosts(response.data);
                setFilteredPosts(response.data);
            } catch (err) {
                console.error("게시물 로드 실패:", err);
                setError("게시물을 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []); // 처음 한 번만 실행

    // 5. [버그 수정] 검색 로직: post.description -> post.content
    useEffect(() => {
        if (!searchTerm) {
        setFilteredPosts(posts);
        } else {
        const lowerCaseSearch = searchTerm.toLowerCase();
        const filtered = posts.filter(post => 
            (post.title && post.title.toLowerCase().includes(lowerCaseSearch)) ||
            (post.content && post.content.toLowerCase().includes(lowerCaseSearch)) // 'description' 대신 'content'
        );
        setFilteredPosts(filtered);
        }
    }, [searchTerm, posts]);

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
            {/* 검색 기능 UI */}
            <div className="search-container">
            <input
                type="text"
                placeholder="맛집, 메뉴, 리뷰 검색..."
                className="search-bar"
                value={searchTerm}
                onChange={handleSearchChange}
            />
            </div>
            
            {/* 게시물 목록 헤더 (제목 + 글쓰기 버튼) */}
            <div className="posts-header">
            <h2>내 FoodTrail 📝</h2>
            <Link to="/create" className="btn-create-post">
                새 글 작성하기 ＋
            </Link>
            </div>
            
            {/* 6. 로딩 및 에러 처리 UI */}
            {loading && <p>게시물을 불러오는 중... ⏳</p>}
            {error && <p className="error-message" style={{color: "crimson"}}>{error}</p>}

            <div className="posts-grid">
            {!loading && !error && filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                // 7. [수정] 링크 경로는 post.number (PostDetail이 number를 ID로 사용)
                <Link to={`/post/${post.number}`} key={post._id} className="post-card">
                    
                    {/* 8. [이미지 수정] 
                    GET /api/posts/ (목록) 라우터는 'fileUrl' 배열에 Presigned URL을 담아옵니다.
                    */}
                    <img 
                    src={post.fileUrl?.[0] || "/images/p.jpg"} // 첫 번째 이미지를 썸네일로 사용 (없으면 기본 이미지)
                    alt={post.title} 
                    className="post-image" 
                    // 썸네일이 깨질 경우를 대비한 기본 이미지
                    onError={(e) => { e.target.onerror = null; e.target.src = "/images/p.jpg"; }}
                    />
                    <div className="post-content">
                    <h3 className="post-title">{post.title}</h3>
                    {/* 9. [버그 수정] 본문: post.description -> post.content */}
                    <p className="post-description">{post.content?.substring(0, 60)}...</p>
                    </div>
                </Link>
                ))
            ) : (
                // 검색 결과가 없거나 데이터가 없을 때
                !loading && !error && (
                <p className="no-results">
                    {searchTerm ? `'${searchTerm}'에 대한 검색 결과가 없습니다.` : '아직 작성된 게시물이 없습니다.'}
                </p>
                )
            )}
            </div>
        </main>
        </div>
    );
}
export default Dashboard;

