import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from '@xenova/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.resolve(__dirname, '..', 'content');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// できるだけ軽量＆安定な T5 系に変更（Node/CI でも通りやすい）
const MODEL_ID = 'Xenova/flan-t5-small';

const topics = [
  '英語フレーズ_空港_チェックイン',
  '英語フレーズ_道案内_丁寧表現',
  '投資_用語集_ボラティリティ',
  '投資_入門_つみたてのコツ',
  '旅行_会話_レストラン注文',
  '旅行_会話_トラブル時の説明',
];

function buildPrompt(topic) {
  return `次のテーマについて、初心者にもわかる日本語で約600〜800字、必要に応じて英訳の対訳も交え、
- 導入（何の話か）
- 具体例（箇条書きで3〜6）
- 注意点
- 最後に要点まとめ（3行）
という構成で書いてください。テーマ：「${topic}」`;
}

function slugify(s) {
  return s.replace(/[\s]/g, '_').replace(/[\\/:*?"<>|]/g, '');
}

async function main() {
  const outCount = 3;
  const today = new Date().toISOString().slice(0, 10);
  let pipe;

  try {
    pipe = await pipeline('text2text-generation', MODEL_ID);
  } catch (e) {
    console.error('Model load failed:', e);
  }

  for (let i = 0; i < outCount; i++) {
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const title = `${topic}`;
    const fname = `${slugify(title)}_${today}.html`;
    let body = '';

    try {
      if (!pipe) throw new Error('pipeline not initialized');
      const prompt = buildPrompt(topic);
      const result = await pipe(prompt, { max_new_tokens: 420 });
      body = result[0]?.generated_text?.trim() || '';
    } catch (err) {
      console.error('Generation error:', err);
      body = [
        `【自動生成フォールバック】`,
        `テーマ: ${title}`,
        ``,
        `本日の自動生成に失敗したため、テンプレート記事を出力しました。`,
        `・概要：${title} の基礎を初心者向けに整理します。`,
        `・ポイント：用語定義、手順、注意点、まとめ。`,
        `※ 次回以降は自動生成で上書きされます。`
      ].join('\n');
    }

    const html = `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"/>
<link rel="stylesheet" href="../assets/css/styles.css" />
<title>${title}</title></head>
<body>
<header class="site-header"><h1>${title}</h1><nav><a href="../index.html">Home</a></nav></header>
<main class="page">
<article>
<pre style="white-space: pre-wrap;">${body}</pre>
</article>
<p style="font-size:12px;opacity:.8;">* 自動生成（失敗時はフォールバック）。正確性は保証されません。</p>
</main>
<footer class="site-footer"><small>© <span id="year"></span> Niche AI Lab.</small></footer>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body></html>`;
    fs.writeFileSync(path.join(outDir, fname), html, 'utf-8');
    console.log('Generated:', fname);
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(0); // 失敗してもジョブを落とさない
});
