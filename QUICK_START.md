# 項目快速參考

## 快速開始

### 1. 查看文檔
```bash
# 了解完整需求
cat PRD.md

# 了解項目進度和技術決策
cat AGENTS.md

# 查看使用說明
cat README.md
```

### 2. 安裝依賴
```bash
npm install
```

### 3. 運行測試
```bash
# 運行一次
npm test

# 監視模式（開發時使用）
npm run test:watch

# 測試覆蓋率
npm run test:coverage
```

### 4. 打開應用
直接在瀏覽器中打開 `index.html` 文件

## 項目狀態

✅ **第一階段完成（核心基礎）**
- 項目結構：完成
- 測試框架：完成（37/37 通過）
- 工具函數：完成（11 個）
- GUN.js 集成：完成
- Vue 應用框架：完成

## 當前進度

### 已完成模塊（37 個測試）
1. **utils.js** - 工具函數集合
   - formatDate - 日期格式化
   - delay - 延遲函數
   - isValidEmail - 郵件驗證
   - isValidUrl - URL 驗證
   - deepClone - 深複製
   - generateId - ID 生成
   - getNestedValue - 嵌套值獲取
   - setNestedValue - 嵌套值設置
   - debounce - 防抖
   - throttle - 節流

2. **storage.js** - GUN.js 數據層
   - initGUN - 初始化
   - loginAnonymous - 匿名登錄
   - logout - 登出
   - getCurrentUser - 獲取用戶
   - isLoggedIn - 登錄檢查
   - createData - 創建數據
   - readData - 讀取數據
   - updateData - 更新數據
   - deleteData - 刪除數據
   - listData - 列表數據
   - watchData - 監聽變化

3. **app.js** - Vue 3 主應用
   - 登錄/登出功能
   - 錯誤/成功提示
   - 響應式 UI

## 下一步計劃

### 第二階段：搶票任務管理
1. 設計任務數據模型
2. 實現任務 CRUD 操作
3. 實現搶票配置 UI
4. 編寫任務管理測試

### 第三階段：自動搶票引擎
1. 實現定時執行機制
2. 實現自動點擊邏輯
3. 實現重試機制
4. 編寫引擎測試

### 第四階段：優化和發布
1. 實現歷史記錄功能
2. 實現通知系統
3. 性能優化
4. 文檔完善

## 技術細節

### CDN 資源
- **Vue 3**: https://unpkg.com/vue@3/dist/vue.global.js
- **Tailwind CSS**: https://cdn.tailwindcss.com
- **GUN.js**: https://cdn.jsdelivr.net/npm/gun@0.2020.x/gun.js

### 本地開發工具
```json
{
  "vitest": "^1.0.0",
  "@testing-library/dom": "^9.3.3",
  "@testing-library/user-event": "^14.5.1",
  "jsdom": "latest"
}
```

### 文件清單
```
.
├── index.html              # 主入口（全 CDN 模式）
├── css/styles.css         # 自定義樣式
├── js/
│   ├── app.js            # Vue 主應用
│   ├── storage.js        # GUN.js 數據層
│   ├── utils.js          # 工具函數
│   ├── bot-engine.js     # [待開發] 搶票引擎
│   └── notifications.js  # [待開發] 通知系統
├── tests/
│   ├── utils.test.js     # 工具函數測試
│   ├── storage.test.js   # 數據層測試
│   └── bot-engine.test.js # [待開發] 引擎測試
├── PRD.md                 # 產品需求文檔
├── AGENTS.md             # 項目進度記錄
├── README.md             # 使用說明
├── package.json          # NPM 配置
├── vitest.config.js      # 測試配置
└── .gitignore            # Git 忽略文件
```

## 如何貢獻

1. **閱讀文檔**：先讀 PRD.md 和 AGENTS.md
2. **查看進度**：了解當前完成的功能
3. **選擇任務**：從 TODO 列表選擇待完成工作
4. **TDD 開發**：先寫測試，後寫代碼
5. **提交代碼**：遵循 Git 提交規範

## 常見命令

```bash
# 開發環境
npm run test:watch       # 監視測試模式
npm run test            # 運行所有測試
npm run test:coverage   # 生成覆蓋率報告

# 查看文件
cat PRD.md              # 產品需求文檔
cat AGENTS.md          # 項目進度
cat README.md          # 使用說明

# 項目信息
npm list               # 查看依賴
git log --oneline      # 查看提交歷史
```

## 聯絡方式

需要幫助？查看項目文檔或提 Issue。

---

**更新時間**：2025-12-10  
**版本**：0.2  
**開發方式**：TDD（測試驅動開發）
