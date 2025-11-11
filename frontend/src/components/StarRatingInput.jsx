import React, { useState } from 'react';
import './styles/StarRatingInput.scss'

/**
 * 별점 입력 컴포넌트
 * @param {number} rating - 현재 별점 (0-5)
 * @param {function} onRatingChange - 별점 변경 시 호출될 함수 (새 별점을 인자로 받음)
 * @param {boolean} disabled - 비활성화 여부
 */
export default function StarRatingInput({ rating = 0, onRatingChange, disabled = false }) {
    const [hoverRating, setHoverRating] = useState(0);

    const handleMouseEnter = (index) => {
        if (disabled) return;
        setHoverRating(index);
    };

    const handleMouseLeave = () => {
        if (disabled) return;
        setHoverRating(0);
    };

    const handleClick = (index) => {
        if (disabled) return;
        const newRating = index === rating ? 0 : index;
        if (onRatingChange) {
        onRatingChange(newRating);
        }
    };

    return (
        <div className={`star-rating-input ${disabled ? 'disabled' : ''}`}>
        {[1, 2, 3, 4, 5].map((index) => {
            const isActive = (hoverRating || rating) >= index;
            return (
            <span
                key={index}
                className={`star ${isActive ? 'active' : ''}`}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(index)}
                data-rating={index}
            >
                ★
            </span>
            );
        })}
        </div>
    );
}