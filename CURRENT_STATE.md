# CURRENT_STATE.md - 整合前現況分析

## 1. 專案確認

### Astra 3D Resource Hub
- **Repo**: https://github.com/rita112025-cpu/astra-3d-resource-hub (存在，已驗證 205 行 README)
- **Pages**: https://rita112025-cpu.github.io/astra-3d-resource-hub/
- **結構**:
  ```
  astra-3d-resource-hub/
  ├─ index.html (單頁 Hero + Filters + Resources + Featured + Prompt Library + Sources)
  ├─ style.css (variables, header, hero, filters, grid 3欄, card, prompt, source, footer, mobile fix 640px breakpoint)
  ├─ app.js (DATA_URL=./data/resources.json, categories, useCases, search, URL sync, favorites, theme, render)
  ├─ data/resources.json (15 筆，含 CAD DXF Parser - Wall Extraction, Tolerancing Check)
  ├─ README.md
  └─ LICENSE
  ```
- **JSON Schema**:
  ```ts
  id, title, category, useCase, description, tags[], source, github, demo, prompt, sourceCode, reference, featured boolean, added YYYY-MM-DD, notes
  ```
- **功能**: 搜尋 title/desc/category/useCase/tags/source/notes, 分類(全部+Astra/Blender/CAD...), 工程用途, 熱門Tags, 排序(精選/名稱/最新), 收藏 localStorage key `astra-3d-favorites`, URL Filter ?category&tag&q&useCase&sort&fav, Dark Mode localStorage `astra-theme`, Prompt Library 內建3個, RWD 3/2/1欄, Toast複製

### Codex Skills Hub
- **Repo**: https://github.com/rita112025-cpu/codex-skills-hub (存在，已驗證 169 行 README，git push 歷史 77c9999->2c06d4c)
- **Pages**: https://rita112025-cpu.github.io/codex-skills-hub/
- **結構**:
  ```
  codex-skills-hub/
  ├─ index.html (Hero + Filters 含風險/依賴 + Skills + Featured + My Skills + Sources)
  ├─ style.css (同Astra風格，深色科技感，card有risk badges, capability badges)
  ├─ app.js (DATA_URL=./data/skills.json, categories, useCases, risks, dependencies, tags, fav, installed, search, URL sync)
  ├─ data/skills.json (10 筆，來自 ComposioHQ/awesome-codex-skills + yujiachen-y/codebase-recon-skill)
  ├─ README.md
  └─ LICENSE
  ```
- **JSON Schema**:
  ```ts
  id, name, title, category, useCase[], description, tags[], sourceName, sourceRepo, skillPath, skillUrl, requires[], risk low|medium|high, capabilities{scripts,shell,network,apiKey,mcp,gitWrite,deleteFiles,externalService boolean|null}, safety{hasTests,hasDryRun,reviewed}, installCommand, featured boolean, installed boolean (僅UI初始), added YYYY-MM-DD, notes
  ```
- **功能**: 搜尋 name/title/desc/category/useCase/tags/sourceName/requires/notes, 分類, 工作用途, 風險, 依賴/權限, 熱門Tags, 排序(精選/名稱/最新/風險), 收藏 key `codex-favorites` (舊版) / `codex-skills-favorites`, 已安裝標記 key `codex-installed` / `codex-skills-installed` (手動標記，非偵測), URL Filter ?category&risk&q&tag&useCase, Dark Mode, 複製安裝指令(不執行Shell), 安全提示

## 2. 重複功能

- Header (brand + nav + GitHub + theme toggle)
- Hero + Search input + resultCount + clear
- Filters (chip-group, filter-block, filter-actions, sort select)
- Grid (3欄->2欄->1欄)
- Card (top, title, badges, desc, tags, meta, actions, fav-btn)
- State cards (error, empty)
- Featured section
- Sources / GitHub區
- Footer
- Toast
- Theme (data-theme, localStorage, prefers-color-scheme)
- Favorites framework (Set + localStorage + toggle)
- URL Filter (URLSearchParams + history.replaceState)
- Search (大小寫不敏感，中英文，filterAndSort)
- Mobile RWD (container padding, overflow-x clip, touch targets)
- Vanilla JS, no build, fetch JSON with no-store, error handling

## 3. 可共用部分

- layout: header, main container, footer, hero structure
- css: base.css (variables, reset, body, container, header, hero, search), components.css (filters, chips, btn, grid, card, badges, state, prompt, source, toast, footer), responsive.css (mobile typography P0)
- js: storage.js (namespaced localStorage, migration), theme.js (共用), router.js (hub=astra|codex|favorites|home, query sync, history), search.js (global search across both datasets with source label), utils (escapeHtml, copyText, showToast)
- favorites framework: unified keys
- URL filter: 保留 q, category, useCase, tag, risk, sort, fav, hub
- search function: 同一套 debounce + filtering
- Dark Mode contrast, focus-visible, keyboard nav

## 4. 不能直接合併部分

- **Schema 差異**:
  - Astra: 單一 useCase string, 有 prompt/github/demo/sourceCode/reference 欄位
  - Codex: useCase array, 有 risk, capabilities, safety, requires, installCommand, skillUrl, sourceRepo
  - 不能把 Astra 的 prompt 塞進 Codex 的 risk，也不能把 Codex 的 capabilities 塞進 Astra
- **Card UI差異**:
  - Astra card 需顯示: category badge, useCase, Prompt複製/連結, GitHub/Demo/Source/Reference 按鈕
  - Codex card 需顯示: risk badge (low/medium/high), capabilities badges (Scripts/Shell/Network/API...), requires, installCommand複製, skillUrl, sourceRepo, safety, installed手動標記警告
- **Filter差異**:
  - Astra: category + useCase + tags
  - Codex: category + useCase + risk + dependency(requires) + tags
  - 不能用同一組filter同時套用
- **行為差異**:
  - Astra Prompt Library 內建3個，Codex無此區但有 My Skills 區
  - Codex 的「已安裝」只能是手動標記，需UI文案明確，不能誤導為掃描電腦
  - 安裝方式: Astra是開連結，Codex是複製指令
- **localStorage**: 舊版keys不同，需namespace化並提供migration說明，不能假裝自動跨domain搬運

## 5. localStorage 使用方式

- Astra舊: `astra-3d-favorites` (Set of ids), `astra-theme`
- Codex舊: `codex-favorites` / `codex-skills-favorites`, `codex-installed` / `codex-skills-installed`, `codex-theme` (部分版本), `theme` (通用)
- 新: `ai-resource-hub:astra:favorites`, `ai-resource-hub:codex:favorites`, `ai-resource-hub:codex:installed`, `ai-resource-hub:theme`, `ai-resource-hub:hub` (可選)
- Migration: 若偵測舊key存在且新key不存在，詢問是否遷移或一次性自動遷移(若同domain/path)，但跨Pages (不同repo path) 無法直接讀取，需在README寫明限制

## 6. URL Filter 使用方式

- Astra: `?category=Blender&tag=Architecture&q=...&useCase=平面圖轉 3D&sort=featured&fav=1`
- Codex: `?category=CI%2FDebug&risk=low&q=github&useCase=修 CI&tag=GitHub&sort=risk&fav=1&installed=1`
- 新: `?hub=astra&category=Blender&tag=Architecture` / `?hub=codex&risk=low&q=github` / `?hub=favorites` + 全站搜尋 `?q=Blender&hub=home`
- 需使用 `history.replaceState` 避免reload，`popstate` 支援 Back/Forward，重新整理後filter不得消失
- Base path: GitHub Pages project site `/ai-resource-hub/`，禁止使用 `/data/...` 絕對路徑，必須 `./data/...` relative

## 7. 現有 RWD

- Astra: 已有 mobile fix @media max-width 640px: body 16px, hero 30px, search 16px/52px, chip 15px/40px, select 16px/44px, btn 15px/44px, grid 1欄, card-actions flex 50%/100%, container padding 16px, overflow-x clip, brand-text縮減, 400px以下hero 28px, 360px以下container 14px, 340px以下brand-text隱藏
- Codex: 類似，但無640px細緻fix，舊版grid 3->2->1, header height 56px, nav-link 14px, 需統一到P0標準
- 新: 統一使用 640px breakpoint，mobile font >=16px, title >=18px, hero 30-36px, button/tag >=14-15px, touch target >=44px, padding 16px, 320/375/390/430/768/1024/1440測試，禁止10-12px navbar字，禁止橫向捲動

## 8. Dark Mode

- 兩站皆: CSS variables --bg --card --border --text --secondary --accent --accent-soft --header-bg --shadow, [data-theme="dark"]覆蓋, @media prefers-color-scheme dark 自動, button toggle, localStorage保存, focus-visible outline
- 新: 共用 base.css variables, 增加 --accent-astra #0969da / #58a6ff, --accent-codex #8250df / #bc8cff 差異但整體同產品

## 9. 搜尋功能

- Astra: input event -> state.q -> filterAndSort -> matches: title/desc/category/useCase/tags/source/notes 包含即命中
- Codex: 同上，matches: name/title/desc/category/useCase/tags/sourceName/requires/notes/risk
- 新: Global search需搜兩份JSON，標記來源 [Astra 3D] / [Codex Skill]，debounce 200ms，避免大量DOM，首頁不預渲染所有卡片，僅搜尋或進入Hub才render

## 10. 收藏功能

- Astra: favSet Set, toggleFav(id), saveFavorites localStorage, render時fav-btn ☆/★, filter favOnly
- Codex: 同上 + installedSet Set, installedOnly filter, UI文案「手動標記已安裝」
- 新: 統一 storage.js提供 get/set for astraFavorites, codexFavorites, codexInstalled, 主題, 需namespace

## 11. 其他

- 兩站皆: 純靜態，無npm，無backend，無database，GitHub Pages Deploy from branch main/root
- 效能: fetch no-store, 失敗顯示 errorState + console.error, 不crash整頁
- Accessibility: semantic HTML, button/a正確, keyboard Tab, visible focus, aria-label, contrast, prefers-reduced-motion
- SEO: title, description, og:title/desc/type, canonical
