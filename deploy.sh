#!/bin/bash

# 智能搶票助手 - 快速部署腳本
# 此腳本會自動提交代碼並推送到 GitHub

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          智能搶票助手 - 快速部署到 GitHub Pages               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 檢查是否在正確的目錄
if [ ! -f "index.html" ]; then
    echo "❌ 錯誤：請在項目根目錄執行此腳本"
    exit 1
fi

echo "📋 步驟 1/3: 添加所有文件到 Git..."
git add -A
echo "✅ 完成"
echo ""

echo "📋 步驟 2/3: 提交更改..."
git commit -m "🚀 Deploy: Enable public access with collaboration features

- Add GitHub Actions workflow for automatic deployment
- Create new landing page (index.html)
- Add deployment documentation
- Add sharing guide
- Ready for public access via GitHub Pages
"
echo "✅ 完成"
echo ""

echo "📋 步驟 3/3: 推送到 GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                    🎉 部署成功！                               ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "下一步："
    echo ""
    echo "1️⃣  啟用 GitHub Pages："
    echo "   訪問：https://github.com/CYCLE-UR/-/settings/pages"
    echo "   將 Source 設置為：GitHub Actions"
    echo ""
    echo "2️⃣  查看部署狀態："
    echo "   https://github.com/CYCLE-UR/-/actions"
    echo ""
    echo "3️⃣  部署完成後，分享這些網址："
    echo ""
    echo "   👥 協作系統："
    echo "   https://cycle-ur.github.io/-/user-system-v2.html"
    echo ""
    echo "   🎫 完整演示："
    echo "   https://cycle-ur.github.io/-/demo-v0.8.html"
    echo ""
    echo "   🔧 後台管理："
    echo "   https://cycle-ur.github.io/-/admin-v0.8.html"
    echo ""
    echo "📖 詳細指南：查看 HOW_TO_SHARE.md 或 PUBLIC_ACCESS_GUIDE.md"
    echo ""
    echo ""
    echo "3️⃣  部署完成後訪問："
    echo "   https://cycle-ur.github.io/-/"
    echo ""
    echo "4️⃣  分享給朋友："
    echo "   https://cycle-ur.github.io/-/user-system-v2.html"
    echo ""
else
    echo ""
    echo "❌ 推送失敗！請檢查："
    echo "  • 是否已配置 Git 遠程倉庫"
    echo "  • 是否有推送權限"
    echo "  • 網絡連接是否正常"
    echo ""
    echo "手動推送："
    echo "  git push origin main"
fi
