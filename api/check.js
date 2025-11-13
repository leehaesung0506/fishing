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
너는 친절한 AI야. 사용자가 입력한 문장에 대해 간단하게 답변해줘.
출력은 일반 텍스트로 해도 돼.
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
