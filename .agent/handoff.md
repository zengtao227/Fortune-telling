# Handoff

## Completed

- main 分支（commit `abf0136`）：7 项无障碍/健壮性修复已合并推送，18 个测试。
- GitLab fdroiddata 探路 Draft MR `!44809`：`Disabled:` 字段确认会跳过真实 build/scanner，已在 MR 留言澄清；不再继续推进，等主线稳定后再更新。
- GitHub PR #2（`agent/fdroid-readiness`，Codex 提交）：已标记 DO NOT MERGE，不再修补，只作为"改动素材库"移植真正有价值的部分。
- 新分支 `integration/fdroid`（从 main 切出）已完成 Phase 1 的逻辑层合并：
  - 新增 `src/logic/locations.js`（16 城市 IANA 时区表，合并了 main 原有但 PR2 遗漏的杭州/南京/武汉/西安/重庆）
  - 新增 `src/logic/inputValidation.js`（日期/时间格式校验，去掉了 PR2 里"没地点就拒绝"的那条规则）
  - `src/logic/astrology.js`：采用 PR2 的 IANA 时区精确换算（`localDateTimeToUtc`），但地点未识别时不 throw——回退到上海坐标+上海时区并标记 `locationEstimated`；出生时刻落在夏令时春季跳空缺口时顺延1小时重算并标记 `timeEstimated`，不再报错
  - `src/logic/calendar.js`：只替换了吉时筛选谓词（`getTianShenLuck()==='吉'` 取代"该时辰随便有宜事就算吉"），其余 19 个字段原样保留，未采用 PR2 的精简版整文件替换
  - `App.js`：提交前用 `parseDateParts`/`parseTimeParts` 做真正的格式校验（原来只检查长度）；`getBigThree` 调用点包了 try/catch 防止 `isCalculating` 卡死；结果页新增 `timeEstimated` 提示文案，`locationEstimated` 文案改为同时提示坐标和时区都是估算的
  - 测试：`astrology.test.js` 新增 5 个用例覆盖 DST 跳空场景，共 23 个测试全绿

## Current State

- 分支：`integration/fdroid`（已推送 origin，跟踪 origin/main，尚未合并回 main）
- 本次改动**完全没有升级 Expo 版本**，仍在 SDK 50 上，逻辑层改动与 Expo 版本无关
- `npm test` 23/23 通过；`npm run lint` 0 errors（有大量 prettier 格式warning，均为改动前已存在的代码风格债，未新增新文件外的错误）

## Next Steps

1. **Expo 50→57 升级需要独立验证，不在这次改动范围内**：先在一个抛弃式分支跑 `npx expo install expo@57 --fix` + `npx expo-doctor`，重点看 `expo-font`/`@expo-google-fonts/*` 是否兼容 SDK 57（Codex 之前在删了字体的精简版上跑这个升级都没能跑绿）。同时要向用户确认 F-Droid 是否真的要求 SDK 57——`compileSdk 36`/API 36 是 Google Play 的政策要求，不是 F-Droid 的强制要求，这个前提从未被单独验证过。
2. 吉神/九星等7个字段（`jiShen`/`xiongSha`/`zheng`/`taiShen`/`pengZu`/`jieQi`/`jiuXing`）数据层已保留（沿用 main 完整版 calendar.js），但本次**没有**新增 UI 展示——留作独立的产品功能迭代，不混进这次 F-Droid 相关改动。
3. Phase 2（未开始）：AsyncStorage hydration race 修复、依赖许可证审计。
4. Phase 3（未开始）：`package-lock.json` + `npm ci` 可复现构建、fdroiddata metadata 指向新 commit 并移除 `Disabled:`。
5. PR #2 处置：倾向于关闭不合并（GPT 建议，我认同），但用户尚未最终拍板。

## Key Decisions

- 地点未识别时走"宽容估算+双重提示"，不采用 PR2 的"直接拒绝"（用户 2026-08-04 确认）。
- macOS/Electron 打包链路本次不用管（用户 2026-08-04 确认，因为发布目标是 F-Droid/Android）。
- 不整文件替换 astrology.js/calendar.js，而是精确移植（谓词替换/新增文件），避免像 PR2 那样在"F-Droid 适配"名义下带出未披露的产品回归。
