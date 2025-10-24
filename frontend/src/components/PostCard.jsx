import React from 'react';
import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
    return (
    // 2. 카드 전체를 <Link>로 감쌉니다.
    // post._id 값에 따라 동적인 경로(/post/1, /post/2 등)로 이동시킵니다.
    <Link to={`/post/${post._id}`} className="post-card">
        <h3>{post.title}</h3>
        <p>{post.content.substring(0, 50)}...</p>
    </Link>
    );
}