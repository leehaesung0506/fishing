// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import checkHandler from "./api/check.js"; // 기존 API 사용

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 기본 루트 테스트용
app.get("/", (req, res) => {
  res.send("서버 정상 작동 중 ✅");
});

// API 라우트
app.post("/api/check", checkHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 시작: http://localhost:${PORT}`);
});
