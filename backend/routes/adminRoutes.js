const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/requireAdmin');
const Post = require('../models/Posts');
const User = require('../models/User');

router.use(auth, requireAdmin);

async function addPresignedUrls(posts) {
const postArray = Array.isArray(posts) ? posts : [posts];

  // 2. 배열을 순회하며 S3 URL을 생성합니다.
    const processedPosts = await Promise.all(
        postArray.map(async (p) => {
        // 이 게시물의 대표 S3 키를 찾습니다.
        const key = p.imageUrl || (Array.isArray(p.fileUrl) ? p.fileUrl[0] : null);

        // 키가 있으면 Presigned URL을 생성합니다. (없으면 null)
        // .env 파일에 S3_BASE_URL이 정의되어 있다고 가정합니다. (posts.js와 동일)
        const S3_BASE_URL = process.env.S3_BASE_URL || '';
        const presignedImageUrl = key
            ? (key.startsWith("http") ? key : S3_BASE_URL + key) // 이미 완전한 URL이면 그대로 사용
            : null;
        
        // .lean()을 사용했으므로 p는 일반 객체입니다.
        return { ...p, presignedImageUrl };
        })
    );

    // 3. 원래 형식(객체 또는 배열)으로 되돌려줍니다.
    return Array.isArray(posts) ? processedPosts : processedPosts[0];
}

router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user', 'email displayName')
            .sort({ createdAt: -1 })
            .lean();

        const postsWithUrls=await addPresignedUrls(posts);
            
        res.json(postsWithUrls);
    } catch (error) {
        res.status(500).json({ message: '모든 게시물 조회 실패', error });
    }
});


router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: '유저 조회 실패', error });
    }
});

router.patch('/users/:id/active', async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive는 boolean 값이어야 합니다.' });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }

        res.json({ 
            ok: true, 
            message: `사용자가 ${isActive ? '활성화' : '비활성화'}되었습니다.`,
            user 
        });
    } catch (error) {
        res.status(500).json({ message: '사용자 상태 변경 실패', error: error.message });
    }
});

router.delete('/posts/:id', async (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ message: '유효하지 않은 id 형식입니다.' });
        }

        const deleted = await Post.findOneAndDelete({ number: id });
        
        if (!deleted) {
            return res.status(404).json({ message: '존재하지 않는 게시글' });
        }
        
        res.json({ ok: true, message: '게시물이 관리자에 의해 삭제되었습니다.' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;