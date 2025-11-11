import React from 'react';
import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
    return (
    <Link to={`/post/${post._id}`} className="post-card">
        <h3>{post.title}</h3>
        <p>{post.content.substring(0, 50)}...</p>
    </Link>
    );
}