// scripts/build-sitemap.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ★ あなたのPagesのベースURL（必要なら変更）
const baseUrl = 'https://s06659333-tech.github.io/niche';

const contentDir = path.resolve(__dirname, '..', 'content');
const outFile = path.resolve(__dirname, '..', 'sitemap.xml');

const entries = [];
entries.push(`${baseUrl}/`);
entries.push(`${baseUrl}/about.html`);

if (fs.existsSync(contentDir)) {
  const files = fs.readdirSync(contentDir)
    .filter(f => f.endsWith('.html'))
    .sort();

  for (const f of files) {
    // ファイル名に日本語が含まれるためURLエンコードを推奨
    entries.push(`${baseUrl}/content/${encodeURIComponent(f)}`);
  }
}

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
for (const loc of entries) {
  xml += `  <url><loc>${loc}</loc></url>\n`;
}
xml += `</urlset>\n`;

fs.writeFileSync(outFile, xml, 'utf-8');
console.log('sitemap.xml written with', entries.length, 'entries');
