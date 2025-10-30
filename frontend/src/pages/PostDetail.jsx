import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import './style/PostDetail.scss'; // 스타일 시트 import

export default function PostDetail({ user }) {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // ... (id 유효성 검사) ...
    if (!id || /[\{\}]/.test(id)) {
      console.warn('[PostDetail] invalid id detected:', id);
      setErr('잘못된 게시물 ID입니다.');
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      setLoading(true);
      setErr(null);
      try {
        const path = `/api/posts/${id}`;
        console.log('[PostDetail] fetching:', path);
        const response = await api.get(path);
        setPost(response.data);
      } catch (e) {
        console.error('게시물 로딩 실패:', e);
        const status = e?.response?.status;
        const message = e?.response?.data?.message;
        setErr(
          message
            ? `(${status || '에러'}) ${message}`
            : '게시물을 불러오는 중 오류가 발생했습니다.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleDelete = async () => {
    // 🚨 실제 서비스에서는 confirm() 대신 커스텀 모달을 사용해야 합니다.
    const isConfirmed = window.confirm('정말 이 게시물을 삭제하시겠습니까?');
    if (!isConfirmed) {
      console.log('삭제 취소');
      return; // 사용자가 '취소'를 누르면 중단
    }

    try {
      setLoading(true); // 삭제 시작 시 로딩
      await api.delete(`/api/posts/${id}`);
      console.log('게시물이 삭제되었습니다.');
      navigate('/');
    } catch (err) {
      console.error('게시물 삭제 실패:', err);
      setErr('게시물 삭제 중 오류가 발생했습니다.');
      setLoading(false); // 실패 시 로딩 해제
    }
  };

  if (loading)
    return <div className="post-detail-message">게시물을 불러오는 중... ⏳</div>;
  if (err)
    return (
      <div className="post-detail-message error">
        ⚠️ {err}
      </div>
    );
  if (!post)
    return <div className="post-detail-message">게시물 정보를 찾을 수 없습니다.</div>;

  const isAuthor = user && post && user._id === post.user;

  return (
    <div className="post-detail-container">
      <Link to="/" className="back-link">
        ← 목록으로 돌아가기
      </Link>

      {isAuthor && (
        <div className="post-actions">
          <Link to={`/post/${id}/edit`} className="btn-edit">
            수정
          </Link>
          <button
            onClick={handleDelete}
            className="btn-delete"
            disabled={loading}
          >
            {loading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      )}

      {post.presignedImageUrl && (
        <img
          src={post.presignedImageUrl}
          alt={post.title}
          className="post-detail-image"
        />
      )}

      <h1 className="post-detail-title">{post.title}</h1>

      <p className="post-detail-date">
        작성일:{' '}
        {post.createdAt
          ? new Date(post.createdAt).toLocaleString()
          : '날짜 정보 없음'}
      </p>

      <div className="post-detail-content">{post.content}</div>
    </div>
  );
}

