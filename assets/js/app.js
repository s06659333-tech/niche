// transformers.js (WASM) 強化版：FLAN最適化＋min_new_tokens＋二段階フォールバック
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

// 安定化
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

let pipe = null;

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
  // FLAN小型 → T5小型 → LaMini順に試す
  for (const id of ["Xenova/flan-t5-small","Xenova/t5-small","Xenova/LaMini-T5-61M"]) {
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

function cannedAnswer(q) {
  const lc = q.toLowerCase();
  if (lc.includes("使い方") || lc.includes("how")) {
    return [
      "① 上の入力欄に質問を書いて送信します。",
      "② 初回はモデルの読み込みに時間がかかります（1分前後）。",
      "③ 生成はブラウザ内で完結し、サーバーには送信されません。",
      "④ 「Articles」から毎日自動生成の記事も読めます。"
    ].join("\n");
  }
  return "うまく生成できませんでした。別の表現で短く質問してみてください。";
}

(async () => {
  try { await loadModel(); }
  catch (e) {
    console.error(e);
    elStatus.textContent = "モデル読込に失敗しました。Ctrl+F5で再読み込み、または別回線でお試しください。";
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
    // ★ FLAN向け指示：日本語・箇条書き・5行以内・不要語尾禁止
    const prompt = [
      "指示: 次の質問に日本語で、箇条書き3〜5行、各行20〜40字で簡潔に答えよ。前置きや免責は書かない。",
      `質問: ${q}`,
      "出力:"
    ].join("\n");

    // 生成を“確実に”出させる設定（min_new_tokensで空回避）
    let out = await pipe(prompt, {
      max_new_tokens: 200,
      min_new_tokens: 40,
      do_sample: true,
      temperature: 0.7,
      top_p: 0.92,
      repetition_penalty: 1.15
    });

    let raw = out?.[0]?.generated_text ?? "";
    // もし無効っぽければサンプリング→ビームに切替して再試行
    if (!sanitize(raw)) {
      out = await pipe(prompt, {
        max_new_tokens: 180,
        min_new_tokens: 40,
        do_sample: false,
        num_beams: 4,
        repetition_penalty: 1.2,
        length_penalty: 0.9,
        early_stopping: true
      });
      raw = out?.[0]?.generated_text ?? "";
    }

    const a = sanitize(raw) || cannedAnswer(q);
    addMsg("assistant", a);
  } catch (err) {
    console.error(err);
    addMsg("assistant", cannedAnswer(q));
  } finally {
    elStatus.textContent = "Ready.";
  }
});
// --- UTM自動付与（data-track付きの外部リンクだけ対象） ---
(function () {
  const UTM = {
    source: 'niche',
    medium: 'link',
    // A/B等を載せたいときは <body data-utm-campaign="..."> を使う
    campaign: document.body.dataset.utmCampaign || 'sitewide'
  };

  function addUTM(url, slot) {
    try {
      const u = new URL(url, location.href);
      // 自サイトは除外
      if (u.hostname.endsWith('github.io')) return url;
      u.searchParams.set('utm_source', UTM.source);
      u.searchParams.set('utm_medium', UTM.medium);
      u.searchParams.set('utm_campaign', UTM.campaign);
      if (slot) u.searchParams.set('utm_content', slot); // どの位置のリンクか
      return u.toString();
    } catch { return url; }
  }

  document.querySelectorAll('a[data-track][href]').forEach(a => {
    const slot = a.dataset.slot || 'inline';
    a.href = addUTM(a.href, slot);
  });
})();
