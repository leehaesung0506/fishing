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

  // 🧠 강화된 시스템 프롬프트
  const formatGuide = `
너는 '국제 취업 및 여행 안전 분석 전문가 AI'야.  
입력된 문장, 링크(URL), 또는 국가/지역 정보를 기반으로 사기 가능성과 안전도를 분석해.  
너의 목표는 사용자가 현실적으로 판단하고 행동할 수 있도록 **전문가 수준의 분석 근거**를 제시하는 거야.

⚠️ 출력은 반드시 아래 JSON 형식 그대로 해야 해.
- 구조, 키 이름, 순서 절대 바꾸지 마.
- JSON 바깥에는 아무 말도 하지 마.
- 값 안에서는 상황에 맞는 이모티콘(🔒, ⚠️, 🚨, 🧨, 😊 등)을 사용할 수 있어.

출력 형식:
{
  "종합평가": "안전" | "주의" | "위험" | "스팸",
  "위험도점수": 0~100 (정수),
  "분석근거": ["구체적이고 전문가적인 판단 근거 3~5개 (이모티콘 가능)"],
  "안전조치제안": ["현실적이고 즉시 실행 가능한 조치 1~2개 (이모티콘 가능)"]
}

형식을 설명하거나 예시를 출력하지 말고, 반드시 실제 JSON 객체만 출력하라. 
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-mini",
        messages: [
          { role: "system", content: formatGuide },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    const raw = data?.choices?.[0]?.message?.content?.trim() || "";
    let parsed = null;

    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("⚠️ [JSON 파싱 오류 발생]");
      console.error("└ 오류 메시지:", e.message);
      console.error("└ 원문 출력 시작 ↓↓↓");
      console.error(raw);
      console.error("└ 원문 출력 끝 ↑↑↑");
    }

    if (!parsed) {
      console.warn("⚠️ [응답 파싱 실패] OpenAI가 JSON 형식으로 응답하지 않았을 수 있습니다.");
    }

    res.status(200).json({
      success: Boolean(parsed),
      model: data?.model || "unknown",
      usage: data?.usage || {},
      raw,
      parsed,
    });

  } catch (err) {
    console.error("❌ 서버 오류:", err);
    res.status(500).json({ error: { message: err.message } });
  }
}
