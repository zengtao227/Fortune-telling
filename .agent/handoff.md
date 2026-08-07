# Handoff

最后更新：2026-08-07

## 当前结论：F-Droid 发布路径的本地/GitLab 侧准备工作基本做完了

`integration/fdroid` 现在有：真实验证过的 Android 构建、完整许可证审计、可复现构建验证、更新过且已通过`fdroid rewritemeta`格式检查的 GitLab 探路 MR、修复过的 AsyncStorage 竞态。剩下的都是需要 F-Droid 官方基础设施或用户决定的事，不是能在本地继续推进的了。

## 三条分支的当前状态

| 分支 | 最新 commit | 状态 |
|---|---|---|
| `main` | `57e9450` | 生产分支，Expo SDK 50。 |
| `integration/fdroid` | `4d57fac` | **当前工作分支**，Expo SDK 50。含 Phase 1 逻辑修复 + electron移除 + 许可证审计 + expo-system-ui修复 + AsyncStorage竞态修复 + 英文fastlane商店文案。**未合并回 main**。 |
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

## ⚠️ 发布闸门（用户2026-08-07明确要求）

**在下面两件事都解决之前，不要把这个App上架到F-Droid**（不要去掉GitLab MR的`Disabled:`字段，不要提交正式收录申请）：
1. ~~F-Droid上架的英文商店文案要求~~ **已完成，见下方"已完成"**。
2. **multi-language讨论**——用户发现App运行时只有中文，问是否该做多语言。已经查清楚这跟F-Droid上架要求本身无关（F-Droid只要求英文商店文案，不要求App本身多语言），但用户明确要求先讨论完这个问题再上架，不能因为"技术上已经满足F-Droid要求"就跳过这一步自己上架。**这个话题还没有开始讨论，下次接着做的第一件事就是这个。**

## 再往后要做的事（尚未开始）

1. **要不要把`integration/fdroid`合并回`main`**——这个决定还没做，Phase 1的东西已经验证得很充分了，值得考虑。
2. **PR #2处置**：倾向于关闭不合并，用户尚未最终拍板，别自己关掉。**新情况(2026-08-07)**：真实F-Droid社区人物`licaon-kter`(知名maintainer)在PR #2下留了条评论("do add icon.png and phoneScreenshots...")——他大概率是从GitLab MR描述里的链接点过去的，但PR #2本身是废弃分支(还带着未修复的产品回归)，不是当前工作分支。还没回复他，需要用户决定怎么处理(在integration/fdroid说明现状？还是不管？这是public GitHub评论，回复前需要用户同意)。
3. **吉神/九星等7个字段**数据层已保留，没新增UI——以后想做是独立产品功能迭代，不要混进F-Droid相关改动。
4. **GitLab MR下一步**：等哪天真的要提交正式收录申请时，去掉`Disabled:`字段，让F-Droid真实构建服务器和scanner跑一遍，根据真实报错再迭代`scanignore`。这一步只能等外部反馈，不是能在本地继续推进的。
5. **Android/Hermes真机时区验证**：仍然没做（需要真机或模拟器+调试入口，判断为超出目前投入产出比，长期看仍是最大的悬而未决风险点）。
6. **品牌命名不一致，值得跟用户核对**：GitLab metadata的`AutoName`目前写的是"Fortune Telling"，但App实际UI顶部显示的品牌是"MYSTIC TAROT"(硬编码在App.js第857行)。这次新写的fastlane`title.txt`用的是"Mystic Tarot"(匹配App实际显示)，但GitLab那边的`AutoName`还没同步改过来——不算阻塞项，但发布前应该让两边一致。
7. **"完全不联网"文案的精确度**：fastlane文案写的是"the app makes no network requests"(代码层面完全属实，已用grep验证零网络调用)，但AndroidManifest目前仍然声明了`INTERNET`权限(只是没被代码用到)。之前在`upgrade/expo57`分支探索过用`android.blockedPermissions`去掉这个权限，但发现会同时影响debug和release构建(需要自定义config plugin才能只对release生效)，讨论到一半被Expo57的成本收益分析打断，没有最终决定。如果想让"完全不联网"这个说法在权限列表层面也站得住脚，这个还没做完。

## 已完成（2026-08-07 新增）

- **AsyncStorage hydration race 修复**：`AstrologyForm`组件的Load Effect(异步`getItem`)和Save Effect(`setItem`,依赖`[name,date,time,location]`)在挂载时同时触发——Save Effect用初始的空字符串状态先跑一次，早于Load Effect的异步读取完成，会把之前保存的草稿覆盖成空值；如果App在这个窗口期被关掉，草稿就真的丢了。用`hasLoadedRef`门控修复：Load Effect完成前Save Effect直接跳过。在浏览器里做了行为验证(输入草稿→整页刷新重新挂载→草稿保留)，34测试+0 lint错误。commit `70923f2`。
- **英文fastlane商店文案**(`fastlane/metadata/android/en-US/`)：F-Droid要求商店列表(标题/描述/截图)必须是英文，跟App本身是不是多语言完全是两回事——这个目录之前完全不存在。新写了`title.txt`("Mystic Tarot")、`short_description.txt`、`full_description.txt`(英文原创，没有机械翻译中文内容，只写verified事实)、`changelogs/2.txt`、512×512的`icon.png`(从真实1024×1024图标缩放，不是随便截的图)、3张真实App截图(首页/占星结果/周易卦象结果，含长按仪式触发的卦象可视化)。**顺手发现并修了一个真bug**：`.gitignore`里的`android/`和`ios/`两条规则没有加`/`前缀锚定到仓库根目录，导致git会把任何叫"android"的子目录都忽略掉——包括这次新建的`fastlane/metadata/android/en-US/`，这些文件加了以后`git status`完全不显示，改成`/android/`和`/ios/`才修好。commit `4d57fac`。

## 已经确认、不要再反复讨论的决定

- 地点未识别时走"宽容估算+双重提示"，不采用"直接拒绝"（用户2026-08-04确认，GPT多轮建议改回拒绝式，未采纳）。
- macOS/Electron打包链路不用管，且已经把依赖真删了（用户2026-08-06确认"按你的建议开始做吧"）。
- Expo 57升级不做（用户2026-08-06基于成本收益分析后决定，不是技术上做不到，是不划算）。
- applicationId定为`com.zengtao.fortunetelling`（用户2026-08-06确认）。
- GitLab MR继续保持Disabled探路状态，不升级成正式申请（用户2026-08-06确认）。
- 不整文件替换astrology.js/calendar.js，而是精确移植。
- `.agent/handoff.md`和项目根`CONTEXT.md`是用户自己全局CLAUDE.md明确要求的产物，予以保留。
