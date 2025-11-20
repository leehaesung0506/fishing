/* ==========================
   DOM 엘리먼트 가져오기
   ========================== */
const modeEl = document.getElementById("mode");
const inputEl = document.getElementById("inputArea");
const analyzeBtn = document.getElementById("analyzeBtn");
const sampleBtn = document.getElementById("sampleBtn");
const resultBox = document.getElementById("resultBox");
const summary = document.getElementById("summary");
const details = document.getElementById("details");
const downloadBtn = document.getElementById("downloadBtn");
const newsList = document.getElementById("news-list");

/* ==========================
   상단 뉴스 샘플 데이터
   ========================== */
const sampleNews = [
    { title: "캄보디아 해외취업 사기 주의", link: "#" },
    { title: "베트남 여행 사기 사건 발생", link: "#" },
    { title: "해외 알바 모집 허위 공고 주의", link: "#" },
    { title: "인도네시아 여행 안전 가이드", link: "#" },
    { title: "해외 취업 사기 예방 방법", link: "#" },
];

/* 샘플 뉴스 리스트 DOM에 추가 */
sampleNews.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${item.link}" target="_blank">${item.title}</a>`;
    newsList.appendChild(li);
});

/* ==========================
   샘플 입력 버튼
   ========================== */
sampleBtn.addEventListener("click", () => {
    const samples = {
        text: "캄보디아 채용 공고: '월 600만원 지급, 숙소 제공, 선결제 200달러'",
        url: "http://cheapjob-kh.example.com/apply?id=1122",
        country: "캄보디아 프놈펜 치안",
    };

    inputEl.value = samples[modeEl.value] || samples.text;
});

/* ==========================
   입력창 placeholder 변경
   ========================== */
modeEl.addEventListener("change", () => {
    if (modeEl.value === "text")
        inputEl.placeholder = "공고 또는 메시지를 입력하세요.";
    if (modeEl.value === "url") inputEl.placeholder = "검사할 URL 입력";
    if (modeEl.value === "country") inputEl.placeholder = "국가 명 입력";
});

/* ==========================
   분석 버튼 클릭 → 서버 /api/check 호출
   ========================== */
analyzeBtn.addEventListener("click", async () => {
    const input = inputEl.value.trim();
    if (!input) {
        alert("내용을 입력하세요.");
        return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "분석 중...";

    resultBox.style.display = "none";
    summary.innerHTML = "";
    details.innerHTML = "";

    try {
        /* 서버 API 요청 */
        const resp = await fetch("/api/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: input }),
        });

        const data = await resp.json();
        console.log("data: ", data);
        const parsed = JSON.parse(data.result);
        console.log("parsed: ", parsed);

        {
            summary.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px">
              <div class="badge">${parsed["종합평가"]}</div>
              <div class="muted">
                위험도: <strong>${parsed["위험도점수"]}</strong>/100
              </div>
            </div>
          `;

            details.innerHTML = `
            <h3 style="margin:10px 0 6px">💡 분석 근거</h3>
            <div class="muted">
              ${parsed["분석근거"]
                .map((x) => `<div>- ${x}</div>`)
                .join("")}
            </div>

            <h3 style="margin:12px 0 6px">🔒 안전조치</h3>
            <div class="muted">
              ${parsed["안전조치제안"]
                .map((x) => `<div>- ${x}</div>`)
                .join("")}
            </div>
          `;
        }

        /* ==========================
           신고용 txt 다운로드
           ========================== */
        downloadBtn.onclick = () => {
            const txt = `
=== 신고/보관용 리포트 ===
종합평가: ${parsed?.["종합평가"] ?? "N/A"}
위험도: ${parsed?.["위험도점수"] ?? "N/A"}/100

분석 근거:
${(parsed?.["분석근거"] ?? [])
                .map((x, i) => `${i + 1}. ${x}`)
                .join("\n")}

안전 조치:
${(parsed?.["안전조치제안"] ?? [])
                .map((x, i) => `${i + 1}. ${x}`)
                .join("\n")}

원문:
${input}
`;

            const blob = new Blob([txt], {
                type: "text/plain;charset=utf-8",
            });

            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "report.txt";
            link.click();
        };

        resultBox.style.display = "block";
    } catch (err) {
        console.error(err);
        alert("서버 오류 발생");
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "🔍 AI 분석 실행";
    }
});
