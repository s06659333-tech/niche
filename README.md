# Serverless AI Q&A Starter (JA/EN)

**JA (日本語)**  
- 目的：**費用ゼロ（API/サーバー費用なし）＆完全非対面**でAIサイトを運用するためのスターター。  
- 構成：
  - ブラウザ内AIチャット：**WebLLM**（`index.html` + `assets/js/app.js`）
  - 自動記事生成：**GitHub Actions + @xenova/transformers**（`scripts/generate.mjs`）
  - ホスティング：**GitHub Pages**（無料）
- 収益化：アフィリエイト/広告（後から貼る）

## 使い方（最短）
1. GitHubで新規Publicリポジトリを作る（例：`niche-ai-site`）。
2. このリポジトリ内のファイルをそのままアップロード（ZIP解凍してドラッグ&ドロップ）。
3. **Settings → Pages** で、Branchを `main` / `/` に設定して保存（URLが表示されます）。
4. **Actions** タブを開き、「I understand…」で有効化。`daily-build` が毎日実行されます。  
   - `sitemap.xml` 生成内の `YOUR_GITHUB_USERNAME` / `YOUR_REPO_NAME` を自分の値に変更してください。
5. `index.html` にチャットUI（WebLLM）があり、ブラウザ内で推論します（初回読込に時間）。

### 注意
- CIの生成モデルは小型（`distilgpt2`）なので品質控えめです。まずは運用をゼロコストで回し、後からトピック・テンプレ・後処理で品質を高めてください。
- WebLLMのモデルはブラウザで読み込まれるため、PC/ブラウザの性能やWebGPU対応に依存します。

---

**EN (English)**  
- Goal: Operate an AI site with **zero cost** (no server/API fees) and **fully remote**.
- Stack:
  - In-browser AI chat: **WebLLM** (`index.html`, `assets/js/app.js`)
  - Auto content: **GitHub Actions + @xenova/transformers** (`scripts/generate.mjs`)
  - Hosting: **GitHub Pages** (free)
- Monetization: affiliates/ads (add later).

## Quick Start
1. Create a new public GitHub repo (e.g., `niche-ai-site`).
2. Upload all files from this starter.
3. Enable **Pages**: `Settings → Pages`, set `Branch: main` and root `/`.
4. Enable **Actions**, allow workflows to run. The `daily-build` will create 3 pages per day.  
   - Update `YOUR_GITHUB_USERNAME` / `YOUR_REPO_NAME` in the sitemap step.
5. Try the chat on `index.html`. The model loads in your browser and runs locally (no server).

### Notes
- The CI model is tiny (distilgpt2), so quality is basic. Improve with better prompts, curation, or a bigger open model later.
- WebLLM relies on your browser and hardware. Initial model load can take a while.
