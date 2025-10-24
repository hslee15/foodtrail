import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
// 필요하면 아래 API를 쓰고, 당장은 fetch로 바로 가져와도 됩니다.
// import { getPostById } from "../api/posts";

export default function PostDetail() {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState(null);

    useEffect(() => {
        (async () => {
        try {
            // 백엔드 경로에 맞게 수정: 예) /api/posts/:id
            const res = await fetch(`/api/posts/${id}`, {
            headers: { "Content-Type": "application/json" },
            credentials: "include", // 토큰/쿠키 쓰면 유지, 아니면 지워도 됨
            });
            if (!res.ok) throw new Error("게시물을 불러오지 못했습니다.");
            const data = await res.json();
            setPost(data);
        } catch (e) {
            setErr(e.message);
        } finally {
            setLoading(false);
        }
        })();
    }, [id]);

    if (loading) return <div style={{ padding: 24 }}>불러오는 중…</div>;
    if (err) return <div style={{ padding: 24, color: "crimson" }}>{err}</div>;
    if (!post) return null;

    return (
        <div className="post-detail" style={{ maxWidth: 880, margin: "40px auto", padding: "0 16px" }}>
        <Link to="/" style={{ display: "inline-block", marginBottom: 16 }}>← 목록으로</Link>
        {post.imageUrl && (
            <img
            src={post.imageUrl}
            alt={post.title}
            style={{ width: "100%", borderRadius: 12, marginBottom: 20, objectFit: "cover" }}
            />
        )}
        <h1 style={{ margin: "0 0 12px" }}>{post.title}</h1>
        <p style={{ color: "#666", marginBottom: 24 }}>
            {post.createdAt ? new Date(post.createdAt).toLocaleString() : null}
        </p>
        <div style={{ lineHeight: 1.7, fontSize: 16, whiteSpace: "pre-wrap" }}>
            {post.content}
        </div>
        {/* 필요하면 카테고리/별점/가격 등 추가 필드도 표시 */}
        </div>
    );
}