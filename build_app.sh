#!/bin/bash
set -e

echo "🚀 开始自动化打包流程 (Android APK & iOS IPA)..."
echo "📋 说明: 此过程将使用 Expo EAS 云构建服务。"
echo "⚠️  前置要求:"
echo "   1. 需要一个 Expo 账号 (免费注册: https://expo.dev)"
echo "   2. iOS 打包必须拥有 Apple Developer Account ($99/年)。如果没有，只能生成 Android 包。"

echo ""
echo "正在检查环境..."

# 确保目录存在
mkdir -p dist


echo "------------------------------------------------"
echo "🛠️  选项：选择构建方式"
echo "1. Android APK (推荐使用云构建)"
echo "2. iOS IPA (云构建，需要付费开发者账号)"
echo "3. 生成本地 Xcode 项目 (推荐！利用你的本地 Xcode 免费真机调试)"
echo "4. 启动网页版预览 (本地浏览器体验)"
echo ""
read -p "请输入选项数字 (1/2/3/4): " build_option

if [ "$build_option" = "1" ]; then
    echo "🤖 正在启动 Android 云构建..."
    npx eas-cli build --profile preview --platform android
elif [ "$build_option" = "2" ]; then
    echo "🍎 正在启动 iOS 云构建..."
    npx eas-cli build --profile preview --platform ios
elif [ "$build_option" = "3" ]; then
    echo "💻 正在生成原生 iOS 项目..."
    npx expo prebuild --platform ios
    echo ""
    echo "✅ 生成完成！"
    echo "请执行以下步骤在 iPhone 上运行："
    echo "1. 运行: xed ios"
    echo "2. 在 Xcode 中，点击左侧项目根目录 'FortuneTelling'。"
    echo "3. 选择 'Signing & Capabilities' 选项卡。"
    echo "4. 在 'Team' 下拉菜单中添加/选择你的 Apple ID。"
    echo "5. 连接 iPhone，在顶部设备栏选择它，点击 'Run' (播放按钮)。"
elif [ "$build_option" = "4" ]; then
    echo "🌍 正在启动网页预览..."
    npx expo start --web
else
    echo "无效选项。"
fi

echo ""
echo "✅ 流程结束。"

