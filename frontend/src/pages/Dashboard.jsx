import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './style/Dashboard.scss';
import api from '../api/client';
import StarRatingDisplay from '../components/StarRatingDisplay';
import StarRatingInput from '../components/StarRatingInput'; 

const priceRangeClasses = {
    '비쌈': 'price-bad',   
    '보통': 'price-soso',    
    '가성비': 'price-great',  
};

function Dashboard({ user, onLogout }) {
    const [posts, setPosts] = useState([]); 
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState(0);
    const [priceFilter, setPriceFilter] = useState('전체'); 
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null); 

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);

            const isAdmin = user && user.role === 'admin';
            const endpoint = isAdmin ? '/api/admin/posts' : '/api/posts/my';

            try {
                const response = await api.get(endpoint); 
                
                setPosts(response.data);
                setFilteredPosts(response.data); 
            } catch (err) {
                console.error("게시물 로드 실패:", err);
                const defaultMsg = isAdmin ? "모든 게시물 로드 실패" : "내 게시물 로드 실패";
                setError(err?.response?.data?.message || defaultMsg); 
            } finally {
                setLoading(false);
            }
        };
        
        if(user){ 
            fetchPosts();
        }
    }, [user]); 

    useEffect(() => {
        let filtered = posts; 
        const isAdmin = user && user.role === 'admin';

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(post => {
                const titleMatch = post.title && post.title.toLowerCase().includes(lowerCaseSearch);
                const contentMatch = post.content && post.content.toLowerCase().includes(lowerCaseSearch);
                const authorMatch = isAdmin && post.user && (
                    (post.user.email && post.user.email.toLowerCase().includes(lowerCaseSearch)) ||
                    (post.user.displayName && post.user.displayName.toLowerCase().includes(lowerCaseSearch))
                );
                return titleMatch || contentMatch || authorMatch;
            });
        }

        if (ratingFilter > 0) {
            filtered = filtered.filter(post => post.rating === ratingFilter);
        }

        if (priceFilter !== '전체') {
            filtered = filtered.filter(post => post.priceRange === priceFilter);
        }

        setFilteredPosts(filtered);
        
    }, [searchTerm, ratingFilter, priceFilter, posts, user]); 

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    if (!user) {
        return null; 
    }

    return (
        <div className="main-container">
        <header className="main-header">
            <h1>FoodTrail</h1>
            <div className="user-info">
            <span>{user?.displayName || user?.email}님 {user?.role === 'admin' && '(관리자)'}</span>
            <button onClick={onLogout} className="logout-button">
                로그아웃
            </button>
            </div>
        </header>

        <main className="content-area">
            <div className="search-container">
            <input
                type="text"
                placeholder={user?.role === 'admin' ? "맛집, 메뉴, 작성자 검색..." : "맛집, 메뉴, 리뷰 검색..."}
                className="search-bar"
                value={searchTerm}
                onChange={handleSearchChange}
            />
            </div>
            
            <div className="filter-controls">
                <div className="rating-filter-container">
                    <span>별점:</span>
                    <StarRatingInput
                        rating={ratingFilter}
                        onRatingChange={setRatingFilter}
                    />
                </div>

            <div className="price-filter-container">
                <label htmlFor="priceFilter">가격대:</label>
                <select 
                    id="priceFilter"
                    className="price-filter-select"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                >
                    <option value="전체">전체</option>
                    <option value="가성비">가성비</option>
                    <option value="보통">보통</option>
                    <option value="비쌈">비쌈</option>
                </select>
                </div>
            </div>


            <div className="posts-header">
            <h2>{user?.role === 'admin' ? '전체 게시물 👩‍💻' : 'My List 📝'}</h2>
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
                    
                    <div className="post-info-row">
                        <StarRatingDisplay rating={post.rating} />
                        {post.priceRange && post.priceRange !== '선택안함' && (
                            <span className={`post-price-range-tag ${priceRangeClasses[post.priceRange] || ''}`}>
                                {post.priceRange}
                            </span>
                        )}
                    </div>

                    {user?.role === 'admin' && (
                        <p className="post-author">
                            작성자: {post.user?.displayName || post.user?.email || '알 수 없음'}
                        </p>
                    )}

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
                    {searchTerm || ratingFilter > 0 || priceFilter !== '전체' ? `'${searchTerm}' 검색 결과가 없습니다.` : (user?.role === 'admin' ? '전체 게시물이 없습니다.' : '아직 작성된 게시물이 없습니다.')}
                </p>
                )
            )}
            </div>
        </main>
        </div>
    );
}
export default Dashboard;