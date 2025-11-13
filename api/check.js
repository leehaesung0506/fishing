// check.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "POST 요청만 허용됩니다." } });
  }

  const userPrompt = req.body.prompt;
  if (!userPrompt) {
    return res.status(400).json({ error: { message: "입력값이 없습니다." } });
  }

  const API_KEY = process.env.OPENAI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: { message: "서버 환경변수 OPENAI_API_KEY 미설정" } });
  }

  console.log(API_KEY ? "✅ OPENAI_API_KEY OK" : "❌ OPENAI_API_KEY MISSING");

  // 테스트용 간단 프롬프트
  const formatGuide = `
너는 '국제 취업 및 여행 안전 분석 전문가 AI'야.
사용자가 입력한 문장, 링크(URL), 국가/지역 정보를 기반으로 사기 가능성과 안전도를 분석해.
출력은 반드시 JSON 형식만, 바깥 텍스트 금지.
값 안에서는 상황에 맞는 이모티콘(🔒, ⚠️, 🚨, 😊 등) 사용 가능.

출력 JSON 구조:
{
  "종합평가": "안전" | "주의" | "위험" | "스팸",
  "위험도점수": 0~100 (정수)
  "분석근거": ["구체적이고 전문가적인 판단 근거 3~5개 (이모티콘 가능)"],
  "안전조치제안": ["현실적이고 즉시 실행 가능한 조치 1~2개 (이모티콘 가능)"]
}

JSON 외에는 아무것도 출력하지 마.
`;

  try {
    // timeout 대비 wrapper
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15초 timeout

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4", // 모델 변경
        messages: [
          { role: "system", content: formatGuide },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || "";

    // raw 출력 로그
    console.log("Raw AI Response:", raw);

    res.status(200).json({
      success: Boolean(raw),
      model: data?.model || "unknown",
      usage: data?.usage || {},
      raw,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("❌ 서버 호출 타임아웃 발생");
      res.status(500).json({ error: { message: "서버 호출 타임아웃" } });
    } else {
      console.error("❌ 서버 오류:", err);
      res.status(500).json({ error: { message: err.message } });
    }
  }
}
