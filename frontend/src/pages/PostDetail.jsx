import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client"; // api 클라이언트 사용

export default function PostDetail() {
  const { id } = useParams(); // URL에서 게시물 ID 가져오기
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    // ✅ 파라미터 유효성 검사 & 디버그 로그
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

  // 로딩 중일 때 표시할 내용
  if (loading) return <div style={{ padding: 24 }}>게시물을 불러오는 중... ⏳</div>;
  // 에러 발생 시 표시할 내용
  if (err) return <div style={{ padding: 24, color: "crimson" }}>⚠️ {err}</div>;
  // 게시물 데이터가 없을 때 (정상적으로 로드됐지만 데이터가 없는 경우)
  if (!post) return <div style={{ padding: 24 }}>게시물 정보를 찾을 수 없습니다.</div>;

  // 게시물 데이터를 화면에 표시
  return (
    <div className="post-detail" style={{ maxWidth: 880, margin: "40px auto", padding: "0 16px" }}>
      {/* 목록으로 돌아가기 링크 */}
      <Link to="/" style={{ display: "inline-block", marginBottom: 16, textDecoration: 'none', color: 'var(--color-accent)' }}>
        ← 목록으로 돌아가기
      </Link>

      {/* 게시물 이미지 (있을 경우에만 표시) */}
      {post.imageUrl && (
        <img
          src={post.imageUrl} // 실제 이미지 URL 사용
          alt={post.title}
          style={{ width: "100%", height: "auto", maxHeight: '500px', objectFit: 'cover', borderRadius: 12, marginBottom: 20 }}
        />
      )}
      {/* fileUrl 배열 처리 (첫 번째 이미지만 표시하거나, 여러 개 표시 로직 추가 가능) */}
      {post.fileUrl && post.fileUrl.length > 0 && !post.imageUrl && (
         <img
          src={post.fileUrl[0]} // 우선 첫 번째 이미지만 표시
          alt={post.title}
          style={{ width: "100%", height: "auto", maxHeight: '500px', objectFit: 'cover', borderRadius: 12, marginBottom: 20 }}
        />
      )}


      {/* 게시물 제목 */}
      <h1 style={{ margin: "0 0 12px", color: 'var(--color-main)' }}>{post.title}</h1>

      {/* 게시물 작성일 */}
      <p style={{ color: "#666", marginBottom: 24, fontSize: '0.9em' }}>
        작성일: {post.createdAt ? new Date(post.createdAt).toLocaleString() : '날짜 정보 없음'}
      </p>

      {/* 게시물 내용 */}
      <div style={{ lineHeight: 1.7, fontSize: 16, whiteSpace: "pre-wrap", color: 'var(--color-text)', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
        {post.content}
      </div>

      {/* --- 추가 정보 표시 (필요한 경우) --- */}
      {/* 예: 작성자 정보 */}
      {/* {post.user && <p>작성자: {post.user.displayName || post.user.email}</p>} */}
      {/* ------------------------------------ */}
    </div>
  );
}