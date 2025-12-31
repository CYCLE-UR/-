# 智能搶票助手 (Ticket Bot Helper)

一個純前端網頁應用，幫助追星族通過自動化機制搶購演唱會門票。

## 🌐 在線使用（推薦）

**項目已部署到 GitHub Pages，可直接使用：**

| 頁面 | 網址 | 說明 |
|------|------|------|
| 🏠 主頁 | [https://cycle-ur.github.io/-/](https://cycle-ur.github.io/-/) | 項目介紹 |
| 👥 協作系統 | [https://cycle-ur.github.io/-/user-system-v2.html](https://cycle-ur.github.io/-/user-system-v2.html) | 邀請朋友，協作搶票 |
| 🎫 完整演示 | [https://cycle-ur.github.io/-/demo-v0.8.html](https://cycle-ur.github.io/-/demo-v0.8.html) | 所有功能演示 |
| 🔧 後台管理 | [https://cycle-ur.github.io/-/admin-v0.8.html](https://cycle-ur.github.io/-/admin-v0.8.html) | 管理員後台 |

> **提示：** 協作系統可以點擊「快速登入: Alice」或「快速登入: Bob」立即體驗！

## 核心功能

- 🤖 **自動搶票**：設置時間和目標，機器人自動執行購票
- 👥 **協作功能**：邀請朋友，共享任務，提高成功率
- 🔄 **多設備同步**：使用 GUN.js 實現跨設備數據同步
- 🔒 **隱私優先**：完全本地化，無需後端伺服器
- ⚡ **即時通知**：搶票狀態實時推送通知
- 📊 **統計分析**：成功率、任務統計、數據導出

## 快速開始

### 💻 在線使用
訪問 [https://cycle-ur.github.io/-/](https://cycle-ur.github.io/-/) 立即開始使用。

### 📥 本地開發
克隆倉庫到本地進行開發：

### 本地開發

#### 安裝依賴
```bash
npm install
```

#### 啟動開發伺服器
```bash
npm run dev
```

#### 運行測試
```bash
npm run test
```

#### 測試監視模式
```bash
npm run test:watch
```

## 📚 項目文檔

### 用戶文檔
- **[PUBLIC_ACCESS_GUIDE.md](./PUBLIC_ACCESS_GUIDE.md)** - 如何讓他人使用（部署指南）⭐ 新增
- **[QUICK_START.md](./QUICK_START.md)** - 5 分鐘快速上手
- **[USAGE_GUIDE.md](./USAGE_GUIDE.md)** - 詳細使用教程
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - 快速參考卡
- **[COLLABORATION_SYSTEM.md](./COLLABORATION_SYSTEM.md)** - 協作功能說明

### 開發者文檔
- **[PRD.md](./PRD.md)** - 完整的產品需求文檔，包含功能定義和技術架構
- **[AGENTS.md](./AGENTS.md)** - 項目進度記錄，供後續開發者快速上手
- **[FRONTEND_VS_BACKEND.md](./FRONTEND_VS_BACKEND.md)** - 前後台功能對比

### 部署文檔
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 詳細部署說明
- **[SHARE_GUIDE.md](./SHARE_GUIDE.md)** - 分享給朋友的指南

## 技術棧

| 層級 | 技術 | 備註 |
|------|------|------|
| 前端框架 | Vue 3 (CDN) | 輕量、易部署 |
| 樣式 | Tailwind CSS (CDN) | 響應式設計 |
| 數據庫 | GUN.js (CDN) | 去中心化、P2P 同步 |
| 測試 | Vitest | 快速、零配置 |

## 項目結構

```
.
├── index.html              # 主應用入口
├── css/
│   └── styles.css         # 自定義樣式
├── js/
│   ├── app.js            # Vue 3 應用主邏輯
│   ├── bot-engine.js     # 搶票引擎
│   ├── storage.js        # GUN.js 數據管理
│   ├── notifications.js  # 通知系統
│   └── utils.js          # 工具函數
├── tests/
│   ├── bot-engine.test.js
│   ├── storage.test.js
│   └── utils.test.js
├── PRD.md                 # 產品需求文檔
├── AGENTS.md             # 項目進度記錄
└── README.md             # 本文件
```

## 開發規範

### TDD 流程
1. 編寫失敗的單元測試
2. 編寫最少代碼使測試通過
3. 重構代碼提高質量

### 提交規範
```
<type>(<scope>): <subject>

feat: 新功能
fix: 修復
test: 測試相關
docs: 文檔更新
```

## 已知限制

- 無後端伺服器，所有邏輯在客戶端執行
- 依賴 CDN 可用性
- 支持現代瀏覽器（Chrome 90+, Firefox 88+）

## 貢獻指南

1. 查看 PRD.md 和 AGENTS.md 了解項目
2. 從 TODO 列表選擇待完成工作
3. 遵循 TDD 方式開發
4. 編寫清晰的 Git 提交信息

## 常見問題

### Q: 為什麼使用 CDN 而不是本地打包？
A: CDN 方式簡化部署流程，用戶可直接打開 HTML 文件使用，無需構建步驟。

### Q: GUN.js 是什麼？
A: GUN.js 是一個去中心化的實時數據庫，支持 P2P 網絡和多設備數據同步。

### Q: 這個應用安全嗎？
A: 應用完全運行在客戶端，不存儲用戶真實支付信息，隱私有保障。

## 聯絡方式

如有問題或建議，請開 Issue 或 PR。

---

**開發方式**：TDD（測試驅動開發）  
**最後更新**：2025-12-10