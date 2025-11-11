const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
    {
        user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
        },
        number: {
        type: Number,
        required: true,
        index: true,
        },
        title: {
        type: String,
        required: true,
        trim: true,
        },
        content: {
        type: String,
        required: true,
        },
        fileUrl: {
        type: [String], // S3 키 또는 URL의 배열
        default: [],
        },
        imageUrl: {
        type: String, // 썸네일 이미지 S3 키 또는 URL
        trim: true,
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0,
        }
    },
    {
        timestamps: true, // createdAt, updatedAt 자동 생성
    }
);

// 고유 번호 (number)에 대한 인덱스 (내림차순)
postSchema.index({ number: -1 });

// 💡 참고: 모델 이름은 'Post' (단수)로 유지하는 것이 Mongoose 관례입니다.
// 파일명(Posts.js)과 모델명(Post)이 달라도 괜찮습니다.
module.exports = mongoose.model('Post', postSchema);
