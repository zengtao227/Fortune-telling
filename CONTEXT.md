# Fortune-telling Context

## 项目定位

这是一个中西合璧的治愈系算命应用，定位为跨平台原生 App，结合中式黄历、周易 64 卦和西式占星。

项目使用 Expo / React Native 实现，支持 Web、Android、iOS，并通过 Electron 打包 macOS。

## 关键结构

- `App.js`: 应用主入口和主要界面。
- `src/logic/`: 占星、历法、易经逻辑。
- `src/theme`: 主题配置。
- `src/utils/contentResolver`: 文案解析。
- `Project_F_Plan_v1.md`: 产品与技术规划。
- `package.json`: Expo、Electron、构建命令和依赖。
- `assets/`: 图标和视觉资源。
- `electron/`: 桌面端包装。

## 工作规则

- 黄历功能优先使用 `lunar-javascript`，不要手写农历和宜忌算法。
- 天文计算优先使用 `astronomy-engine`，不要用简化日期表替代精确计算。
- UI 文案属于“情绪按摩”产品语气，避免恐吓式或绝对化预测。
- 涉及日期、节气、星座边界时要用测试基准日期验证。

## 常用命令

```bash
npm install
npm run start
npm run web
npm run build
npm run build:macos
npm run build:android
npm run lint
npm run test
```

## 验证要求

- JS/React Native 修改后运行 `npm run lint` 或相关测试。
- Web/UI 修改后打开页面确认渲染。
- 历法或天文逻辑修改后，用规划文档中的基准日期做回归验证。
