// WebLLM chat + latest list builder
const elLog = document.getElementById('chat-log');
const elForm = document.getElementById('chat-form');
const elInput = document.getElementById('user-input');
const elStatus = document.getElementById('status');
const elYear = document.getElementById('year');
if (elYear) elYear.textContent = new Date().getFullYear();

function addMsg(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  elLog.appendChild(div);
  elLog.scrollTop = elLog.scrollHeight;
}

// Initialize WebLLM
let engine = null;
(async () => {
  try {
    engine = new window.MLCEngine();
    // Model name packaged for WebLLM; can be changed later for quality/size trade-offs.
    await engine.reload({ model: "Llama-3.2-3B-Instruct-q4f32_1-MLC" });
    elStatus.textContent = "Model loaded. Ready.";
  } catch (e) {
    console.error(e);
    elStatus.textContent = "モデルの読み込みに失敗しました。通信環境やブラウザ対応(WebGPU)をご確認ください。";
  }
})();

elForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = (elInput.value || "").trim();
  if (!q) return;
  addMsg('user', q);
  elInput.value = "";
  if (!engine) {
    addMsg('assistant', "モデルが未読込です。少し待ってから再度お試しください。");
    return;
  }
  elStatus.textContent = "Thinking...";
  try {
    const completion = await engine.chat.completions.create({
      messages: [
        { role: "system", content: "あなたは日本語話者に向けて、簡潔で正確、礼儀正しいAIアシスタントです。必要に応じて英語対訳も併記してください。" },
        { role: "user", content: q }
      ],
      temperature: 0.6,
      max_tokens: 512
    });
    const a = completion.choices[0].message.content;
    addMsg('assistant', a);
    elStatus.textContent = "Ready.";
  } catch (err) {
    console.error(err);
    elStatus.textContent = "回答中にエラーが発生しました。";
    addMsg('assistant', "すみません、もう一度お試しください。");
  }
});

// Build "Latest" list by scanning /content directory listing (static guess)
(async () => {
  // Static approach: show a fixed set of known files + today file pattern
  const list = document.getElementById('latest-list');
  if (!list) return;
  const candidates = [
    "content/英語フレーズ_ウーバー運転手.html",
    "content/投資_用語集_移動平均MA.html",
    "content/旅行_会話_ホテルチェックイン.html",
  ];
  for (const c of candidates) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = c;
    a.textContent = c.replace('content/','').replace('.html','');
    li.appendChild(a);
    list.appendChild(li);
  }
})();
