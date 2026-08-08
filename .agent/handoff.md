# Handoff

最后更新：2026-08-08

## 当前状态：v1.0.2 已发布，F-Droid MR 已更新且 CI 全绿

- 上游 release 源码 commit：`ac5ddb6ddf24542daa3ae978648cd62155794c28`
- 不可变 annotated tag：`v1.0.2`（远端 peeled commit 仍为上述 commit）
- GitHub source-only release：<https://github.com/zengtao227/Fortune-telling/releases/tag/v1.0.2>
- Android release 已启用 R8 minify 和资源收缩；干净构建执行了 `minifyReleaseWithR8`、`shrinkReleaseRes`、`optimizeReleaseResources`
- F-Droid MR：<https://gitlab.com/fdroid/fdroiddata/-/merge_requests/44809>
- F-Droid 元数据 commit：`bb91b98cfbfb752c94863aa4d53ee03e7986165f`，指向上游 v1.0.2/versionCode 3
- 新流水线：<https://gitlab.com/zengtao227/fdroiddata/-/pipelines/2743550271>，全部 9 个 jobs 通过，包括 `fdroid build` 与 `check apk`
- reviewer 的 minify 问题已在原线程回复：<https://gitlab.com/fdroid/fdroiddata/-/merge_requests/44809#note_3661839592>

## 下一步

- 不再推送构建变更；等待 F-Droid maintainer review/merge 和后续索引发布。
- F-Droid 上架完成前，不得把“MR open + CI pass”描述为“已在 F-Droid 商店可下载”。
- GitHub release 未附带 APK；本地临时签名 APK 只用于模拟器安装验证，F-Droid 仍从源码构建并自行签名。

## 关键验证

- `npm test -- --runInBand`：3 suites / 34 tests 通过。
- `npm run lint`：exit 0、0 errors；466 个既有 warnings 未在本任务扩散处理。
- release APK 约 64 MiB；R8 `mapping.txt` 为 7,265,048 bytes；原产物 `apksigner` 明确为 unsigned。
- 临时测试签名副本在 AVD 安装/启动成功；首页、占星表单、周易结果页和字体/图标/渐变通过冒烟，app-PID logcat 无致命异常。
- 占星完整结果页与持续动画未由自动化可靠证明，属于非阻塞的手工验证缺口；发布目标本身已通过。

---

## 历史状态（2026-08-07）

## 当前结论：发布闸门的两个条件都已满足，但还没实际提交F-Droid正式收录申请

`integration/fdroid` 现在有：真实验证过的 Android 构建、完整许可证审计、可复现构建验证、更新过且已通过`fdroid rewritemeta`格式检查的 GitLab 探路 MR、修复过的 AsyncStorage 竞态、完整英文fastlane商店文案。用户2026-08-07设的发布闸门两条都已解决：
1. F-Droid商店文案要求 ✅
2. Multi-language讨论 ✅（用户明确决定：**这次不做**，App保持中文单语言发布，商店文案本来就是英文，两者互不冲突。以后如果真有需求，是一个独立项目，不混进这次发布）

**闸门解除不等于自动去提交**——去掉GitLab MR的`Disabled:`字段、提交正式收录申请，这是下一步会产生真实外部影响的动作，还没做，需要用户单独确认才能执行。

## 三条分支的当前状态

| 分支 | 最新 commit | 状态 |
|---|---|---|
| `main` | `8852fca` | 生产分支，Expo SDK 50。含品牌改名(Fortune Telling)。 |
| `integration/fdroid` | `2315460` | **当前工作分支**，Expo SDK 50。含 Phase 1 逻辑修复 + electron移除 + 许可证审计 + expo-system-ui修复 + AsyncStorage竞态修复 + 英文fastlane商店文案 + 品牌改名(天语/星语/卦语)。**未合并回 main**。 |
| `upgrade/expo57` | `b30e073` | **已暂停，不再继续**（见下方"Expo 57 升级：决定不做"）。分支保留，不删，以后有真实理由要升级时可以直接捡起来接着做。 |
| `probe/expo57` | `55b53ba` | 纯证据分支，已完成使命，不需要再碰。 |

`vercel.json`的`"public": true`失效字段问题在 main/integration/fdroid/probe/expo57 三条分支上都已修复，不会再触发"Failed preview deployment"邮件。

## Expo 57 升级：决定不做，不是忘了做

做了完整的成本收益分析后决定放弃，不是半途而废：
- **F-Droid不要求任何特定Expo/SDK版本**——查过官方Inclusion Policy确认。
- **对Dependabot警告基本没帮助**——升级Expo不会明显减少警告数（真正有用的是删electron，见下方）。
- **对iOS未来发布没有实质帮助**——iOS需要Xcode/CocoaPods/证书链路，这次完全没碰过，Android这边做不做完都不影响iOS要重新弄这件事。
- **SDK50不会因为"官方停止支持"就失效**——查过Expo自己的支持政策：SDK过期主要影响Expo Go和EAS Build云服务，F-Droid走的是纯本地`prebuild`+`gradlew`构建，不依赖这两者，SDK50只要lockfile锁死就能一直稳定构建。

如果以后有真实理由要升级（比如某个新功能真的需要新版RN/React特性），`upgrade/expo57`分支上已经有可用的基础工作：SDK57依赖升级、devDependencies整理、苏黎世跳空测试都已完成并验证过，不用从头再来。

## `integration/fdroid` 完整状态（截至 `a0d6a57`）

### Phase 1 逻辑修复（经过三轮GPT交叉审查）
从PR #2里选择性移植了真正有价值的逻辑层改进，没有整文件替换：
- `src/logic/locations.js` + `src/logic/inputValidation.js`（新增，21地点城市库 + 校验）
- `src/logic/astrology.js`：`localDateTimeToUtc`解析式0/1/2候选检测处理夏令时（跳空顺延标记`timeEstimated`，回拨歧义取较早标记`timeAmbiguous`），地点未识别不throw，回退上海坐标+时区
- `src/logic/locations.js`的`resolveLocation`：CJK子串匹配+拉丁单词边界匹配，修复"Xianyang"误配"Xian"；"Paris,Texas"这类同名不同地歧义明确不解决（字符串匹配固有局限）
- `src/logic/calendar.js`：只换吉时筛选谓词，其余19字段原样保留
- `App.js`：单一校验入口、try/catch/finally防卡死、四种独立DST/地点提示
- 35个测试全绿（含苏黎世春季跳空+秋季回拨、纽约春季跳空+秋季回拨精确UTC断言）

### 依赖清理
- 删除`electron`/`electron-builder`/`wait-on`——main和integration/fdroid都做了，**GitHub Dependabot警告从122降到77**（已用API二次确认，不是估算）。
- `expo-system-ui`补充——修复`userInterfaceStyle: automatic`在Android上silently不生效的问题（这个bug在SDK50上一直存在，不是SDK57升级才发现的，是这次做Android真实构建验证时才发现的）。

### 真实Android构建验证（不是只测JS）
- `npm ci` + `expo prebuild --clean --platform android` + `gradlew assembleRelease` 跑通，产出真实APK。
- 权限列表：`INTERNET`/`READ,WRITE_EXTERNAL_STORAGE`(maxSdk 32)/`SYSTEM_ALERT_WINDOW`/`VIBRATE`，包名`com.zengtao.fortunetelling`versionCode 2 versionName 1.0.1，均符合预期。
- **发现一个未解决的小尾巴**：`minSdkVersion`是23（Android 6.0），低于Hermes的Intl实现依赖的`android.icu`平台库要求的API 24（Android 7.0）——理论上Android 6.0设备上时区精确计算可能不准，这类设备现在已经很少但F-Droid用户群偏好支持老设备，值得记录，不算阻塞项。
- **可复现构建验证**：同一commit干净构建两次，解压后860个文件逐一比对，内容完全一致（外层zip容器时间戳不同，属于正常噪音，不是真正的不可复现）。

### 许可证审计（新增 `LICENSE` + `THIRD_PARTY_NOTICES.md`）
- `npx license-checker --production`扫了全部1202个生产依赖包，**零非自由/专有许可证**，全是标准FLOSS许可证。
- `package.json`原来完全没有`license`字段（自己都是UNLICENSED），已补上`"license": "MIT"`。
- `THIRD_PARTY_NOTICES.md`是真实生成的完整清单（1202个包按许可证分组），不是PR2那种手写5条、还带着错误品牌名"Mystic Compass"的旧版本。
- 顺手追踪了一个"看起来像埋点"的包(`@segment/loosely-validate-event`)，确认是Expo CLI自己的命令行遥测依赖链，不会打进App的JS bundle。

### GitLab fdroiddata MR (`!44809`) 已更新，且这次真的通过了格式检查
- metadata文件从`io.github.zengtao227.fortunetelling.yml`重命名为`metadata/com.zengtao.fortunetelling.yml`（applicationId已拍板定为`com.zengtao.fortunetelling`，用户2026-08-06确认）。
- `Builds.commit`指向`integration/fdroid@a0d6a57`，`versionName`/`versionCode`改成真实值(`1.0.1`/`2`，不再是probe阶段瞎写的`1.1.0`/`3`)。
- `scanignore`列表改成从这次真实本地构建验证过的native module清单，不再是"类比其他App"的未验证猜测。
- **`Disabled:`字段保留**（用户2026-08-06明确选择：先只更新commit指向，不升级成正式申请收录）——F-Droid真实的build server和scanner还没跑过这个commit，之前的一切验证都是本地做的。
- MR页面已加评论说明这次更新解决了哪些原来列出的blocker。
- **2026-08-07**：第一次推送后CI的`fdroid rewritemeta`格式检查失败(commit `9f85a263`)。没有直接照单全收自动格式化结果——先用真实diff核对了一遍，确认不是要删掉`expo prebuild`步骤(那样会改坏真实构建逻辑)，而是纯字段顺序/引号风格规范化，对照真实在架的Expo App(`app.ladefuchs.android.yml`)的recipe验证了`gradle: yes`和自定义`build:`列表可以共存，不是互斥的。按真实diff手动重写后推送(`dbfae23c`)，又因为少了一个文件末尾换行符再次失败，补上后推送(`3dd49caf`)。**Pipeline #2740041291 已确认通过**——`fdroid rewritemeta`/`fdroid lint`/`schema validation`等格式类检查全绿，`Disabled:`字段仍然按设计跳过真实build/scanner(预期内，不是问题)。MR目前处于干净、格式合规的Draft状态，随时可以在决定正式提交时去掉`Disabled:`。

## ⚠️ 发布闸门（用户2026-08-07明确要求）——两条均已解决

**在下面两件事都解决之前，不要把这个App上架到F-Droid**（不要去掉GitLab MR的`Disabled:`字段，不要提交正式收录申请）：
1. ~~F-Droid上架的英文商店文案要求~~ **已完成**。
2. ~~multi-language讨论~~ **已完成**——用户明确决定：这次不做，App保持中文单语言发布（0时间成本，与F-Droid商店文案的英文要求互不冲突）。以后如果真有需求，是独立项目，不混进这次发布。

**注意：闸门解除≠自动上架**。去掉`Disabled:`字段、提交正式收录申请仍需用户单独明确确认。

## 品牌命名：已从"Fortune Telling"改为按场景切换的中文品牌（2026-08-07）

用户提出：App内标题不该是纯英文固定词，应该按场景变化，且不该跟主题色(`themeMode`)绑定（历史代码曾经这样绑定，但那只是巧合，`themeMode`是与`currentView`完全独立的状态）。讨论后确定：
- HOME（中性首页）→ **天语**
- 占星 (`ASTRO`/`RESULT_AS`) → **星语**（呼应已有UI文案"绘制星盘"）
- 周易 (`RESULT_IC`) → **卦语**（呼应已有UI文案"六十四卦象"）

实现：`App.js`头部标题从静态字符串改成 `currentView === "HOME" ? "天语" : currentView === "RESULT_IC" ? "卦语" : "星语"`。三态已用本地Expo web + 浏览器截图逐一验证渲染正确。34测试+0 lint错误照常通过。commit `2315460`。

**F-Droid商店文案(fastlane `title.txt`等)保持英文"Fortune Telling"不变**——这是独立于App内标题的、F-Droid要求的store listing artifact，两者本来就不需要一致，不用因为App内标题改了就跟着改。但**3张`phoneScreenshots`已经重新截图**（原来的截图里烧录了旧的"Fortune Telling"英文头图，跟改名后的真实UI不符，必须换成体现天语/星语/卦语的新截图，否则store截图会和真实App不一致）。

## 再往后要做的事（尚未开始）

1. **要不要把`integration/fdroid`合并回`main`**——这个决定还没做，Phase 1的东西已经验证得很充分了，值得考虑。命名改动这次也应该同步到`main`（延续此前"品牌决定不分叉"的做法）。
2. **PR #2处置**：倾向于关闭不合并，用户尚未最终拍板，别自己关掉。**licaon-kter评论已回复**（2026-08-07，用户明确授权后发布，说明PR #2是废弃分支、真实工作在`integration/fdroid`，fastlane截图已补上，GitLab `Builds.commit`会更新指向）——回复链接：`https://github.com/zengtao227/Fortune-telling/pull/2#issuecomment-5217680452`。
3. **吉神/九星等7个字段**数据层已保留，没新增UI——以后想做是独立产品功能迭代，不要混进F-Droid相关改动。
4. **GitLab MR下一步（两件事都还没做）**：(a) 把`Builds.commit`从`a0d6a57`更新到包含fastlane截图+品牌改名的最新commit——**licaon-kter的反馈目前依然成立**（`git log`验证过：`a0d6a57`早于新增fastlane截图的`4d57fac`，所以GitLab metadata现在指向的commit确实还没有截图，不是他看错了PR）；(b) 等哪天真的要提交正式收录申请时，去掉`Disabled:`字段，让F-Droid真实构建服务器和scanner跑一遍。(a)属于"让当前Draft保持准确"，可以随时做；(b)是真正的上架动作，需要用户单独确认。
5. **Android/Hermes真机时区验证**：仍然没做（需要真机或模拟器+调试入口，判断为超出目前投入产出比，长期看仍是最大的悬而未决风险点）。
6. **"完全不联网"文案的精确度**：fastlane文案写的是"the app makes no network requests"(代码层面完全属实，已用grep验证零网络调用)，但AndroidManifest目前仍然声明了`INTERNET`权限(只是没被代码用到)。之前在`upgrade/expo57`分支探索过用`android.blockedPermissions`去掉这个权限，但发现会同时影响debug和release构建(需要自定义config plugin才能只对release生效)，讨论到一半被Expo57的成本收益分析打断，没有最终决定。如果想让"完全不联网"这个说法在权限列表层面也站得住脚，这个还没做完。

## GitLab仓库结构说明（2026-08-07 用户提问后核实）

用户曾以为GitLab上有自己App代码的镜像/import。实际核实（`curl` GitLab公开API + 本地`git remote -v`+`.github/workflows/`检查）：
- GitLab上只有`zengtao227/fdroiddata`（官方`fdroid/fdroiddata`的fork）和`TravelSpendPlus`两个项目，**没有Fortune-telling的代码副本**。
- `fdroiddata`里只有一个小YAML文件(`metadata/com.zengtao.fortunetelling.yml`)，里面`SourceCode`/`Repo`字段直接指向GitHub URL——F-Droid真实构建时会直接从GitHub clone，GitLab从不持有代码本身。
- 用户记忆中的"import"大概率是指fork了`fdroid/fdroiddata`这个动作本身（这确实是GitLab UI里的"import project"操作），跟"导入自己的App代码"是两回事。
- 无法100%排除用户有一个我看不到的私有GitLab项目，如果之后发现确有其事需要更新这条记录。

## 已完成（2026-08-07）

- **AsyncStorage hydration race 修复**：`AstrologyForm`组件的Load Effect(异步`getItem`)和Save Effect(`setItem`,依赖`[name,date,time,location]`)在挂载时同时触发——Save Effect用初始的空字符串状态先跑一次，早于Load Effect的异步读取完成，会把之前保存的草稿覆盖成空值；如果App在这个窗口期被关掉，草稿就真的丢了。用`hasLoadedRef`门控修复：Load Effect完成前Save Effect直接跳过。在浏览器里做了行为验证(输入草稿→整页刷新重新挂载→草稿保留)，34测试+0 lint错误。commit `70923f2`。
- **英文fastlane商店文案**(`fastlane/metadata/android/en-US/`)：F-Droid要求商店列表(标题/描述/截图)必须是英文，跟App本身是不是多语言完全是两回事——这个目录之前完全不存在。新写了`title.txt`、`short_description.txt`、`full_description.txt`(英文原创，没有机械翻译中文内容，只写verified事实)、`changelogs/2.txt`、512×512的`icon.png`(从真实1024×1024图标缩放，不是随便截的图)、3张真实App截图。**顺手发现并修了一个真bug**：`.gitignore`里的`android/`和`ios/`两条规则没有加`/`前缀锚定到仓库根目录，导致git会把任何叫"android"的子目录都忽略掉——包括这次新建的`fastlane/metadata/android/en-US/`，这些文件加了以后`git status`完全不显示，改成`/android/`和`/ios/`才修好。commit `4d57fac`。
- **App品牌名从"MYSTIC TAROT"改回"Fortune Telling"**，后又细化为按场景切换的天语/星语/卦语（见上方专门章节）。
- **回复了licaon-kter在PR #2的评论**，说明真实工作分支+fastlane截图现状。
- **重新截图了3张fastlane phoneScreenshots**，匹配天语/星语/卦语改名后的真实UI。

## 已经确认、不要再反复讨论的决定

- 地点未识别时走"宽容估算+双重提示"，不采用"直接拒绝"（用户2026-08-04确认，GPT多轮建议改回拒绝式，未采纳）。
- macOS/Electron打包链路不用管，且已经把依赖真删了（用户2026-08-06确认"按你的建议开始做吧"）。
- Expo 57升级不做（用户2026-08-06基于成本收益分析后决定，不是技术上做不到，是不划算）。
- applicationId定为`com.zengtao.fortunetelling`（用户2026-08-06确认）。
- GitLab MR继续保持Disabled探路状态，不升级成正式申请（用户2026-08-06确认）。
- 不整文件替换astrology.js/calendar.js，而是精确移植。
- `.agent/handoff.md`和项目根`CONTEXT.md`是用户自己全局CLAUDE.md明确要求的产物，予以保留。
