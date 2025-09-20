// transformers.js (WASM) 安定版：ビームサーチ＋無効出力ガード＋フェイルセーフ
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js";

const elLog = document.getElementById("chat-log");
const elForm = document.getElementById("chat-form");
const elInput = document.getElementById("user-input");
const elStatus = document.getElementById("status");
const elYear = document.getElementById("year");
if (elYear) elYear.textContent = new Date().getFullYear();

function addMsg(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  elLog.appendChild(div);
  elLog.scrollTop = elLog.scrollHeight;
}

// 安定化（低メモリ向け）
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

let pipe = null;

// モデルを順に試す（軽い順）
async function loadModel() {
  let lastPct = 0;
  const progress_callback = (d) => {
    if (d.status === "progress" && d.progress != null) {
      const pct = Math.round(d.progress * 100);
      if (pct !== lastPct) { elStatus.textContent = `ダウンロード中… ${pct}%`; lastPct = pct; }
    } else if (d.status) {
      elStatus.textContent = d.status;
    }
  };

  const candidates = [
    "Xenova/flan-t5-small", // 指示追従
    "Xenova/t5-small",      // 予備
    "Xenova/LaMini-T5-61M"  // さらに予備（軽量）
  ];
  for (const id of candidates) {
    try {
      elStatus.textContent = `モデル取得を開始… (${id})`;
      pipe = await pipeline("text2text-generation", id, { progress_callback });
      elStatus.textContent = "Model loaded. Ready.";
      return;
    } catch (e) {
      console.warn("model load failed:", id, e);
    }
  }
  throw new Error("All model loads failed");
}

function sanitize(s) {
  const t = (s || "").trim();
  // 記号/空白のみ or 短すぎる → 無効
  if (!t || /^[\s:：・。、…._-]+$/.test(t) || t.length < 5) return null;
  return t;
}

function fallbackAnswer(q) {
  const lc = q.toLowerCase();
  if (lc.includes("使い方") || lc.includes("how") || lc.includes("使う")) {
    return [
      "① 上の入力欄に質問を書いて送信します。",
      "② 初回はモデルの読み込みに時間がかかります（1分前後）。",
      "③ 生成結果はブラウザ内で処理され、サーバーには送信されません。",
      "④ 下部の“Articles/コンテンツ”から自動生成の記事も読めます。"
    ].join("\n");
  }
  return "すみません、うまく生成できませんでした。別の表現で短く質問してみてください。";
}

(async () => {
  try {
    await loadModel();
  } catch (e) {
    console.error(e);
    elStatus.textContent = "モデル読込に失敗しました。Ctrl+F5で再読み込み、もしくは別回線でお試しください。";
  }
})();

elForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = (elInput.value || "").trim();
  if (!q) return;
  addMsg("user", q);
  elInput.value = "";

  if (!pipe) {
    addMsg("assistant", "モデルの準備中です。ステータスが“Ready.”になってから再送信してください。");
    return;
  }

  elStatus.textContent = "Thinking…";
  try {
    // FLAN系に最適化した明示プロンプト＋日本語指定＋箇条書き
    const prompt = [
      "あなたは丁寧で簡潔な日本語アシスタントです。",
      "次の質問に日本語で、箇条書き3〜5行で要点だけ答えてください。",
      `質問: ${q}`,
      "回答（日本語・箇条書き）:"
    ].join("\n");

    // サンプリングを切り、ビームサーチで安定出力
    const out = await pipe(prompt, {
      max_new_tokens: 160,
      do_sample: false,
      num_beams: 4,
      repetition_penalty: 1.2,
      length_penalty: 0.9,
      early_stopping: true
    });

    const raw = out?.[0]?.generated_text || "";
    const a = sanitize(raw) || fallbackAnswer(q);
    addMsg("assistant", a);
  } catch (err) {
    console.error(err);
    addMsg("assistant", fallbackAnswer(q));
  } finally {
    elStatus.textContent = "Ready.";
  }
});
