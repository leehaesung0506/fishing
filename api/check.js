// check.js
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "POST 요청만 허용됩니다." } });
  }

  const userPrompt = req.body.prompt;
  if (!userPrompt) {
    console.error("No prompt");
    return res.status(400).json({ error: { message: "입력값이 없습니다." } });
  }

  const API_KEY = process.env.OPENAI_API_KEY;
  if (!API_KEY) {
    console.error("Missing API key");
    return res.status(500).json({ error: { message: "서버 환경변수 OPENAI_API_KEY 미설정" } });
  }

  console.log(API_KEY ? "✅ OPENAI_API_KEY OK" : "❌ OPENAI_API_KEY MISSING");

  // 테스트용 간단 프롬프트
  const formatGuide = `
너는 '국제 취업 및 여행 안전 분석 전문가 AI'야.
사용자가 입력한 문장, 링크, 국가/지역 정보를 기반으로 사기 가능성과 안전도를 분석해.
반드시 JSON 객체 하나만 반환하고, JSON 외에는 아무것도 출력하지 마.

출력 JSON 구조:
{
  "종합평가": "안전" | "주의" | "위험" | "스팸",
  "위험도점수": 0~100,
  "분석근거": ["전문적 판단 근거 3~5개"],
  "안전조치제안": ["즉시 실행 가능한 조치 1~2개"]
}
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
        "model": "gpt-4",
        "response_format": {
          "type": "json_schema",
          "json_schema": {
            "name": "safety_analysis_response",
            "strict": true,
            "schema": {
              "type": "object",
              "properties": {
                "종합평가": {
                  "type": "string",
                  "enum": ["안전", "주의", "위험", "스팸"]
                },
                "위험도점수": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 100
                },
                "분석근거": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "minItems": 3,
                  "maxItems": 5
                },
                "안전조치제안": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "minItems": 1,
                  "maxItems": 2
                }
              },
              "required": [
                "종합평가",
                "위험도점수",
                "분석근거",
                "안전조치제안"
              ],
              "additionalProperties": false
            }
          }
        },
        "messages": [
          {
            "role": "system",
            "content": formatGuide
          },
          {
            "role": "user",
            "content": userPrompt
          }
        ],
        "temperature": 0.2,
        "max_tokens": 500
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    
    const data = await response.json();
    console.log("data :", data);
    const result = data?.choices?.[0]?.message?.content;

    // 응답 출력 로그
    console.log("Raw AI Response:", result);

    res.status(200).json({
      success: Boolean(result),
      model: data?.model || "unknown",
      usage: data?.usage || {},
      result: JSON.stringify(result),
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
