# 🚀 如何讓他人使用 - 3 步驟

## ✅ 第 1 步：執行部署（2 分鐘）

在終端機執行：

```bash
bash deploy.sh
```

或手動執行：

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

---

## ✅ 第 2 步：啟用 GitHub Pages（1 分鐘）

1. **訪問設置頁面：**
   ```
   https://github.com/CYCLE-UR/-/settings/pages
   ```

2. **配置 Source：**
   - 找到「Build and deployment」區域
   - 在「Source」下拉選單選擇：**GitHub Actions**
   - 系統會自動儲存

3. **等待部署：**
   - 訪問：https://github.com/CYCLE-UR/-/actions
   - 等待綠色勾選標記 ✅（約 1-2 分鐘）

---

## ✅ 第 3 步：分享連結

**部署完成後，分享這些網址給朋友：**

### 📱 給普通用戶（推薦）

**協作版（可邀請朋友）：**
```
https://cycle-ur.github.io/-/user-system-v2.html
```

**演示版（快速體驗）：**
```
https://cycle-ur.github.io/-/demo-v0.8.html
```

### 🔧 給管理員

**後台管理系統：**
```
https://cycle-ur.github.io/-/admin-v0.8.html
```
（默認密碼：admin / admin123）

---

## 📝 分享訊息模板

複製這段發送給朋友：

```
🎫 智能搶票助手 - 演唱會搶票神器！

✅ 自動搶票
✅ 邀請朋友協作
✅ 任務管理
✅ 實時通知

馬上試用：
https://cycle-ur.github.io/-/user-system-v2.html

完全免費 | 無需安裝 | 立即使用
```

---

## 🎯 不同場景的分享方式

### 場景 1：分享給追星族
```
嗨！我做了一個搶票工具，下次演唱會一起用！

可以設定時間自動搶票，還能邀請朋友一起提高成功率

試試看：https://cycle-ur.github.io/-/user-system-v2.html
```

### 場景 2：分享給技術朋友
```
看我做的純前端搶票系統！

技術棧：Vue 3 + GUN.js + TDD
特色：去中心化、協作功能、性能優化

Demo: https://cycle-ur.github.io/-/demo-v0.8.html
代碼: https://github.com/CYCLE-UR/-
```

### 場景 3：團隊內部使用
```
團隊通知：搶票系統已部署！

用戶端：https://cycle-ur.github.io/-/user-system-v2.html
後台：https://cycle-ur.github.io/-/admin-v0.8.html
文檔：https://cycle-ur.github.io/-/USAGE_GUIDE.md

請大家測試並回報問題
```

---

## 📊 進階：追蹤使用情況（可選）

如果想知道多少人在用，可以加入 Google Analytics：

1. 獲取 GA 追蹤 ID
2. 在 `index.html` 添加追蹤代碼
3. 重新部署

詳見：[PUBLIC_ACCESS_GUIDE.md](./PUBLIC_ACCESS_GUIDE.md#使用統計)

---

## ❓ 常見問題

### Q：部署需要花錢嗎？
**A：** 不需要！GitHub Pages 完全免費。

### Q：別人使用會影響我的數據嗎？
**A：** 不會。每個用戶的數據都是獨立的，存在各自的瀏覽器裡。

### Q：可以改密碼嗎？
**A：** 可以！修改 `admin-v0.8.html` 中的密碼設定，重新部署即可。

### Q：手機能用嗎？
**A：** 可以！完全支持手機、平板、電腦。

---

## 🎉 完成！

現在你的應用已經可以被全世界訪問了！

**測試一下：**
1. 在手機開啟你分享的網址
2. 創建一個測試任務
3. 邀請朋友試用

**需要更多幫助？**
- 📖 詳細部署指南：[PUBLIC_ACCESS_GUIDE.md](./PUBLIC_ACCESS_GUIDE.md)
- 📚 使用教程：[USAGE_GUIDE.md](./USAGE_GUIDE.md)
- 💬 問題反饋：[GitHub Issues](https://github.com/CYCLE-UR/-/issues)

---

**祝搶票順利！** 🎊
