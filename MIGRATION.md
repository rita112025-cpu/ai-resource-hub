# MIGRATION.md - 舊站遷移說明

## 新站

- Repo: `ai-resource-hub`
- URL: `https://rita112025-cpu.github.io/ai-resource-hub/`

## 舊站

- Astra: `https://rita112025-cpu.github.io/astra-3d-resource-hub/` (Repo: `astra-3d-resource-hub`)
- Codex: `https://rita112025-cpu.github.io/codex-skills-hub/` (Repo: `codex-skills-hub`)

## 遷移原則

1. 新站必須完全驗收 PASS 後，才處理舊站
2. 舊站禁止直接刪除，改為輕量 landing + redirect
3. 保留人工可點擊入口，不只用立即 JS redirect
4. 可搭配 meta refresh 5秒，但頁面仍顯示說明與按鈕

## 舊站改為 redirect 頁範例

### Astra 舊站 `index.html` 最終版本

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Astra 3D Resource Hub 已遷移</title>
<meta http-equiv="refresh" content="5; url=https://rita112025-cpu.github.io/ai-resource-hub/?hub=astra">
<style>body{font-family:sans-serif; max-width:640px; margin:40px auto; padding:0 20px; line-height:1.6} .btn{display:inline-flex; padding:12px 20px; background:#0969da; color:#fff; border-radius:10px; text-decoration:none; min-height:44px; align-items:center}</style>
</head>
<body>
<h1>Astra 3D Resource Hub 已整合</h1>
<p>此網站已整合至 <strong>AI Resource Hub</strong></p>
<p>5 秒後自動導向新版，或點擊下方按鈕立即前往</p>
<p><a class="btn" href="https://rita112025-cpu.github.io/ai-resource-hub/?hub=astra">前往新版 Astra 3D →</a></p>
<p><a href="https://rita112025-cpu.github.io/ai-resource-hub/">前往 AI Resource Hub 首頁</a></p>
</body>
</html>
```

### Codex 舊站

```html
<meta http-equiv="refresh" content="5; url=https://rita112025-cpu.github.io/ai-resource-hub/?hub=codex">
...
<a class="btn" href="https://rita112025-cpu.github.io/ai-resource-hub/?hub=codex">前往新版 Codex Skills →</a>
```

## localStorage 遷移

### 自動遷移 (同 origin)

- 舊 Keys: `astra-3d-favorites`, `codex-favorites`, `codex-skills-favorites`, `codex-installed`, `codex-skills-installed`, `astra-theme`, `codex-theme`, `theme`
- 新 Keys: `ai-resource-hub:astra:favorites`, `ai-resource-hub:codex:favorites`, `ai-resource-hub:codex:installed`, `ai-resource-hub:theme`
- 實作：`js/storage.js` 的 `migrateIfNeeded()` 在新站首次載入時檢查，若舊存在且新不存在，自動複製
- 限制：localStorage 是 origin-scoped (https://rita112025-cpu.github.io)，不同 pathname 共用，所以同瀏覽器下舊站→新站可自動遷移
- 若不同瀏覽器、無痕、已清除，則無法自動搬

### 手動遷移 (若自動失敗)

1. 在舊站 Console 執行：
```js
localStorage.getItem('astra-3d-favorites')
localStorage.getItem('codex-favorites')
localStorage.getItem('codex-installed')
```
2. 複製值
3. 在新站 Console 執行：
```js
localStorage.setItem('ai-resource-hub:astra:favorites', '...')
localStorage.setItem('ai-resource-hub:codex:favorites', '...')
localStorage.setItem('ai-resource-hub:codex:installed', '...')
```

### 無法遷移的情況

- 舊站與新站在不同 origin (不同 domain) - 本專案同 origin，所以可遷移
- 使用不同瀏覽器或裝置
- 已清除瀏覽資料
- 舊站使用 `sessionStorage` (本專案皆為 localStorage)

README 必須寫明限制，已在 README 的 localStorage 行為章節說明。

## 部署後驗證

- 新站 HTTP 200：index.html, css/base.css, css/components.css, css/responsive.css, js/app.js, js/*, data/*.json
- 舊站 redirect 頁 HTTP 200，人工點擊可到新站
- 舊站 README 更新，指向新站

## 回滾

若新站有嚴重問題，可將舊站 index.html 從 git history 還原，重新部署。

## 未來擴充

架構已允許未來增加 Claude Skills / MCP / Prompt Library / AI Automation / GitHub Projects / Engineering Tools，但現在不增加空白分類，不放 Coming Soon 卡片。
