import React, { useState, useEffect } from 'react';
import {Link} from 'react-router-dom';
import './style/Dashboard.scss';
import api from '../api/client';

    function Dashboard({ user, onLogout }) {
        const [posts, setPosts] = useState([]); 
        const [filteredPosts, setFilteredPosts] = useState([]);
        const [searchTerm, setSearchTerm] = useState('');
        const [loading, setLoading]=useState(true);
        const [error, setError]=useState(null);

    useEffect(() => {

        const fetchPosts=async()=>{
            setLoading(true);
            setError(null);
            try {
                const response=await api.get('/api/posts');
                setPosts(response.data);
                setFilteredPosts(response.data);
            } catch (error) {
                console.error("게시물 로드 실패:",err);
                setError("게시물을 불러오는 데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchPosts();
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
            <Link to="/create" className='btn-create-post'>
                새 글 작성하기 +
            </Link>
            {loading && <p>게시물을 불러오는 중... ⏳</p>}
            {error && <p className="error-message" style={{color: "crimson"}}>{error}</p>}
            <div className="posts-grid">
            {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                <Link to={`/post/${post.number}`} key={post._id} className="post-card">
                    <img src={post.imageUrl} alt={post.title} className="post-image" />
                    <div className="post-content">
                    <h3 className="post-title">{post.title}</h3>
                    <p className="post-description">{post.description}</p>
                    </div>
                </Link>
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