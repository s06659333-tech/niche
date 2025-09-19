// assets/js/app.js — transformers.js (WebAssembly) 版の軽量チャット
import { pipeline } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";

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

let pipe = null;

(async () => {
  try {
    elStatus.textContent = "Loading tiny model… (first time is slow)";
    // 軽量＆安定。初回はモデルDLで少し待ちます
    pipe = await pipeline("text2text-generation", "Xenova/flan-t5-small");
    elStatus.textContent = "Model loaded. Ready.";
  } catch (e) {
    console.error(e);
    elStatus.textContent = "モデル読込に失敗しました（transformers.js）。ページを再読み込みしてください。";
  }
})();

elForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = (elInput.value || "").trim();
  if (!q) return;
  addMsg('user', q);
  elInput.value = "";

  if (!pipe) {
    addMsg('assistant', "モデルが未読込です。少し待ってから再度お試しください。");
    return;
  }

  elStatus.textContent = "Thinking…";
  try {
    const prompt = `以下のユーザー質問に、日本語を優先し簡潔・正確に答えてください。必要に応じて英訳の対訳も併記してください。\n\n質問: ${q}\n\n回答:`;
    const out = await pipe(prompt, { max_new_tokens: 256 });
    const a = (out[0]?.generated_text || "").trim();
    addMsg('assistant', a || "すみません、うまく生成できませんでした。もう一度お試しください。");
  } catch (err) {
    console.error(err);
    addMsg('assistant', "生成中にエラーが発生しました。もう一度お試しください。");
  } finally {
    elStatus.textContent = "Ready.";
  }
});

// Latest欄のダミー
(function buildLatest() {
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
