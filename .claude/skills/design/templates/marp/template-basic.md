---
marp: true
theme: default
paginate: true
---

<style>
/* zero-dependency: no CDN. Self-host fonts from the design skill's assets/fonts/ kit if needed. */

:root {
  --color-background: #f8f8f4;
  --color-foreground: #3a3b5a;
  --color-heading: #4f86c6;
  --color-hr: #000000;
  --font-default: 'Hiragino Kaku Gothic ProN', 'Meiryo', sans-serif;
}

section {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-default);
  font-weight: 400;
  box-sizing: border-box;
  border-bottom: 8px solid var(--color-hr);
  position: relative;
  line-height: 1.7;
  font-size: 22px;
  padding: 56px;
}

section:last-of-type {
  border-bottom: none;
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 700;
  color: var(--color-heading);
  margin: 0;
  padding: 0;
}

h1 {
  font-size: 56px;
  line-height: 1.4;
  text-align: left;
}

h2 {
  position: absolute;
  top: 40px;
  left: 56px;
  right: 56px;
  font-size: 40px;
  padding-top: 0;
  padding-bottom: 16px;
}

h2::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 8px;
  width: 60px;
  height: 2px;
  background-color: var(--color-hr);
}

h2 + * {
  margin-top: 112px;
}

h3 {
  color: var(--color-foreground);
  font-size: 28px;
  margin-top: 32px;
  margin-bottom: 12px;
}

ul, ol {
  padding-left: 32px;
}

li {
  margin-bottom: 10px;
}

footer {
  font-size: 0;
  color: transparent;
  position: absolute;
  left: 56px;
  right: 56px;
  bottom: 40px;
  height: 8px;
  background-color: var(--color-heading);
}

section.lead {
  border-bottom: 8px solid var(--color-hr);
}

section.lead footer {
  display: none;
}

section.lead h1 {
  margin-bottom: 24px;
}

section.lead p {
  font-size: 24px;
  color: var(--color-foreground);
}
</style>

<!-- _class: lead -->

# プレゼンテーションタイトル

あなたの名前
2024年XX月XX日

---

## アジェンダ

- トピック1
- トピック2
- トピック3
- トピック4

---

## スライドタイトル

- ポイント1
- ポイント2
- ポイント3

---

## まとめ

- 要点1
- 要点2
- ご清聴ありがとうございました
