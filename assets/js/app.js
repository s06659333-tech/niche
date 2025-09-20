// assets/js/app.js — transformers.js (WASM) 進捗表示つき安定版
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

// ▼ 安定化（低メモリ環境や拡張機能の干渉に強く）
env.allowLocalModels = false;                 // すべてCDNから取得
env.backends.onnx.wasm.numThreads = 1;        // 1スレッドで安定化
env.backends.onnx.wasm.proxy = false;         // WebWorker経由を無効化

let pipe = null;

(async () => {
  try {
    let lastPct = 0;
    elStatus.textContent = "モデル取得を開始…";

    const progress_callback = (data) => {
      // data: { status, progress, loaded, total, file }
      if (data.status === 'progress' && data.progress != null) {
        const pct = Math.round(data.progress * 100);
        if (pct !== lastPct) {
          elStatus.textContent = `ダウンロード中… ${pct}%`;
          lastPct = pct;
        }
      } else if (data.status) {
        elStatus.textContent = data.status; // 'Fetching', 'Resolving model', etc.
      }
    };

    // 軽量モデル（回線に優しい）
    pipe = await pipeline("text2text-generation", "Xenova/t5-small", { progress_callback });
    elStatus.textContent = "Model loaded. Ready.";
  } catch (e) {
    console.error(e);
    elStatus.textContent = "モデル読込に失敗しました。Ctrl+F5で再読み込み or 別回線でお試しください。";
  }
})();

// 送信
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
    const prompt = `以下のユーザー質問に、日本語を優先し簡潔・正確に答えてください。必要に応じて英訳の対訳も併記してください。\n\n質問: ${q}\n\n回答:`;
    const out = await pipe(prompt, { max_new_tokens: 180 });
    const a = (out[0]?.generated_text || "").trim();
    addMsg('assistant', a || "すみません、うまく生成できませんでした。もう一度お試しください。");
  } catch (err) {
    console.error(err);
    addMsg('assistant', "生成中にエラーが発生しました。もう一度お試しください。");
  } finally {
    elStatus.textContent = "Ready.";
  }
});
