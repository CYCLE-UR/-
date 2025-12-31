# ⚡ 快速部署 - 60 秒讓他人使用

## 🎯 只需 3 個命令

```bash
# 1. 執行部署腳本
bash deploy.sh

# 2. 啟用 GitHub Pages（首次需要）
# 訪問：https://github.com/CYCLE-UR/-/settings/pages
# 選擇 Source: GitHub Actions

# 3. 完成！分享網址給朋友
```

---

## 🌐 公開網址

部署完成後（約 2 分鐘），分享這些網址：

### 給普通用戶

**協作版（推薦）：**
```
https://cycle-ur.github.io/-/user-system-v2.html
```
*可以邀請朋友，一起協作搶票*

**演示版：**
```
https://cycle-ur.github.io/-/demo-v0.8.html
```
*快速體驗所有功能*

### 給管理員

**後台管理：**
```
https://cycle-ur.github.io/-/admin-v0.8.html
```
*密碼：admin / admin123*

---

## 📱 分享訊息（複製即用）

```
🎫 智能搶票助手 - 免費使用！

馬上試用：
https://cycle-ur.github.io/-/user-system-v2.html

功能：
✅ 自動搶票
✅ 邀請朋友
✅ 任務管理
✅ 實時通知

完全免費 | 無需安裝 🎵
```

---

## ✅ 部署檢查

### 第一次部署？

- [ ] 執行 `bash deploy.sh`
- [ ] 訪問 [GitHub Pages 設置](https://github.com/CYCLE-UR/-/settings/pages)
- [ ] 選擇 Source: **GitHub Actions**
- [ ] 等待 [部署完成](https://github.com/CYCLE-UR/-/actions)（約 2 分鐘）
- [ ] 測試網址能否訪問
- [ ] 分享給朋友！

### 後續更新？

只需執行：
```bash
bash deploy.sh
```

GitHub Actions 會自動重新部署！

---

## 🔧 故障排除

### 網址無法訪問？
1. 確認 GitHub Pages 已啟用
2. 檢查 Actions 是否完成（綠色勾選）
3. 等待 2-5 分鐘讓 DNS 生效

### 部署失敗？
1. 檢查 [Actions 日誌](https://github.com/CYCLE-UR/-/actions)
2. 確認 `.github/workflows/deploy.yml` 存在
3. 重新執行 `bash deploy.sh`

---

## 📚 更多資源

- 📖 [完整部署指南](./PUBLIC_ACCESS_GUIDE.md)
- 📝 [分享技巧](./HOW_TO_SHARE.md)
- 💡 [使用教程](./USAGE_GUIDE.md)
- 🔧 [部署文檔](./DEPLOYMENT.md)

---

**準備好了嗎？執行 `bash deploy.sh` 開始！** 🚀
