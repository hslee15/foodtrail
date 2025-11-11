import React from 'react';
import './styles/StarRatingDisplay.scss';

/**
 * 별점 표시(읽기 전용) 컴포넌트
 * @param {number} rating - 표시할 별점 (0-5)
 */
export default function StarRatingDisplay({ rating = 0 }) {
    if (!rating || rating === 0) {
        return <div className="star-rating-display empty">평가 없음</div>;
    }

    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;

    return (
        <div className="star-rating-display">
        {[...Array(fullStars)].map((_, i) => (
            <span key={`full-${i}`} className="star full">★</span>
        ))}
        {[...Array(emptyStars)].map((_, i) => (
            <span key={`empty-${i}`} className="star empty">★</span>
        ))}
        </div>
    );
}