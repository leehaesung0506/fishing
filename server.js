require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// OpenAI 설정
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// 뉴스API 설정
const NEWS_API_KEY = process.env.NEWS_API_KEY; // .env에 뉴스API 키
const NEWS_QUERY = "해외 취업 사기 OR 여행 사기";

// 뉴스 라우터
app.get('/news', async (req, res) => {
  try {
    const response = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(NEWS_QUERY)}&language=ko&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`);
    const data = await response.json();
    if(data.articles){
      const news = data.articles.map(a => ({ title: a.title, link: a.url }));
      res.json(news);
    } else {
      res.json([]);
    }
  } catch(e){
    console.error("뉴스API 호출 실패:", e);
    res.json([]);
  }
});

// AI 분석 라우터
app.post('/api/check', async (req, res) => {
  const { prompt } = req.body;
  if(!prompt) return res.status(400).json({ error: "prompt 필요" });

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "너는 해외취업·여행 사기 전문가 AI야. 반드시 JSON 형식으로 결과를 출력해야 해. 필드는 '종합평가', '위험도점수', '분석근거', '안전조치제안' 이어야 함." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 600
    });

    const raw = completion.data.choices[0].message.content;
    let parsed = null;
    try { parsed = JSON.parse(raw); } catch(e){ parsed = null; }

    res.json({ raw, parsed });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.message || "OpenAI 호출 실패" });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
