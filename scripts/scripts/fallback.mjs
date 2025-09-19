// scripts/fallback.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '..', 'content');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const topics = [
  '英語フレーズ_空港_チェックイン',
  '投資_入門_つみたてのコツ',
  '旅行_会話_ホテルチェックイン'
];

function slugify(s) {
  return s.replace(/\s/g, '_').replace(/[\\/:*?"<>|]/g, '');
}

for (const t of topics) {
  const fname = `${slugify(t)}_${today}.html`;
  const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"/>
<link rel="stylesheet" href="../assets/css/styles.css"/>
<title>${t}</title></head>
<body>
<header class="site-header"><h1>${t}</h1><nav><a href="../index.html">Home</a></nav></header>
<main class="page">
<article>
<h3>フォールバック自動生成</h3>
<p>本日のAI生成で問題が発生したため、テンプレート記事を出力しました。次回以降は自動で上書きされます。</p>
<ul><li>要点1</li><li>要点2</li><li>要点3</li></ul>
<p>まとめ：短い要点を記載。</p>
</article>
</main>
<footer class="site-footer"><small>© <span id="year"></span> Niche AI Lab.</small></footer>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body></html>`;
  fs.writeFileSync(path.join(outDir, fname), html, 'utf-8');
  console.log('Fallback Generated:', fname);
}
