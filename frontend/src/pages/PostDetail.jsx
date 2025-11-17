import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/client.js"; // .js 확장자 추가
import './style/PostDetail.scss'; 
import StarRatingDisplay from "../components/StarRatingDisplay.jsx"; // .jsx 확장자 추가
// [ 1. PriceRangeDisplay 임포트 제거 ]

export default function PostDetail({ user }) {
  const { id } = useParams(); 
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); 
  const navigate = useNavigate(); 

  useEffect(() => {
    console.log("[PostDetail] id from URL:", id);
    if (!id || /[\{\}]/.test(id)) {
      console.warn("[PostDetail] invalid id detected:", id);
      setErr("잘못된 게시물 ID입니다. 카드 링크 또는 라우트 경로를 확인하세요. (예: /post/:id)");
      setLoading(false);
      return;
    }
    const fetchPost = async () => {
      setLoading(true); 
      setErr(null); 
      try {
        const path = `/api/posts/${id}`;
        console.log("[PostDetail] fetching:", path);
        const response = await api.get(path);
        setPost(response.data); 
      } catch (e) {
        console.error("게시물 로딩 실패:", e);
        const status = e?.response?.status;
        const message = e?.response?.data?.message;
        setErr(message ? `(${status || "에러"}) ${message}` : "게시물을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false); 
      }
    };
    fetchPost();
  }, [id]);

  const isAuthor = user && post && user._id === post.user;
  const isAdmin = user && user.role === 'admin';

  const handleDelete = async () => {
    
    // [수정] 관리자/작성자 여부에 따라 확인 메시지 변수 사용
    const confirmMessage = isAdmin && !isAuthor
      ? "관리자 권한으로 이 게시물을 삭제하시겠습니까?"
      : "정말 이 게시물을 삭제하시겠습니까?";

    // [수정] window.confirm 대신 console.log와 return 사용 (미리보기 환경)
    console.log("삭제 확인:", confirmMessage); 
    // const isConfirmed = window.confirm(confirmMessage); 
    // if (isConfirmed === false) { 
    //   console.log("삭제가 취소되었습니다.");
    //   return; 
    // }
    console.log("삭제를 진행합니다.");
    setIsDeleting(true); 
    setErr(null);
    try {
      // [수정] 논리 오류 수정 (isAdmin && !isAuthor)
      if (isAdmin && !isAuthor) {
        await api.delete(`/api/admin/posts/${id}`);
      } else {
        await api.delete(`/api/posts/${id}`);
      }
      // [수정] 중복되던 API 호출 삭제
      // await api.delete(`/api/posts/${id}`); // <- 이 부분이 중복이었음
      
      // [수정] alert() 대신 console.log() 사용
      console.log("게시물이 삭제되었습니다.");
      navigate('/'); 
    } catch (err) {
      console.error("게시물 삭제 실패:", err);
      setErr("게시물 삭제 중 오류가 발생했습니다.");
      setIsDeleting(false); 
    }
  };

  if (loading) return <div style={{ padding: 24 }}>게시물을 불러오는 중... ⏳</div>;
  if (err) return <div style={{ padding: 24, color: "crimson" }}>⚠️ {err}</div>;
  if (!post) return <div style={{ padding: 24 }}>게시물 정보를 찾을 수 없습니다.</div>;

  return (
    <div className="post-detail-container">
      <div className="post-detail-header">
        <Link to="/" className="back-link">
          ← 목록으로 돌아가기
        </Link>
      </div>

      {post.presignedImageUrl && (
        <img
          src={post.presignedImageUrl}
          alt={post.title}
          className="post-detail-image"
        />
      )}

      {/* 제목 헤더 */}
      <div className="post-title-header">
        <h1>{post.title}</h1>
        <p className="post-meta">
          {post.createdAt ? new Date(post.createdAt).toLocaleString() : '날짜 정보 없음'}
        </p>
      </div>
      {/* --- [ ⬆️ 1. 여기까지 ⬆️ ] --- */}


      {/* [ 2. 수정된 부분: 별점 및 가격대 표시 ] */}
      <div className="post-info-row detail">
        <StarRatingDisplay rating={post.rating} />
        {/* 가격대 텍스트 태그 표시 */}
        {post.priceRange && post.priceRange !== '선택안함' && (
          <span className="post-price-range-tag">{post.priceRange}</span>
        )}
      </div>
      {/* [ 2. 여기까지 수정 ] */}

      <div className="post-content">
        {post.content}
      </div>

      {isAuthor && (
        <div className="post-actions">
          <Link to={`/post/${id}/edit`} className="btn-edit">
            수정
          </Link>
          <button 
            onClick={handleDelete} 
            className="btn-delete"
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      )}

      {isAdmin && !isAuthor && (
        <div className="post-actions admin-actions">
          <button
            onClick={handleDelete}
            className="btn-delete-admin"
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중...' : '관리자 삭제'}
          </button>
        </div> 
      )}
    </div> 
  );
}