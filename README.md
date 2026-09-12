# AI Resource Hub

**AI Skills、3D、CAD、BIM、Prompt 與自動化資源工作台。**

統一入口整合：

- **Astra 3D Resource Hub** - AI 3D、Blender、CAD、BIM、Three.js 與工程 Prompt
- **Codex Skills Hub** - 可重用的 Codex Skills，搜尋、比較、管理，需要時再安裝

線上預覽：`https://rita112025-cpu.github.io/ai-resource-hub/`

> 純靜態、Vanilla HTML/CSS/JS + JSON、無後端、GitHub Pages 直接部署、編輯 JSON 即可新增內容

## 資訊架構

```
AI Resource Hub
│
├── 🔎 全站搜尋
│
├── 🧊 Astra 3D
│   ├── Blender
│   ├── CAD / BIM / Revit
│   ├── Three.js / WebGPU
│   └── Prompt
│
├── 🛠 Codex Skills
│   ├── GitHub / PR / CI
│   ├── Excel / 文件
│   ├── Automation
│   ├── Security
│   └── Skills
│
└── ★ 我的收藏
```

## 功能

- **統一導覽**：首頁 / Astra 3D / Codex Skills / 我的收藏 / 來源 / GitHub，桌面固定頂部，手機 hamburger，navbar 字不縮小
- **全站搜尋**：搜尋 Astra + Codex，標記來源 [Astra 3D] / [Codex Skill]，搜尋 title/desc/category/useCase/tags/source/risk/dependency
- **Hub Cards**：首頁兩張大型卡片顯示總數、精選、分類、最近新增
- **Astra 模組**：保留搜尋、快速分類、工程用途、熱門Tags、排序、收藏、Featured、Prompt Library、GitHub/Demo/Reference、Dark Mode、URL Filter
- **Codex 模組**：保留搜尋、分類、工作用途、風險、依賴/權限、Tags、Featured、收藏、手動已安裝標記、排序、Source、GitHub、安全提示，已安裝僅為手動標記，不掃描電腦，不執行 Shell
- **收藏**：統一「我的收藏」同時顯示 Astra + Codex，localStorage namespaced
- **URL Filter**：支援 `?hub=astra&category=Blender&tag=Architecture` / `?hub=codex&risk=low&q=github`，重新整理保留，Back/Forward 正常
- **RWD P0**：body >=16px，卡片標題 >=18px，Hero 30-36px 手機，button/tag 可閱讀，touch target >=44px，padding 16px，卡片手機1欄/平板2欄/桌機2-3欄，測試 320/375/390/430/768/1024/1440，無橫向捲動
- **Dark Mode**：prefers-color-scheme + 手動切換 + localStorage
- **效能**：首頁不預渲染所有卡片，僅進入Hub或搜尋才render，避免大量DOM，JSON失敗顯示明確錯誤，console.error，不crash整頁

## 專案結構

```
ai-resource-hub/
├─ index.html
├─ css/
│  ├─ base.css (variables, header, hero, search, container)
│  ├─ components.css (filters, chips, grid, card, badges, hub-cards, prompt, source)
│  └─ responsive.css (mobile P0 320-1440)
├─ js/
│  ├─ app.js (主入口，load data, router, global search)
│  ├─ router.js (hub解析, query build, syncURL, popstate)
│  ├─ search.js (normalize, matchesAstra, matchesCodex, globalSearch)
│  ├─ storage.js (namespaced keys, migration)
│  ├─ astra.js (Astra模組渲染, filter, fav)
│  └─ codex.js (Codex模組渲染, risk, dep, installed)
├─ data/
│  ├─ astra-resources.json (15 筆)
│  └─ codex-skills.json (10 筆)
├─ assets/
├─ scripts/
│  └─ validate-data.py
├─ .github/workflows/validate.yml
├─ README.md
├─ MIGRATION.md
├─ CURRENT_STATE.md
└─ LICENSE
```

## 如何新增 Astra resource

編輯 `data/astra-resources.json`，新增一筆：

```json
{
  "id": "unique-id",
  "title": "Your Title",
  "category": "Blender",
  "useCase": "平面圖轉 3D",
  "description": "工程導向說明",
  "tags": ["Blender","Architecture"],
  "source": "來源",
  "github": "",
  "demo": "",
  "prompt": "",
  "sourceCode": "",
  "reference": "",
  "featured": false,
  "added": "2026-09-12",
  "notes": "備註"
}
```

必填：`id`, `title`, `category`, `description`
選填其餘留空字串 `""`，**禁止捏造網址**，無法確認用 `""` 或 `null`

## 如何新增 Codex Skill

編輯 `data/codex-skills.json`，新增一筆，依流程：

1. 找到 Skill 資料夾，閱讀 SKILL.md
2. 查看 scripts/ / references/
3. 確認外部服務 / Git 操作 / 可能修改或刪除檔案
4. 建立 JSON，未確認用 `null`

```json
{
  "id": "my-skill",
  "name": "my-skill",
  "title": "標題",
  "category": "CI / Debug",
  "useCase": ["修 CI","分析錯誤"],
  "description": "說明",
  "tags": ["GitHub","CI"],
  "sourceName": "awesome-codex-skills",
  "sourceRepo": "https://github.com/composio-community/awesome-codex-skills",
  "skillPath": "my-skill",
  "skillUrl": "https://github.com/composio-community/awesome-codex-skills/blob/master/my-skill/SKILL.md",
  "requires": ["git","gh CLI"],
  "risk": "low",
  "capabilities": {"scripts": false, "shell": false, "network": false, "apiKey": false, "mcp": false, "gitWrite": false, "deleteFiles": false, "externalService": false},
  "safety": {"hasTests": null, "hasDryRun": null, "reviewed": false},
  "installCommand": "python skill-installer/scripts/install-skill-from-github.py --repo composio-community/awesome-codex-skills --path my-skill",
  "featured": false,
  "installed": false,
  "added": "2026-09-12",
  "notes": "備註"
}
```

## JSON schema

**Astra**:
```
id string, title string, category string, useCase? string, description string, tags? string[], source? string, github? string, demo? string, prompt? string, sourceCode? string, reference? string, featured? boolean, added? YYYY-MM-DD, notes? string
```

**Codex**:
```
id string, name string, title string, category string, useCase string[], description string, tags string[], sourceName string, sourceRepo string, skillPath string, skillUrl string, requires string[], risk low|medium|high, capabilities {scripts,shell,network,apiKey,mcp,gitWrite,deleteFiles,externalService boolean|null}, safety {hasTests,hasDryRun,reviewed boolean|null}, installCommand string, featured boolean, installed boolean, added YYYY-MM-DD, notes string
```

## 如何本機測試

不需要 npm install

```bash
python -m http.server 8000
# http://localhost:8000
```

測試：
- 首頁正常載入，Astra/Codex 卡片可進入
- 全站搜尋 Astra/Codex/混合/無結果
- Astra: 搜尋、category、useCase、tag、sort、favorite、Prompt copy、URL filter
- Codex: 搜尋、category、use case、risk、dependency、favorite、installed mark、sort、copy
- Storage: refresh後收藏仍存在，Dark Mode仍存在
- RWD 320/375/390/430/768/1024/1440，無水平捲動，手機正文>=16px，touch>=44px
- Dark Mode 桌面+手機，Keyboard Tab
- JSON fetch成功，Console無uncaught exception/404/JSON parse error

## 如何部署 GitHub Pages

1. 建立 repo `ai-resource-hub`
2. 推送到 main 分支，根目錄含 index.html
3. Settings → Pages → Deploy from branch → main / root
4. 網址 `https://USERNAME.github.io/ai-resource-hub/`

注意 base path：禁止 `/data/...` 絕對路徑，使用 `./data/...` relative

## localStorage 行為

新 keys (namespaced)：
- `ai-resource-hub:astra:favorites`
- `ai-resource-hub:codex:favorites`
- `ai-resource-hub:codex:installed`
- `ai-resource-hub:theme`

舊 keys 若存在且新 keys 不存在，會一次性遷移：
- `astra-3d-favorites` → 新
- `codex-favorites` / `codex-skills-favorites` → 新
- `codex-installed` / `codex-skills-installed` → 新
- `astra-theme` / `codex-theme` / `theme` → 新

限制：localStorage 是 origin  scoped，同 origin `https://rita112025-cpu.github.io` 下不同 pathname 共用同一個 storage，所以 `astra-3d-resource-hub` → `ai-resource-hub` 在同一瀏覽器可自動遷移；若不同瀏覽器或已清除，無法自動搬，需手動

## 安全限制

- 網站不執行 Shell，不自動安裝 Skill，不儲存 API Key/Token
- 安裝僅顯示/複製指令
- 已安裝僅代表手動標記，不能誤導為掃描電腦確認
- 不加入第三方 analytics、tracking script、遠端 executable script
- Skill description 使用 textContent，避免 innerHTML injection
- 風險顯示依證據，不可依感覺，未確認用 null

## 舊站 migration

舊站：
- https://rita112025-cpu.github.io/astra-3d-resource-hub/
- https://rita112025-cpu.github.io/codex-skills-hub/

新站驗收完成後，舊站改為輕量 landing / redirect 頁，顯示「此網站已整合至 AI Resource Hub」與「前往新版」按鈕，可搭配 meta refresh，但保留人工可點擊入口。驗收前禁止破壞舊站。

## 資料來源

- Astra：第一批整理自 `TripoGrowthLab/awesome-astra-prompts`，僅整理 Title/Category/Description/Tags，完整 Prompt 用原始連結；其餘自行整理，不虛構 URL
- Codex：主要整理自 `composio-community/awesome-codex-skills`，包含 10 個已驗證 Skill，外部 `yujiachen-y/codebase-recon-skill`
- Discovery Source：[MCP Servers Agent Skills 目錄](https://mcpservers.org/zh-TW/agent-skills)僅用於發現候選項目，不批量匯入或把站內統計當作各官方唯一 Skill 數量。新增前需逐筆查核原始 repository、授權、平台相容性、依賴、風險、更新狀態與重複項目；個人收藏及手動安裝狀態仍由 namespaced localStorage 保存。

## License

MIT - 見 LICENSE
Data sources belong to their respective authors.
