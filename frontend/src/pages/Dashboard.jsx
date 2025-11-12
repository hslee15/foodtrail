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

    // [수정] API 호출 로직
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            setError(null);

            // 1. 'isAdmin'과 'endpoint'를 *먼저* 정의합니다.
            const isAdmin = user && user.role === 'admin';
            const endpoint = isAdmin ? '/api/admin/posts' : '/api/posts/my';

            try {
                // 2. 정의된 endpoint를 *나중에* 사용합니다.
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
        
        if(user){ // user 정보가 로드된 후에 API 호출
            fetchPosts();
        }
    }, [user]); // user가 변경될 때(로그인 시) 다시 실행

    // [수정] 필터링 로직 (작성자 이름 검색 추가)
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

        setFilteredPosts(filtered);
        
    }, [searchTerm, ratingFilter, posts, user]); 

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // --- [ ⬇️ 1. 안전 가드 추가 ⬇️ ] ---
    // user가 null이면(로딩 중이거나 로그아웃 직후) 렌더링하지 않음
    if (!user) {
        return null; 
    }
    // --- [ ⬆️ 1. 여기까지 ⬆️ ] ---

    return (
        <div className="main-container">
        <header className="main-header">
            <h1>FoodTrail</h1>
            <div className="user-info">
            {/* [수정] 'user?.'로 안전하게 접근 */}
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
                // [수정] 'user?.'로 안전하게 접근
                placeholder={user?.role === 'admin' ? "맛집, 메뉴, 작성자 검색..." : "맛집, 메뉴, 리뷰 검색..."}
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
            {/* [수정] 'user?.'로 안전하게 접근 */}
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
                    
                    <div style={{ margin: `0.5rem 0`}}>
                        <StarRatingDisplay rating={post.rating} />
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
                    {/* [수정] 'user?.'로 안전하게 접근 */}
                    {searchTerm || ratingFilter > 0 ? `'${searchTerm}' 검색 결과가 없습니다.` : (user?.role === 'admin' ? '전체 게시물이 없습니다.' : '아직 작성된 게시물이 없습니다.')}
                </p>
                )
            )}
            </div>
        </main>
        </div>
    );
}
export default Dashboard;