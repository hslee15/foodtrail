const express = require('express');
const router = express.Router();
const Post = require('../models/Posts');
const jwt = require('jsonwebtoken');
const { presignGet } = require('../src/s3');
const mongoose = require('mongoose');

const authenticateToken = (req, res, next) => {
    let token = null;

    const h = req.headers.authorization;

    // h가 존재하고 'bearer'로 시작하는지 확인
    if (h && h.toLowerCase().startsWith('bearer')) {
        token = h.slice(7).trim();
    }

    if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) return res.status(401).json({ message: '토큰이 없습니다.' });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
    };

    // 유효한 숫자인지 검사
    const ensureValidNumber = (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id < 1) {
        return res.status(400).json({ message: '유효하지 않은 id 형식입니다.' });
    }
    req.postIdAsNumber = id;
    next();
    };

    const pickDefined = (obj) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

    // [POST /] 새 게시물 생성 (기존과 동일)
    router.post('/', authenticateToken, async (req, res, next) => {
    try {
        let { title, content, fileUrl = [], imageUrl } = req.body; // fileUrl let으로 변경

        if (typeof fileUrl === 'string') {
        try {
            fileUrl = JSON.parse(fileUrl);
        } catch (error) {
            fileUrl = [fileUrl];
        }
        }

        const latest = await Post.findOne().sort({ number: -1 });

        const nextNumber = latest ? latest.number + 1 : 1;

        const post = await Post.create({
        user: req.user._id || req.user.id,
        number: nextNumber,
        title,
        content,
        fileUrl,
        imageUrl,
        });

        res.status(201).json(post); // 501 -> 201 (Created)
    } catch (error) {
        console.error('POST /api/posts 실패:', error);
        next(error); // 공통 에러 핸들러로 전달
    }
    });

    // [GET /] 게시물 목록 (기존과 동일, 'presignedImageUrl' 필드명 사용)
    router.get('/', async (req, res, next) => {
    try {
        const list = await Post.find().sort({ createdAt: -1 }).lean();

        const data = await Promise.all(
        list.map(async (p) => {
            const s3Key = p.imageUrl || (p.fileUrl && p.fileUrl[0]);
            let presignedImageUrl = null;

            if (s3Key && !s3Key.startsWith('http')) {
            presignedImageUrl = await presignGet(s3Key, 3600);
            } else if (s3Key) {
            presignedImageUrl = s3Key;
            }

            return { ...p, presignedImageUrl: presignedImageUrl };
        })
        );

        res.json(data);
    } catch (error) {
        console.error('GET /api/posts 실패', error);
        next(error); // 공통 에러 핸들러로 전달
    }
    });

    // [GET /my] 내 게시물 (기존과 동일)
    router.get('/my', authenticateToken, async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        if (!userId) return res.status(400).json({ message: '유저 정보 없음' });

        const myPosts = await Post.find({ user: userId })
        .sort({ createdAt: -1 })
        .lean();
        
        // (필요시 'my' 라우트에도 S3 URL 변환 로직 추가 가능)

        res.json(myPosts);
    } catch (error) {
        console.error('GET /api/posts/my 실패', error);
        next(error); // 공통 에러 핸들러로 전달
    }
    });

    // --- 👇 [수정된 부분] GET /:id (상세) 라우터 ---
    router.get('/:id', ensureValidNumber, async (req, res, next) => {
    try {
        const doc = await Post.findOne({ number: req.params.id }).lean(); // 'number' 필드로 찾음

        if (!doc) return res.status(404).json({ message: '존재하지 않는 게시글' });

        // 1. S3 URL 변환 로직 추가 (GET /' 라우트와 동일)
        const s3Key = doc.imageUrl || (doc.fileUrl && doc.fileUrl[0]);
        let presignedImageUrl = null;

        if (s3Key && !s3Key.startsWith('http')) {
        // S3 키가 있으면 Presigned URL 생성
        presignedImageUrl = await presignGet(s3Key, 3600);
        } else if (s3Key) {
        // 이미 http(s)로 시작하는 URL이면 그대로 사용
        presignedImageUrl = s3Key;
        }

        // 2. 원본 doc(S3 키 포함)과 presignedImageUrl을 함께 응답
        res.json({
        ...doc,
        presignedImageUrl: presignedImageUrl,
        });
    } catch (error) {
        console.error(`GET /api/posts/${req.params.id} 실패`, error);
        next(error); // 공통 에러 핸들러로 전달
    }
    });
    // --- 👆 [수정 완료] ---

    // [PUT /:id] 게시물 수정 (기존과 동일)
    router.put('/:id', authenticateToken, ensureValidNumber, async (req, res, next) => {
    try {
        const { title, content, fileUrl, imageUrl } = req.body;

        const updates = pickDefined({
        title,
        content,
        fileUrl,
        imageUrl,
        });

        const updated = await Post.findOneAndUpdate(
        { number: req.params.id }, // _id 대신 'number' 필드로 찾음
        { $set: updates },
        { new: true, runValidators: true }
        );

        if (!updated)
        return res.status(404).json({ message: '존재하지 않는 게시글' });

        res.json(updated);
    } catch (error) {
        console.error(`PUT /api/posts/${req.params.id} 실패`, error);
        next(error); // 공통 에러 핸들러로 전달
    }
    });

    // [DELETE /:id] 게시물 삭제 (기존과 동일)
    router.delete('/:id', authenticateToken, ensureValidNumber, async (req, res, next) => {
    try {
        const deleted = await Post.findOneAndDelete({ number: req.params.id }); // _id 대신 'number' 필드로 찾음

        if (!deleted)
        return res.status(404).json({ message: '존재하지 않는 게시글' });

        res.json({ ok: true, id: deleted._id }); // 삭제된 몽고 _id 반환
    } catch (error) {
        console.error(`DELETE /api/posts/${req.params.id} 실패`, error);
        next(error); // 공통 에러 핸들러로 전달
    }
});

module.exports = router;

