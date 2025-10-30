const express = require('express');
const router = express.Router();
const Post = require('../models/Posts'); // 'Posts.js' (복수형) 사용
const jwt = require('jsonwebtoken');
const { presignGet } = require('../src/s3'); // S3 presignGet 함수
const mongoose = require('mongoose');

// 인증 미들웨어 (기존 코드)
const authenticateToken = (req, res, next) => {
  let token = null;
  const h = req.headers.authorization;
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

// 숫자 ID 검증 미들웨어 (기존 코드)
const ensureValidNumber = (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ message: '유효하지 않은 id 형식입니다.' });
  }
  req.postIdAsNumber = id;
  next();
};

// undefined가 아닌 값만 골라내는 헬퍼 (기존 코드)
const pickDefined = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );

// --- S3 URL 변환을 위한 공통 헬퍼 함수 ---
// (Post 객체 또는 객체 배열을 받아 S3 URL을 추가합니다)
async function addPresignedUrls(posts) {
  // 1. posts가 배열이 아니면 배열로 만듭니다.
  const postArray = Array.isArray(posts) ? posts : [posts];

  // 2. 배열을 순회하며 presignGet을 병렬로 호출합니다.
  const processedPosts = await Promise.all(
    postArray.map(async (p) => {
      // 이 게시물의 대표 S3 키를 찾습니다.
      const key = p.imageUrl || (Array.isArray(p.fileUrl) ? p.fileUrl[0] : null);

      // 키가 있으면 Presigned URL을 생성합니다. (없으면 null)
      const presignedImageUrl = key
        ? (key.startsWith("http") ? key : await presignGet(key, 3600))
        : null;
      
      return { ...p, presignedImageUrl };
    })
  );

  // 3. 원래 형식(객체 또는 배열)으로 되돌려줍니다.
  return Array.isArray(posts) ? processedPosts : processedPosts[0];
}


// --- API 라우트 ---

// POST /api/posts (새 게시물 작성)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    let { title, content, fileUrl = [], imageUrl } = req.body;

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

    res.status(201).json(post);
  } catch (error) {
    console.error('POST /api/posts 실패:', error);
    next(error);
  }
});

// GET /api/posts (전체 목록 보기)
router.get('/', async (req, res, next) => {
  try {
    const list = await Post.find().sort({ createdAt: -1 }).lean();
    
    // 헬퍼 함수를 사용해 S3 URL 일괄 변환
    const data = await addPresignedUrls(list);

    res.json(data);
  } catch (error) {
    console.error('GET /api/posts 실패', error);
    next(error);
  }
});

// GET /api/posts/my (내 게시물)
router.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    if (!userId) return res.status(400).json({ message: '유저 정보 없음' });

    const myPosts = await Post.find({ user: userId }).sort({ createdAt: -1 }).lean();

    // 헬퍼 함수를 사용해 S3 URL 일괄 변환
    const data = await addPresignedUrls(myPosts);

    res.json(data);
  } catch (error) {
    console.error('GET /api/posts/my 실패', error);
    next(error);
  }
});

// GET /api/posts/:id (상세 보기)
router.get('/:id', ensureValidNumber, async (req, res, next) => {
  try {
    const doc = await Post.findOne({ number: req.params.id }).lean();
    if (!doc) return res.status(404).json({ message: '존재하지 않는 게시글' });
    
    // 💡 [수정] 헬퍼 함수를 사용해 S3 URL 변환 로직 추가
    const data = await addPresignedUrls(doc);

    res.json(data);

  } catch (error) {
    console.error(`GET /api/posts/${req.params.id} 실패`, error);
    next(error);
  }
});

// PUT /api/posts/:id (게시물 수정)
router.put('/:id', authenticateToken, ensureValidNumber, async (req, res, next) => {
  try {
    const { title, content, fileUrl, imageUrl } = req.body;
    const updates = pickDefined({ title, content, fileUrl, imageUrl });

    // (생략: 글 작성자 본인 확인 로직이 필요할 수 있습니다)

    const updated = await Post.findOneAndUpdate(
      { number: req.params.id }, // 'number' 필드로 찾음
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: '존재하지 않는 게시글' });

    res.json(updated);
  } catch (error) {
    console.error(`PUT /api/posts/${req.params.id} 실패`, error);
    next(error);
  }
});

// DELETE /api/posts/:id (게시물 삭제)
router.delete('/:id', authenticateToken, ensureValidNumber, async (req, res, next) => {
  try {
    // (생략: 글 작성자 본인 확인 로직이 필요할 수 있습니다)

    const deleted = await Post.findOneAndDelete({ number: req.params.id });
    if (!deleted) return res.status(404).json({ message: '존재하지 않는 게시글' });

    res.json({ ok: true, id: deleted._id });
  } catch (error) {
    console.error(`DELETE /api/posts/${req.params.id} 실패`, error);
    next(error);
  }
});

module.exports = router;

