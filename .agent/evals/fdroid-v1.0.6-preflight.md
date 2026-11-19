# F-Droid v1.0.6 发布证据 Gate

本次发布只调整 F-Droid 商店本地化与版本号，不包含功能代码变更。证据基于不可变 source commit/tag 和新的 fdroiddata 后续更新分支。

## Source 与版本

- [x] `PASS` GitHub source commit：`bc4cf84af1fb3faac9f8901d8be9251dbcd49988`。
- [x] `PASS` annotated tag `v1.0.6`：tag object `a4364d627a69f86d0b262ebaf9e38a040909a58d`，peeled commit 为 `bc4cf84af1fb3faac9f8901d8be9251dbcd49988`。
- [x] `PASS` GitHub Release：https://github.com/zengtao227/Fortune-telling/releases/tag/v1.0.6；非 draft、非 prerelease。
- [x] `PASS` 应用版本一致：`package.json`、lockfile、Expo 和 Gradle 均为 `1.0.6`；源码 Android `versionCode=7`、iOS `buildNumber=7`。
- [x] `PASS` F-Droid `VercodeOperation` 将源码 7 映射为 `71/72`；`fdroid checkupdates --auto -v` 识别 `v1.0.6 -> bc4cf84...` 并报告 `...up to date`。

## Fastlane 与 metadata

- [x] `PASS` en-US full description 顶部明确写明应用界面与全部占卜内容目前仅提供中文。
- [x] `PASS` 新增完整 `zh-CN` title、summary、full description 及 `71/72` changelog。
- [x] `PASS` 字符限制：en-US/zh-CN title、summary、description、changelog 全部在 F-Droid 限制内，UTF-8 且末尾换行完整。
- [x] `PASS` 当前 fdroiddata upstream：`22d310339c3faced145231aac5dd9797a713731b`；fdroidserver master：`6af4c4216e43d0fcb29e33919cd0fe8fef7e7400`。
- [x] `PASS` schema：`febaa8c4c4a0746b91a97c12df0f69daa036e2b0319da9b46afc867253a24b17`；`check-jsonschema` 输出 `ok -- validation done`。
- [x] `PASS` `fdroid lint` exit 0；`rewritemeta` 二次运行 byte-for-byte 幂等。
- [x] `PASS` `check-fastlane.py` 检出 en-US 与 zh-CN，且无 critical、major 或 minor finding。
- [x] `PASS` fdroiddata metadata SHA-256：`f447488247b7f06a55c460d412166883849175a6299f98f7a305228321d1a27b`。

## 项目与 Android 验证

- [x] `PASS` Jest：4 suites / 50 tests 全部通过。
- [x] `PASS` ESLint：`npm run lint -- --quiet` exit 0。
- [x] `PASS` Expo Web export 成功。
- [x] `PASS` source Release：JDK 17 / Gradle 8.3，`BUILD SUCCESSFUL in 2m 5s`；APK 为 `versionName=1.0.6`、`versionCode=7`、target SDK 34、未签名。
- [x] `PASS` F-Droid scanner：versionCode 71 与 72 均 exit 0；71 明确输出 `0 problems found`，72 同样无问题并 exit 0。macOS 预检使用仅处理 `sed -i` 差异的兼容 wrapper，配方语义与 Debian GNU sed 一致。
- [x] `PASS` F-Droid-style 71：JDK 21，`BUILD SUCCESSFUL in 1m 27s`；仅 `armeabi-v7a`，未签名，SHA-256 `a30e47d221226f821bdeaa5547a3244c51fe989a4badcb791135f7842641219b`。
- [x] `PASS` F-Droid-style 72：JDK 21，`BUILD SUCCESSFUL in 1m 17s`；仅 `arm64-v8a`，未签名，SHA-256 `d48eb5d8612b30d20b7924db2dfb1fe3d42e007fbb18c3e0b53167fffc0f26f0`。

## Fork 与 pipeline

- [x] `PASS` fdroiddata 使用 full-history、blob-filtered clone：`git rev-parse --is-shallow-repository` = `false`。
- [x] `PASS` 后续分支 `update-fortunetelling-1.0.6` commit：`a95de67216413f9f04730b3e747a1f0ca7941099`；只修改 `metadata/com.zengtao.fortunetelling.yml`。
- [x] `PASS` fork branch pipeline：https://gitlab.com/zengtao227/fdroiddata/-/pipelines/2793292941；12/12 jobs 全部 success。
- [x] `PASS` 真实 `fdroid build` job `16125050259` 构建 71/72，终态 success；依赖产物的 `check apk` job `16125050268` 终态 success。
- [ ] `PENDING` 创建指向 `fdroid/fdroiddata:master` 的后续 MR，并在 pipeline 全绿后回复维护者。

## 最终状态

- 当前层级：GitHub `v1.0.6` 已不可变发布；fdroiddata 后续分支已公开推送，pipeline 12/12 success；MR 表单已准备但尚未提交。
- Evidence reviewer：Codex 主线程
