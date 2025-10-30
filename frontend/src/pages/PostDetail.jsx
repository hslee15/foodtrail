import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/client"; // api 클라이언트 사용
import './style/PostDetail.scss'; // 스타일 시트 import

// App.jsx에서 user 객체를 prop으로 받습니다.
export default function PostDetail({ user }) {
  const { id } = useParams(); // URL에서 게시물 ID 가져오기
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false); // 삭제 로딩 상태
  const navigate = useNavigate(); // 페이지 이동을 위해 navigate 사용

  useEffect(() => {
    console.log("[PostDetail] id from URL:", id);
    if (!id || /[\{\}]/.test(id)) {
      console.warn("[PostDetail] invalid id detected:", id);
      setErr("잘못된 게시물 ID입니다. 카드 링크 또는 라우트 경로를 확인하세요. (예: /post/:id)");
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      setLoading(true); // 로딩 시작
      setErr(null); // 에러 초기화
      try {
        const path = `/api/posts/${id}`;
        console.log("[PostDetail] fetching:", path);
        // api 클라이언트를 사용하여 백엔드에서 게시물 데이터 가져오기
        const response = await api.get(path);
        setPost(response.data); // 상태 업데이트
      } catch (e) {
        console.error("게시물 로딩 실패:", e);
        const status = e?.response?.status;
        const message = e?.response?.data?.message;
        // 사용자에게 보여줄 에러 메시지 설정 (상태코드 포함)
        setErr(message ? `(${status || "에러"}) ${message}` : "게시물을 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false); // 로딩 종료
      }
    };

    fetchPost();
  }, [id]);

  // 삭제 버튼 핸들러
  const handleDelete = async () => {
    // 🚨 중요: 실제 서비스에서는 confirm() 대신 커스텀 모달을 사용해야 합니다.
    const isConfirmed = window.confirm("정말 이 게시물을 삭제하시겠습니까?");
    
    // 샌드박스 환경에서는 window.confirm이 null을 반환할 수 있습니다.
    // 여기서는 사용자가 '취소'를 누른 경우(false)에만 중단합니다.
    if (isConfirmed === false) { 
      console.log("삭제가 취소되었습니다.");
      return; 
    }

    // '확인'을 눌렀거나 confirm이 작동하지 않는 환경일 경우
    console.log("삭제를 진행합니다.");
    setIsDeleting(true); // 삭제 시작 (로딩)
    setErr(null);

    try {
      // 백엔드 삭제 API 호출
      await api.delete(`/api/posts/${id}`);
      // 🚨 alert도 커스텀 알림창으로 대체 권장
      alert("게시물이 삭제되었습니다.");
      navigate('/'); // 삭제 후 홈으로 이동
    } catch (err) {
      console.error("게시물 삭제 실패:", err);
      setErr("게시물 삭제 중 오류가 발생했습니다.");
      setIsDeleting(false); // 삭제 실패 시 로딩 해제
    }
  };


  // 로딩 중일 때 표시할 내용
  if (loading) return <div style={{ padding: 24 }}>게시물을 불러오는 중... ⏳</div>;
  // 에러 발생 시 표시할 내용
  if (err) return <div style={{ padding: 24, color: "crimson" }}>⚠️ {err}</div>;
  // 게시물 데이터가 없을 때 (정상적으로 로드됐지만 데이터가 없는 경우)
  if (!post) return <div style={{ padding: 24 }}>게시물 정보를 찾을 수 없습니다.</div>;

  // 현재 유저와 게시물 작성자가 일치하는지 확인
  // post.user는 백엔드에서 ObjectId(문자열)로 넘어옵니다.
  const isAuthor = user && post && user._id === post.user;

  // 게시물 데이터를 화면에 표시
  return (
    <div className="post-detail-container">
      {/* 목록으로 돌아가기 링크 */}
      <div className="post-detail-header">
        <Link to="/" className="back-link">
          ← 목록으로 돌아가기
        </Link>

        {/* 수정/삭제 버튼 영역 (작성자일 때만 보임) */}
        {isAuthor && (
          <div className="post-actions">
            <Link to={`/post/${id}/edit`} className="btn-edit">
              수정
            </Link>
            <button 
              onClick={handleDelete} 
              className="btn-delete"
              disabled={isDeleting} // 삭제 중 비활성화
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        )}
      </div>

      {/* [수정]
        post.presignedImageUrl 필드 하나만 확인하도록 이미지 블록을 통일합니다.
        (기존 post.fileUrl[0] 블록은 삭제)
      */}
      {post.presignedImageUrl && (
        <img
          src={post.presignedImageUrl} // 백엔드가 보내주는 표시용 URL
          alt={post.title}
          className="post-detail-image" // SCSS 스타일 적용
        />
      )}

      {/* 게시물 제목 */}
      <h1>{post.title}</h1>

      {/* 게시물 작성일 */}
      <p className="post-meta">
        작성일: {post.createdAt ? new Date(post.createdAt).toLocaleString() : '날짜 정보 없음'}
      </p>

      {/* 게시물 내용 */}
      <div className="post-content">
        {post.content}
      </div>
    </div>
  );
}

