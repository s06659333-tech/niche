// transformers.js (WASM) 進捗表示つき・無効出力ガード版
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js";

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

// 安定化（低メモリ環境向け）
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

let pipe = null;

(async () => {
  try {
    let lastPct = 0;
    elStatus.textContent = "モデル取得を開始…";
    const progress_callback = (data) => {
      if (data.status === 'progress' && data.progress != null) {
        const pct = Math.round(data.progress * 100);
        if (pct !== lastPct) { elStatus.textContent = `ダウンロード中… ${pct}%`; lastPct = pct; }
      } else if (data.status) {
        elStatus.textContent = data.status;
      }
    };
    // ★ 指示チューニング済み（日本語質問でも安定）
    pipe = await pipeline("text2text-generation", "Xenova/flan-t5-small", { progress_callback });
    elStatus.textContent = "Model loaded. Ready.";
  } catch (e) {
    console.error(e);
    elStatus.textContent = "モデル読込に失敗しました。Ctrl+F5で再読み込み or 別回線でお試しください。";
  }
})();

function sanitize(output) {
  const s = (output || "").trim();
  // 全部が記号/空白なら無効とみなす
  if (!s || /^[\s:：・。、…._-]+$/.test(s) || s.length < 5) return null;
  return s;
}

elForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = (elInput.value || "").trim();
  if (!q) return;
  addMsg('user', q);
  elInput.value = "";

  if (!pipe) {
    addMsg('assistant', "モデルの準備中です。ステータスが“Ready.”になってから再送信してください。");
    return;
  }

  elStatus.textContent = "Thinking…";
  try {
    // 日本語での回答を明示指示（FLANに最適化）
    const prompt = [
      "You are a helpful assistant. Reply in Japanese, concise and clear.",
      "If the question is about how to use this site, give short steps.",
      "Question:", q,
      "Answer in Japanese:"
    ].join("\n");

    const out = await pipe(prompt, { max_new_tokens: 180 });
    const raw = (out[0]?.generated_text || "");
    const a = sanitize(raw) || "うまく生成できませんでした。もう一度お試しください。（別の表現で質問すると改善することがあります）";
    addMsg('assistant', a);
  } catch (err) {
    console.error(err);
    addMsg('assistant', "生成中にエラーが発生しました。もう一度お試しください。");
  } finally {
    elStatus.textContent = "Ready.";
  }
});
