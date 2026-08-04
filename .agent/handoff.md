# Handoff

最后更新：2026-08-04（会话结束前的存档，供几天后直接接着做）

## 三条分支的当前状态

| 分支 | 最新 commit | 状态 |
|---|---|---|
| `main` | `0cf1213` | 生产分支，Expo SDK 50。含 7 项无障碍修复(`abf0136`) + vercel.json 修复。 |
| `integration/fdroid` | `acc4c53` | F-Droid 逻辑层修复，Expo 仍是 SDK 50。**未合并回 main**。 |
| `probe/expo57` | `55b53ba` | 从 `integration/fdroid@ff5592c` 切出的抛弃式探测分支，已推送 GitHub。**不是待合并分支，只是证据**，见下方"Expo 57 探测结论"。 |

三条分支的 `vercel.json` 都已修复（删除失效的 `"public": true` 字段，这是本会话里持续收到"Failed preview deployment"邮件的真正根因，跟代码改动无关）。main 分支这次推送后已确认从"瞬间schema-fail"变成能进入`BUILDING`状态——**注意**：`BUILDING`只证明schema错误消失，不代表最终部署一定成功，回来时如果又收到失败邮件，先查最终 deployment 状态而不是假设这个修复还有效。

## `integration/fdroid` 做了什么（Phase 1，已完成且经过三轮 GPT 交叉审查）

从 PR #2（`agent/fdroid-readiness`，Codex 提交，已标记 DO NOT MERGE，当"素材库"用，不再修补）里选择性移植了真正有价值的逻辑层改进，**没有整文件替换**，避免带出未披露的产品回归：

- `src/logic/locations.js`（新增，21个地点，合并了 main 和 PR2 各自独有的城市）+ `src/logic/inputValidation.js`（新增，日期/时间格式校验 + `validateAstrologyInput` 单一入口）
- `src/logic/astrology.js`：`localDateTimeToUtc` 用解析式的 0/1/2 候选检测处理夏令时（不用 try/catch 猜）——0个候选=春季跳空，按实际切换幅度顺延并标记 `timeEstimated`；2个候选=秋季回拨歧义，取较早一次并标记 `timeAmbiguous`；地点未识别时不 throw，回退上海坐标+时区并标记 `locationEstimated`，`locationProvided` 区分"没填"和"填了但认不出"
- `src/logic/locations.js` 的 `resolveLocation`：CJK别名保留子串匹配(兼容"北京市朝阳区")，拉丁字母别名改用单词边界匹配(修复"Xianyang"误配"Xian")。**明确未解决**："Paris,Texas"撞法国Paris这类同名不同地歧义是字符串匹配的固有局限，强行堵会破坏App自己"Shanghai, China"占位符范式的输入，需要地区消歧或城市选择器UI才能真正解决，本次不做
- `src/logic/calendar.js`：只换了吉时筛选谓词(`getTianShenLuck()==='吉'`)，其余19个字段(含吉神九星等7个从未上过UI的字段)原样保留
- `App.js`：`validateAstrologyInput`单一校验入口；`getBigThree`调用点`try/catch/finally`防止卡在"计算中"状态；结果页区分`timeEstimated`/`timeAmbiguous`/`locationEstimated`+`locationProvided`四种独立提示
- 34个测试全绿，含DST精确UTC断言(不是`not.toBeNull()`)、`resolveLocation`误匹配回归用例、`calendar.js`19字段契约测试

## Expo 57 探测结论（`probe/expo57`，已被我独立验证+GPT二次审查，双方结论一致：技术可行）

**探测本身可信**：我没有照单全收agent的报告，抽查验证了——`App.js`/`src/`全程零改动(`git diff --stat`确认)、34测试在HEAD上重新跑过真的全过、APK真实存在、SDK54报错原始日志文本核对无误。GPT独立审查后同样确认"关键断言与远端分支内容一致"。

**结论**：50→57逐级升级到顶，4处真实版本冲突全部有据可查（`lucide-react-native`不支持React19升级到1.28、SDK54/55的jest因react-native自带mock文件用了babel解析不了的Flow语法而真的跑不过、SDK56这个问题被上游自己修好+另外app.json的splash字段要迁移成`expo-splash-screen`插件、SDK57需要新增`@react-native/jest-preset`peer依赖）。字体/卦象/两套加载动画全程没被碰过代码。APK包名/版本号不变，权限列表干净，依赖树里没有新增埋点/统计类包。

**明确暴露、没有解决的缺口**：
1. **Android/Hermes运行时的ICU时区数据完整性完全没验证**——所有DST测试都是Node/Jest环境跑的，这是当前最大的悬而未决风险，直接关系到这次时区精确计算逻辑在真机上到底准不准。
2. 测试套件缺一个"苏黎世春季跳空"的用例（现在用纽约跳空顶替，同类问题但不是那个具体场景）。
3. F-Droid相关问题（依赖树许可证合规、可复现构建）这次完全没碰。

## 下一步：GPT 给的采用前必做清单（我认可这个顺序，尚未开始执行）

**不要直接合并 `probe/expo57`**——它是证据分支，包含11次梯级提交和大量原始日志，不适合作为产品分支合并。正确做法：

1. 从最新 `integration/fdroid`（当前 `acc4c53`）新建 `upgrade/expo57` 分支，只重放最终必要的改动：`package.json`、`package-lock.json`、`app.json`。`.eslintrc.js`的`root:true`要先判断正常(非worktree嵌套)checkout是否还需要——探测报告里明确写了这是"worktree嵌套导致的环境问题，正常checkout不会遇到"，很可能不需要带过去。`vercel.json`已经在`integration/fdroid`修过，不用从probe再移植。
2. `"expo": "57"` 改成标准的`"~57.0.10"`范围写法，跟其他Expo包保持风格一致，改完重跑`expo install --fix` + `npm ci` + `expo-doctor`。
3. **重新评估两个未使用的生产依赖**：`lucide-react-native`和`react-native-svg`代码里都零引用（已用grep确认），探测阶段按规则没删，但正式升级时应该单独决定要不要删——删除本身要开一个独立、透明的cleanup commit，不能夹在Expo升级里一起做。
4. `eslint`/`eslint-config-universe`/`jest`/`jest-expo`/`react-test-renderer`目前在`dependencies`里而不是`devDependencies`（**已核实为真**，不是GPT说错），正式整理时应该挪过去，挪完要重新生成lockfile，并且**先测试**`npm ci --omit=dev`能否正常完成Expo prebuild和Gradle构建再决定要不要真的这样发布（F-Droid构建阶段是否需要devDependencies取决于metadata的安装方式，不能想当然）。
5. **补一条"苏黎世春季跳空"的jest测试**（`Europe/Zurich 2024-03-31 02:30`附近，具体跳空日期需要用代码里的`localDateTimeToUtc`或`Intl.DateTimeFormat`现查，不要凭记忆硬编码日期），成本很低。
6. **Android/Hermes真机时区验证要作为这次正式升级的阻塞项，不能再跳过**：至少验证`Asia/Shanghai`正常时间、`Europe/Zurich`春季跳空、`Europe/Zurich`秋季回拨、`America/New_York`秋季回拨这四个场景在真机/模拟器上`Intl.DateTimeFormat`是否给出跟Node/Jest一致的结果。目前App里没有任何调试入口能在运行时检查这个，需要先想清楚怎么验证（临时调试面板？还是在测试脚本里通过Detox之类跑一次？）。
7. **Android权限要单独收紧，别只是报告里提一句就算了**：已确认App代码里(`App.js`+`src/`)零网络请求(`grep`过`fetch`/`XMLHttpRequest`/`axios`/`http(s)://`全部无匹配)，所以`INTERNET`权限大概率是RN/Expo模板默认带的，不是App真正需要的——如果产品决定是完全离线，应该通过Expo的`android.blockedPermissions`配置显式拿掉，而不是保留着不管。`SYSTEM_ALERT_WINDOW`权限探测报告说是来自React Native的debug manifest，需要确认release manifest merge之后它是否真的没进最终APK，不能只信debug来源这个解释就放过。
8. 用干净的`npm ci`重跑一遍doctor/lint/34+测试/Web export/prebuild/release APK，确认以上改动没有引入新问题。
9. 检查release APK最终权限列表（用`aapt dump permissions`）。
10. 整理一份简短的正式升级说明（不是探测报告那种几百行日志级别的，是给以后回顾用的精简版），开Draft PR到`integration/fdroid`，不直接合并——等我或下次session再审一遍。

## 再往后（Phase 2/3，尚未开始）

- AsyncStorage hydration race 修复（组件挂载时读取/保存两个useEffect的执行顺序问题，早前审查发现过，这次还没修）。
- Phase 3 是两件独立的事，不能只做一件就算数：
  - **安全审计**：main分支GitHub Dependabot显示122个警告(3 critical/68 high/42 moderate/9 low)，检查是否有已知CVE影响production Android构建。
  - **许可证审计**：完整传递依赖树是否都允许分发、是否符合F-Droid收录政策；`package-lock.json`+`npm ci`可复现构建；fdroiddata metadata指向新commit并移除`Disabled:`。
- GitLab fdroiddata探路Draft MR `!44809`：`Disabled:`字段确认会跳过真实build/scanner，已在MR留言澄清，继续保持Draft，等主线(Expo57升级+两项审计)稳定后再更新指向新commit。
- PR #2处置：倾向于关闭不合并（GPT建议，我认同），但用户尚未最终拍板，别自己关掉。
- 吉神/九星等7个字段(`jiShen`/`xiongSha`/`zheng`/`taiShen`/`pengZu`/`jieQi`/`jiuXing`)数据层已保留，但没有新增UI展示——如果以后想做，是一次独立的产品功能迭代，不要混进F-Droid相关改动里。

## 已经确认、不要再反复讨论的产品决定

- 地点未识别时走"宽容估算+双重提示"，不采用PR2的"直接拒绝"（用户2026-08-04确认）。GPT在多轮审查中反复建议改回拒绝式/降级为只算太阳星座，没有采纳——这是已经拍板的产品决定，审查意见不改变这一点。
- macOS/Electron打包链路本次不用管（用户2026-08-04确认，发布目标是F-Droid/Android）。`electron`/`electron-builder`目前还在devDependencies里没删，属于待定项，不紧急。
- 不整文件替换astrology.js/calendar.js，而是精确移植（谓词替换/新增文件）。
- `.agent/handoff.md`和项目根`CONTEXT.md`是用户自己全局CLAUDE.md明确要求的产物，不是意外混入逻辑修复提交——两个文件在独立docs commit(`8178ef4`)里。GPT一开始建议不要合并进主分支，后来撤回了这条建议，确认跟用户既定工作习惯冲突后予以保留。
