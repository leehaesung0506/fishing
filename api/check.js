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
너는 '국제 취업 및 여행 안전 분석 전문가 AI'야. 🌏✈️
사용자가 제공하는 텍스트, 링크, 국가 정보를 기반으로 사기·위험 가능성을 분석해.
결과는 오직 JSON 형식으로만 출력하며, 절대 코드블록이나 일반 문장 포함 금지.

JSON 구조:
{
  "종합평가": "안전" 또는 "주의" 또는 "위험",
  "위험도점수": 0~100 (정수, 높을수록 위험),
  "위험요소": ["⚠️ 핵심 위험 요소 1", "💡 핵심 위험 요소 2"],
  "분석근거": ["근거 3~5개"],
  "안전조치제안": ["현실적인 조치 1~2개"]
}

분석 규칙:
1. 위험 점수(riskScore)를 반드시 0~100 사이 숫자로 산출.
   - 0~20: 안전 ✅
   - 21~40: 낮음 ⚠️
   - 41~60: 주의 ⚡
   - 61~80: 높음 🔥
   - 81~100: 매우 위험 🚨
2. 위험 요소(flags)를 **이모티콘과 함께 bullet 리스트**로 구체적·정확하게 나열.
3. 분석 근거(reasoning)는 핵심 근거 3~5개 bullet로 제공.
4. 권장 안전 조치(advice)를 구체적·단계별로 제공.
5. JSON 형식으로만 출력, JSON 외 텍스트 절대 포함 금지.
6. 모호한 정보는 논리적 추론으로 보완하고, 근거 포함.
7. 전문 용어는 사용 가능하지만, 일반인이 이해할 수 있도록 간단히 풀이 추가.
8. 감정적 판단 금지, 오직 논리·패턴·사례 기반 평가.
9. 항상 **riskScore, flags, reasoning, advice** 4개 필드를 포함.
10. 이모티콘 사용 예시:
   - 위험 요소: ❗, ⚠️, 🔥
   - 안전 조치: ✅, 🛡️, 💡
   - 주석/근거: 📝
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
