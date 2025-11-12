const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require('cookie-parser');
dotenv.config();

const app = express();
const PORT = process.env.PORT;

app.use(cors({
  origin: process.env.FRONT_ORIGIN,
  credentials: true
}));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB 연결 성공"))
  .catch((err) => console.error("MongoDB 연결 실패:", err.message));

// --- 라우트 등록 ---
app.get("/", (_req, res) => res.send("PhotoMemo API OK"));

// authRoutes (오타 수정됨)
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// uploadRoutes
// (참고: "./routes/upload.js" 파일이 있어야 합니다)
const uploadRoutes = require("./routes/upload");
app.use("/api/upload", uploadRoutes);

// postRoutes
// (참고: "./routes/posts.js" 파일이 있어야 합니다)
// /api/posts/1 요청은 이 라우터가 처리합니다.
const postRoutes = require("./routes/posts");
app.use("/api/posts", postRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);


// --- 에러 핸들러 ---
// 이 404 핸들러는 *모든* 라우트 등록보다 뒤에 있어야 합니다.
app.use((req, res, next) => {
  res.status(404).json({ message: '요청하신 경로를 찾을 수 없습니다.' });
});

// 500 에러 핸들러는 가장 마지막에 있어야 합니다.
// (참고: 404 핸들러와 구분하기 위해 next 파라미터가 필요할 수 있습니다)
app.use((err, req, res, next) => {
  console.error(err.stack); // 에러 로그 출력
  res.status(500).json({ message: "서버 내부 오류" });
});

// 500 핸들러의 간단한 버전 (이전 코드와 동일)
app.use((req, res) => {
  res.status(500).json({ message: "서버 오류" });
});


app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
