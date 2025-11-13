// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import checkHandler from "./api/check.js"; // 기존 API 사용
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// __dirname 설정 (ESM 환경에서 필요)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 미들웨어
app.use(cors());
app.use(express.json());

// 정적 파일 제공
app.use(express.static(path.join(__dirname, "public")));

// 기본 루트: index.html 제공
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API 라우트
app.post("/api/check", checkHandler);

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 시작: http://localhost:${PORT}`);
});
