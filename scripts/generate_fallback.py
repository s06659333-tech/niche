# scripts/generate_fallback.py
# 目的：
# - 毎回必ず3本のフォールバック記事を生成（AI生成が失敗しても公開が止まらない）
# - 各記事の <head> に SEO 用メタ（canonical/description/OG）を自動挿入
# 使い方：
# 1) このファイルを保存
# 2) Actions -> daily-build を Run
# 3) content/ に fallback_post_*.html（今日の日付）が3本できる

import os
import datetime

# ★あなたのサイトURL（最後のスラッシュは付けない）
BASE = "https://s06659333-tech.github.io/niche"

# 出力ディレクトリを用意
os.makedirs("content", exist_ok=True)

# 本日の日付（例: 2025-09-20）
today = datetime.datetime.utcnow().strftime("%Y-%m-%d")

# 記事のHTMLテンプレート（{canonical} は後で置換）
TEMPLATE = """<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>フォールバック記事</title>
  <link rel="stylesheet" href="../assets/css/styles.css">

  <!-- ▼▼ SEO 基本（記事ページ用） ▼▼ -->
  <link rel="canonical" href="{canonical}">
  <meta name="description" content="自動生成テンプレ記事。学習の要点を簡潔に解説します。">
  <meta property="og:type" content="article">
  <meta property="og:title" content="フォールバック記事">
  <meta property="og:description" content="自動生成テンプレ記事。学習の要点を簡潔に解説します。">
  <!-- ▲▲ ここまで（必要なら後で書き換えOK） ▲▲ -->
</head>
<body>
<header class="site-header"><h1>フォールバック記事</h1><nav><a href="../index.html">Home</a></nav></header>
<main class="page">
<article>
<h3>自動生成の一時フォールバック</h3>
<p>本日のAI生成に問題が発生したため、テンプレート記事を自動出力しました。次回以降は通常の自動生成に切り替え予定です。</p>
<ul>
  <li>要点1：ニッチ×網羅×分かりやすさ</li>
  <li>要点2：毎日少量で安定更新</li>
  <li>要点3：引用・免責の明記</li>
</ul>
<p>まとめ：まずはサイトを動かし続けることが最優先です。</p>
</article>
</main>
<footer class="site-footer"><small>© <span id="year"></span> Niche AI Lab.</small></footer>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body></html>
"""

def main():
    # 本日分を 1〜3 の3本生成
    for i in range(1, 4):
        # 出力ファイル名（例：fallback_post_1_2025-09-20.html）
        fname = f"fallback_post_{i}_{today}.html"
        # 各記事の正規URL（canonical に入れる）
        canonical = f"{BASE}/content/{fname}"
        # ファイルへ書き込み
        target_path = os.path.join("content", fname)
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(TEMPLATE.format(canonical=canonical))
        print("Wrote", target_path)

if __name__ == "__main__":
    main()
