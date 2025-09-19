import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from '@xenova/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.resolve(__dirname, '..', 'content');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Topics you can edit freely (long-tail SEO, bilingual helpful content)
const topics = [
  '英語フレーズ_空港_チェックイン',
  '英語フレーズ_道案内_丁寧表現',
  '投資_用語集_ボラティリティ',
  '投資_入門_つみたてのコツ',
  '旅行_会話_レストラン注文',
  '旅行_会話_トラブル時の説明',
];

// Simple bilingual instruction prompt (JP primary with EN support)
function buildPrompt(topic) {
  return `あなたは日本語話者向けの専門ライターです。テーマ「${topic}」について、
- 日本語メイン＋必要に応じて英訳（対訳）
- 初心者向けに手順・例文・注意点を含めて、約800〜1000字
- 最後に3行で要点まとめ
という構成のコンテンツ案を作ってください。`;
}

const outCount = 3; // generate 3 pages per run to keep it light
const today = new Date().toISOString().slice(0, 10);

// Use a small model to avoid heavy CI load. Quality is basic but zero-cost.
const pipe = await pipeline('text-generation', 'Xenova/distilgpt2');

function slugify(s) {
  return s.replace(/[\s]/g, '_').replace(/[\\/:*?"<>|]/g, '');
}

for (let i = 0; i < outCount; i++) {
  const topic = topics[(Math.floor(Math.random() * topics.length))];
  const prompt = buildPrompt(topic);
  const result = await pipe(prompt, { max_new_tokens: 380, temperature: 0.9, do_sample: true });
  const text = result[0]?.generated_text || '';

  const title = `${topic}`;
  const fname = `${slugify(title)}_${today}.html`;
  const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"/><link rel="stylesheet" href="../assets/css/styles.css" />
<title>${title}</title></head>
<body>
<header class="site-header"><h1>${title}</h1><nav><a href="../index.html">Home</a></nav></header>
<main class="page">
<article>
<pre style="white-space: pre-wrap;">${text}</pre>
</article>
<p style="font-size:12px;opacity:.8;">* 本文は小型オープンモデルで自動生成されました。正確性は保証されません。</p>
</main>
<footer class="site-footer"><small>© <span id="year"></span> Niche AI Lab.</small></footer>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body></html>`;

  fs.writeFileSync(path.join(outDir, fname), html, 'utf-8');
  console.log('Generated:', fname);
}
