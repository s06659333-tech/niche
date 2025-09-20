// scripts/generate.mjs — robust daily generator (Node + transformers.js)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from '@xenova/transformers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outDir = path.resolve(__dirname, '..', 'content');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const TOPICS = [
  '英語フレーズ_空港_チェックイン',
  '英語フレーズ_道案内_丁寧表現',
  '投資_用語集_ボラティリティ',
  '投資_入門_つみたてのコツ',
  '旅行_会話_レストラン注文',
  '旅行_会話_トラブル時の説明',
];

const TEMPLATE = (title, body) => `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"/>
<link rel="stylesheet" href="../assets/css/styles.css" />
<title>${title}</title></head>
<body>
<header class="site-header"><h1>${title}</h1><nav><a href="../index.html">Home</a></nav></header>
<main class="page">
<article><pre style="white-space: pre-wrap;">${body}</pre></article>
<section id="aff" style="margin-top:16px;padding:12px;border:1px solid #eee;border-radius:8px;">
  <strong>おすすめリソース</strong><br/>
  <a href="https://www.amazon.co.jp/" rel="sponsored nofollow">関連書籍を探す（外部）</a>
</section>
<p style="font-size:12px;opacity:.8;">* 自動生成（正確性は保証されません）。</p>
</main>
<footer class="site-footer"><small>© <span id="year"></span> Niche AI Lab.</small></footer>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body></html>`;

function slug(s){return s.replace(/\s/g,'_').replace(/[\\/:*?"<>|]/g,'');}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}

function promptFor(topic){
  return `指示: 次のテーマについて初心者向けに日本語で600〜900字、箇条書き+例文+注意点+3行まとめを含めて書け。前置きや免責は不要。必要に応じて英訳の対訳も併記せよ。
テーマ: ${topic}
出力:`;
}

function sanitize(s){
  const t=(s||'').trim();
  if(!t||/^[\s:：・。、…._-]+$/.test(t)||t.length<60) return null; // 空に近い出力を弾く
  return t;
}

async function main(){
  const today = new Date().toISOString().slice(0,10);
  let pipe;
  try {
    pipe = await pipeline('text2text-generation','Xenova/flan-t5-small');
  } catch(e) {
    console.warn('model load failed, will write bare fallback:', e);
  }

  const count = 3;
  for(let i=0;i<count;i++){
    const topic = pick(TOPICS);
    const title = topic;
    const fname = `${slug(title)}_${today}.html`;

    let body = '';
    try{
      if(!pipe) throw new Error('no pipe');
      const p = promptFor(topic);
      // 1回目（サンプリング）
      let out = await pipe(p,{max_new_tokens:420, min_new_tokens:120, do_sample:true, temperature:0.7, top_p:0.92, repetition_penalty:1.12});
      body = sanitize(out?.[0]?.generated_text) || '';
      // だめなら2回目（ビームで安定化）
      if(!body){
        out = await pipe(p,{max_new_tokens:380, min_new_tokens:120, do_sample:false, num_beams:4, repetition_penalty:1.2, length_penalty:0.9, early_stopping:true});
        body = sanitize(out?.[0]?.generated_text) || '';
      }
    }catch(err){
      console.warn('gen error:', err);
    }

    if(!body){
      body = [
        `【自動生成フォールバック】`,
        `テーマ: ${title}`,
        `本日の生成に失敗したため、テンプレートを出力しました。次回以降に自動で置き換わります。`,
        `- 用語定義`,
        `- 例文・手順`,
        `- 注意点`,
        `まとめ: 要点を3行で。`
      ].join('\n');
    }

    fs.writeFileSync(path.join(outDir,fname), TEMPLATE(title, body), 'utf-8');
    console.log('Generated:', fname);
  }
}

main().catch(e=>{console.error('fatal',e);});
