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

  const formatGuide = `
너는 '국제 취업 및 여행 안전 분석 전문가 AI'야. 
입력된 문장, 링크, 또는 국가 정보를 기반으로 사기 가능성을 판단하고, 
오직 JSON 형식으로만 답변해. 
그 외 문장, 설명, 코드블록은 절대 포함하지 마.

JSON은 반드시 아래 형식으로 출력해야 해:
{
  "종합평가": "안전" 또는 "주의" 또는 "위험",
  "위험도점수": 0~100 (정수),
  "분석근거": ["핵심 근거 3~5개"],
  "안전조치제안": ["현실적인 조치 1~2개"]
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: formatGuide },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn("⚠️ JSON 파싱 실패, 원문 그대로 반환");
    }

    res.status(200).json({ raw, parsed });
  } catch (err) {
    console.error("❌ 서버 오류:", err);
    res.status(500).json({ error: { message: err.message } });
  }
}
