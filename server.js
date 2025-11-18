// server.js

// Express 웹 서버 프레임워크 불러오기
import express from "express";

// 브라우저의 CORS(도메인 차단) 문제 해결용 미들웨어
import cors from "cors";

// .env 파일의 환경 변수 로드를 위한 라이브러리
import dotenv from "dotenv";

// /api/check.js 파일에 작성된 AI 분석 로직(핸들러) 불러오기
import checkHandler from "./api/check.js";

// 정적 파일 경로 설정을 위해 path 모듈 불러오기
import path from "path";

// ES Module 환경에서 __filename, __dirname을 직접 생성하기 위한 함수
import { fileURLToPath } from "url";

// .env 파일 로드 (OPENAI_API_KEY 등)
dotenv.config();

// Express 앱 초기화
const app = express();

// 실행 포트 설정 (Railway, Render 등 배포환경에서는 자동 포트 제공)
const PORT = process.env.PORT || 3000;

// -------------------------------
// 🔧 __dirname 설정 (ESM 환경은 기본 제공 X)
// -------------------------------

// 현재 파일(server.js)의 URL을 실제 파일 경로로 변환
const __filename = fileURLToPath(import.meta.url);

// 해당 파일이 포함된 디렉토리 경로
const __dirname = path.dirname(__filename);

// -------------------------------
// 🔧 미들웨어 설정
// -------------------------------

// 모든 도메인에서 API 호출 허용
app.use(cors());

// JSON 형식의 요청(body)을 자동으로 파싱
app.use(express.json());

// -------------------------------
// 📁 정적 파일(public 폴더) 제공
// -------------------------------

// /public 폴더 안의 HTML, CSS, JS, 이미지 등 정적 파일을 자동 서비스
// 예) public/index.html → "/"에서 자동 제공 가능
app.use(express.static(path.join(__dirname, "public")));

// -------------------------------
// 📄 기본 페이지 라우트
// -------------------------------

// GET "/" 로 접속하면 public/index.html 파일을 직접 응답
// (정적 제공이 있지만 root 명시적 처리하는 방식)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// -------------------------------
// 🤖 AI 분석 API 라우트
// -------------------------------

// 프론트엔드에서 JSON을 POST하면 checkHandler가 처리
app.post("/api/check", checkHandler);

// -------------------------------
// 🚀 서버 실행
// -------------------------------

app.listen(PORT, () => {
  console.log(`서버 시작: http://localhost:${PORT}`);
});
