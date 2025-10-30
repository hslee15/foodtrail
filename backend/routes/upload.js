const express = require("express");
const router = express.Router();
const { presignPut } = require("../src/s3"); // S3 Presign 함수
const auth = require('../middlewares/auth'); // 사용자 인증
const { v4: uuidv4 } = require("uuid"); // 고유 ID 생성

/**
 * 1단계: 프론트엔드에서 파일 업로드 전에 호출하는 라우트
 * GET /api/upload?filename=test.jpg&contentType=image/jpeg
 * * S3에 업로드할 수 있는 1회용 URL(presigned URL)과
 * S3에 저장될 파일 키(key)를 반환합니다.
 */
router.get("/", auth, async (req, res, next) => {
  try {
    const { filename, contentType } = req.query;

    if (!filename || !contentType) {
      return res.status(400).json({ message: "filename, contentType 쿼리 파라미터가 필요합니다." });
    }

    // 1. 현재 로그인한 사용자 ID 가져오기
    const userId = req.user._id || req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "사용자 정보가 없습니다." });
    }

    // 2. S3에 저장할 고유한 파일 경로(키) 생성
    // 예: uploads/유저ID/고유UUID-원본파일이름.jpg
    const key = `uploads/${userId}/${uuidv4()}-${filename}`;

    // 3. S3 Presign 함수 호출 (300초 = 5분간 유효)
    const presignedUrl = await presignPut(key, contentType, 300);

    // 4. 프론트엔드에 URL과 Key 반환
    res.json({
      url: presignedUrl, // 이 URL로 파일을 PUT해야 함
      key: key           // 이 Key를 나중에 /api/posts 로 보낼 때 사용
    });

  } catch (error) {
    console.error("S3 Presigned URL 생성 실패:", error);
    next(error); // 공통 에러 핸들러로 전달
  }
});

module.exports = router;