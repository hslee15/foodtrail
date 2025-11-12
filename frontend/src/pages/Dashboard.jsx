import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './style/Dashboard.scss';
import api from '../api/client';
import StarRatingDisplay from '../components/StarRatingDisplay';
import StarRatingInput from '../components/StarRatingInput'; 

function Dashboard({ user, onLogout }) {
    const [posts, setPosts] = useState([]); 
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState(0);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get('/api/posts/my');
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
    }, []);

    useEffect(() => {
        let filtered = posts; 

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(post => 
                (post.title && post.title.toLowerCase().includes(lowerCaseSearch)) ||
                (post.content && post.content.toLowerCase().includes(lowerCaseSearch))
            );
        }

        if (ratingFilter > 0) {
            filtered = filtered.filter(post => post.rating === ratingFilter);
        }

        setFilteredPosts(filtered);
        
    }, [searchTerm, ratingFilter, posts]); 

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
            <div className="search-container">
            <input
                type="text"
                placeholder="맛집, 메뉴, 리뷰 검색..."
                className="search-bar"
                value={searchTerm}
                onChange={handleSearchChange}
            />
            </div>
            
            <div className="rating-filter-container">
                <span>별점으로 검색:</span>
                <StarRatingInput
                    rating={ratingFilter}
                    onRatingChange={setRatingFilter}
                />
            </div>

            <div className="posts-header">
            <h2>My List 📝</h2>
            <Link to="/create" className="btn-create-post">
                새 글 작성하기 ＋
            </Link>
            </div>
            
            {loading && <p>게시물을 불러오는 중... ⏳</p>}
            {error && <p className="error-message" style={{color: "crimson"}}>{error}</p>}

            <div className="posts-grid">
            {!loading && !error && filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                <Link to={`/post/${post.number}`} key={post._id} className="post-card">
                    
                    {post.presignedImageUrl ? (
                    <img 
                        src={post.presignedImageUrl}
                        alt={post.title} 
                        className="post-image" 
                    />
                    ) : (
                    <div className="post-image" />
                    )}
                    <div className="post-content">
                    <h3 className="post-title">{post.title}</h3>
                    
                    <div style={{ margin: `0.5rem 0`, fontSize:`1.5rem`}}>
                        <StarRatingDisplay rating={post.rating} />
                    </div>
                    <p className="post-description">{post.content?.substring(0, 60)}...</p>
                    <p className="post-date">
                        {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    </div>
                </Link>
                ))
            ) : (
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