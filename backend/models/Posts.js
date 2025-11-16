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
        },
        priceRange:{
            type:String,
            enum: ['선택안함', '가성비', '보통', '비쌈'],
            default: '선택안함',
        }
    },
    {
        timestamps: true,
    }
);

postSchema.index({ number: -1 });

module.exports = mongoose.model('Post', postSchema);