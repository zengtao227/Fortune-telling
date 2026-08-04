# Handoff

## Completed

- main 分支（commit `abf0136`）：7 项无障碍/健壮性修复已合并推送，18 个测试。
- GitLab fdroiddata 探路 Draft MR `!44809`：`Disabled:` 字段确认会跳过真实 build/scanner，已在 MR 留言澄清；不再继续推进，等主线稳定后再更新。
- GitHub PR #2（`agent/fdroid-readiness`，Codex 提交）：已标记 DO NOT MERGE，不再修补，只作为"改动素材库"移植真正有价值的部分。
- 新分支 `integration/fdroid`（从 main 切出）已完成 Phase 1 的逻辑层合并，并经过两轮 GPT 交叉审查修正：
  - 新增 `src/logic/locations.js`（**21** 个地点条目，合并了 main 原有但 PR2 遗漏的杭州/南京/武汉/西安/重庆）
  - 新增 `src/logic/inputValidation.js`（日期/时间格式校验 + `validateAstrologyInput` 单一校验入口，去掉了 PR2 里"没地点就拒绝"的那条规则）
  - `src/logic/astrology.js`：`localDateTimeToUtc` 改为解析式的 0/1/2 候选检测（不再用 try/catch 猜测夏令时问题）——0个候选=春季跳空(按实际切换幅度顺延，不假设固定1小时)并标记 `timeEstimated`；2个候选=秋季回拨歧义，取较早一次并标记 `timeAmbiguous`；地点未识别时不 throw，回退上海坐标+时区并标记 `locationEstimated`，同时用 `locationProvided` 区分"压根没填"和"填了但认不出"
  - `src/logic/locations.js` 的 `resolveLocation`：CJK 别名保留子串匹配（兼容"北京市朝阳区"），拉丁字母别名改用单词边界匹配，修复了"Xianyang"误配"Xian"这类子串误匹配。**未解决**的是同名不同地的歧义（"Paris, Texas" 撞上法国 Paris）——这是简单名称匹配的固有局限，強行用规则去堵会连带堵死 App 自己"Shanghai, China"占位符范式的输入，真正解决需要地区消歧或城市选择器 UI，本次不做
  - `src/logic/calendar.js`：只替换了吉时筛选谓词（`getTianShenLuck()==='吉'` 取代"该时辰随便有宜事就算吉"），其余 19 个字段原样保留，未采用 PR2 的精简版整文件替换
  - `App.js`：改用 `validateAstrologyInput` 作为唯一校验入口（原来 `parseDateParts`/`parseTimeParts` 分开调用，两套逻辑要手动保持一致）；`getBigThree` 调用点用 `try/catch/finally`，`setIsCalculating(false)` 统一放进 `finally`，防止后续文案解析抛错也会卡在"计算中"状态；结果页新增 `timeEstimated`/`timeAmbiguous` 两条独立提示文案，`locationEstimated` 文案按 `locationProvided` 区分"未填写"和"未识别"
  - 测试：34 个测试全绿，含 DST 春季跳空/秋季回拨歧义的精确 UTC 断言（不只是 `not.toBeNull()`）、`resolveLocation` 误匹配回归用例、`calendar.js` 19字段契约测试

## Current State

- 分支：`integration/fdroid`（已推送 origin，跟踪 origin/main，尚未合并回 main）
- 本次改动**完全没有升级 Expo 版本**，仍在 SDK 50 上，逻辑层改动与 Expo 版本无关
- `npm test` 34/34 通过；`npm run lint` 0 errors（有大量 prettier 格式 warning，均为改动前已存在的代码风格债，未新增新文件外的错误）

## Next Steps

1. **Expo 50→57 升级需要独立验证，不在这次改动范围内**：先在一个抛弃式分支跑 `npx expo install expo@57 --fix` + `npx expo-doctor`，重点看 `expo-font`/`@expo-google-fonts/*` 是否兼容 SDK 57（Codex 之前在删了字体的精简版上跑这个升级都没能跑绿）。F-Droid 官方 Inclusion Policy 并未强制要求 SDK/API 版本，`compileSdk 36`/API 36 是 Google Play 的政策要求——这个前提已通过官方文档确认（GPT review 引用同一结论）。
2. 吉神/九星等7个字段（`jiShen`/`xiongSha`/`zheng`/`taiShen`/`pengZu`/`jieQi`/`jiuXing`）数据层已保留（沿用 main 完整版 calendar.js），但本次**没有**新增 UI 展示——留作独立的产品功能迭代，不混进这次 F-Droid 相关改动。
3. Phase 2（未开始）：AsyncStorage hydration race 修复。
4. Phase 3（未开始，且是两件独立的事，不能只做一件就算数）：
   - **安全审计**：GitHub 推送时提示 main 分支有 122 个 Dependabot 警告（3 critical/68 high/42 moderate/9 low）——检查是否有已知 CVE 影响 production Android 构建。
   - **许可证审计**：完整传递依赖树是否都允许分发、是否符合 F-Droid 收录政策；`package-lock.json` + `npm ci` 可复现构建；fdroiddata metadata 指向新 commit 并移除 `Disabled:`。
5. PR #2 处置：倾向于关闭不合并（GPT 建议，我认同），但用户尚未最终拍板。

## Key Decisions

- 地点未识别时走"宽容估算+双重提示"，不采用 PR2 的"直接拒绝"（用户 2026-08-04 确认）。GPT 在两轮审查中都建议改回拒绝式/降级为只算太阳星座，我们没有采纳——这是已经跟用户确认过的产品决定，不因审查意见反复横跳。
- macOS/Electron 打包链路本次不用管（用户 2026-08-04 确认，因为发布目标是 F-Droid/Android）。
- 不整文件替换 astrology.js/calendar.js，而是精确移植（谓词替换/新增文件），避免像 PR2 那样在"F-Droid 适配"名义下带出未披露的产品回归。
- `.agent/handoff.md` 和项目根 `CONTEXT.md` 是用户自己全局 CLAUDE.md 明确要求的产物（长任务规范/工作流程第1步），不是意外混入逻辑修复提交——这两个文件在独立的 docs commit (`8178ef4`) 里，没有和逻辑改动混在一起。GPT 审查建议不要把它们合并进主分支，这条建议和这个仓库使用者的既定工作习惯冲突，予以保留。
