# scripts/build_sitemap.py
import os, urllib.parse

BASE_URL = "https://s06659333-tech.github.io/niche"  # 必要なら変更
entries = [f"{BASE_URL}/", f"{BASE_URL}/about.html"]

if os.path.isdir("content"):
    files = sorted([f for f in os.listdir("content") if f.endswith(".html")])
    for f in files:
        entries.append(f"{BASE_URL}/content/{urllib.parse.quote(f)}")

xml = ['<?xml version="1.0" encoding="UTF-8"?>',
       '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
xml += [f"  <url><loc>{loc}</loc></url>" for loc in entries]
xml.append('</urlset>')

with open("sitemap.xml","w",encoding="utf-8") as fp:
    fp.write("\n".join(xml) + "\n")

print("sitemap.xml written with", len(entries), "entries")
