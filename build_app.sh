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

# Android Build
echo "------------------------------------------------"
echo "🤖 步骤 1/2: 构建 Android APK"
echo "系统将引导你登录 Expo 账号（如果未登录）。"
echo "构建完成后，你会获得一个下载链接。"
# 使用 interactive 模式运行
npx eas-cli build --profile preview --platform android

echo ""
echo "------------------------------------------------"
echo "🍎 步骤 2/2: 构建 iOS IPA"
echo "如果你没有 Apple Developer 账号，请在此步按 Ctrl+C 终止，或者选择不继续。"
read -p "是否继续尝试构建 iOS 版本? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    npx eas-cli build --profile preview --platform ios
else
    echo "已跳过 iOS 构建。"
fi

echo ""
echo "✅ 流程结束。"
