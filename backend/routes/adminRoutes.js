const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const requireAdmin = require('../middlewares/requireAdmin');
const Post = require('../models/Posts');
const User = require('../models/User');

router.use(auth, requireAdmin);


router.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('user', 'email displayName')
            .sort({ createdAt: -1 });
            
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: '모든 게시물 조회 실패', error });
    }
});


router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-passwordHash');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: '유저 조회 실패', error });
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