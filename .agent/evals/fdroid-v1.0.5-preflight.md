# F-Droid v1.0.5 发布证据 Gate

本文件依据 `fdroid-release/references/preflight-evidence-template.md` 建立。每次 metadata 修改后更新受影响项；`PASS` 必须附真实命令、revision/hash 和关键输出。

## Source 与模板

- [x] `PASS` 项目 source commit（完整 40 位）：`66d6249ff93e5c858980d8db3f6c31bbdf9fb05f`。
- [x] `PASS` fdroiddata upstream commit：`ace89cac11871e53a06c5edbf2b1b279d1a5af82`（2026-08-24 `master`）。
- [x] `PASS` fdroidserver master revision/来源：`6af4c4216e43d0fcb29e33919cd0fe8fef7e7400`，从 GitLab master 安装到隔离 Python 3.13 venv。
- [x] `PASS` build template：[build-react-native.yml](https://gitlab.com/fdroid/fdroiddata/-/raw/master/templates/build-react-native.yml)，58 行，SHA-256 `624a2d66d5a9d6660898d139b1c191818e6fd3c6776cf148501bb4c209079257`，已逐行读到 EOF；recipe 保留适用的 npm/JDK21/Expo scanignore，省略无 Firebase/srclib 的模板项。
- [x] `PASS` MR template：[App inclusion.md](https://gitlab.com/fdroid/fdroiddata/-/raw/master/.gitlab/merge_request_templates/App%20inclusion.md)，50 行，SHA-256 `4eebacb8579279b3b46d4464e77fd1441b1edbe290b90e6ca5e7033971dab9a8`，已逐行读到 EOF。
- [x] `PASS` 框架版本仍在当前 builder 支持区间：Expo 50 / RN 0.73；同一 recipe 的 v1.0.4 MR pipeline `2745454091` 已含真实 F-Droid build success，本次依赖树与 recipe 未变。

## Metadata 静态门

- [x] `PASS` 当前 `schemas/metadata.json` validation：`check-jsonschema --schemafile schemas/metadata.json metadata/com.zengtao.fortunetelling.yml` → `ok -- validation done`；schema SHA-256 `febaa8c4c4a0746b91a97c12df0f69daa036e2b0319da9b46afc867253a24b17`。
- [x] `PASS` 当前 CI 的 fdroidserver master `rewritemeta`：job `16070732692` 使用 fdroidserver `6af4c42` 与 Debian trixie `ruamel.yaml`，规范化后 metadata SHA-256 `5d60dc14c9d6fb8ad5e6a41635d9afd697cfd4afeb79bedb3b575ae49c5c5b42`。
- [x] `PASS` `rewritemeta` CI job 终态 success；本机较新 pip `ruamel.yaml` 会把长 `sed` 行折行，因此最终以 CI 生成并验证的单行格式为权威。
- [x] `PASS` `fdroid lint com.zengtao.fortunetelling`：exit 0（加载当前 fdroiddata `config/` 分类与 anti-feature 配置）。
- [x] `PASS` `fdroid checkupdates` 与 `--auto`：二者均识别 `v1.0.5` → `66d6249ff93e5c858980d8db3f6c31bbdf9fb05f`；CI `checkupdates` job `16070732689` 终态 success。
- [x] `PASS` `Builds.commit`、annotated tag peeled commit、GitHub source commit 均为 `66d6249ff93e5c858980d8db3f6c31bbdf9fb05f`；tag object `77b1dcb5e51fb36f7b5a50634cd967302e918481`。

## 构建与可复现门

- [x] `PASS` scanner 真删文件后 count = 0：fdroidserver `6af4c42`；`SCANNER_COUNT=0`。日志确认 `Ignoring ... linux64-bin/hermesc`，并删除 macOS/Windows Hermes、wrapper jar、非构建资产。
- [x] `PASS` recipe 的每条 prebuild/sed 均命中预期且无误伤：源码 `android/app/build.gradle` 唯一 `versionCode 6` 变为 61/62；RN flat-layout `node_modules/@react-native/gradle-plugin/build.gradle.kts` 唯一 `jvmToolchain(17)` 变为 21。
- [x] `PASS` builder 同款单一 JDK/Gradle/SDK 构建成功：JDK 21 + Gradle 8.3，显式 `auto-detect=false`、`auto-download=false`、`installations.paths=<JDK21>`；61 build `BUILD SUCCESSFUL in 2m 5s`，62 build `BUILD SUCCESSFUL in 1m 9s`。
- [x] `PASS` pre-tag source build：JDK 17，`./gradlew :app:clean :app:assembleRelease --no-daemon`，`BUILD SUCCESSFUL in 1m 16s`；产物 `app-release-unsigned.apk`。
- [x] `PASS` source APK：`applicationId=com.zengtao.fortunetelling`，`versionName=1.0.5`，`versionCode=6`，`targetSdk=34`；`apksigner verify` 返回 `DOES NOT VERIFY / Missing META-INF/MANIFEST.MF`（预期未签名）；SHA-256 `e65beda950f909ac944ad658c30aaed4448ef0971c57b746b1796988047feecd`。
- [x] `PASS` 实际本地 F-Droid-style APK output：61 仅 `armeabi-v7a`、62 仅 `arm64-v8a`；二者 `applicationId=com.zengtao.fortunetelling`、`versionName=1.0.5`，分别 `versionCode=61/62`，均 `DOES NOT VERIFY`（未签名）。SHA-256：61 `c33c8ce60620bd545c614e700805e187fdf0205800c49f28633952b5a499c705`；62 `3d65024f966972437cff210c74f1a9c4c84a9634482d75f8a33f09a81ccaef4c`。
- [x] `N/A` post-release `Binaries`/`AllowedAPKSigningKeys`：本 MR 从一开始就是 F-Droid 自签 source build，未声明上游 `Binaries` 或可复现签名字段，本次不新增/删除这些字段。
- [x] `N/A` built-vs-reference comparison/signer：项目未启用 reproducible-build reference APK；最终 gate 是 fork/官方 `fdroid build` 与 APK 检查 jobs。

## Fork、凭据与 pipeline 门

- [x] `PASS` fork public、source branch unprotected：GitLab API `visibility=public`；protected branch endpoint 对 `draft-fortunetelling-expo57` 返回 404。
- [x] `PASS` `git rev-parse --is-shallow-repository` = `false`（full-history, blob-filtered clone）。
- [x] `PASS` 凭据：使用 Git 已配置的 credential helper 推送，未读取或回显 GitLab token。
- [x] `PASS` 远端 raw metadata 与本地 byte-for-byte 一致：`cmp` exit 0；双方 SHA-256 均为 `5d60dc14c9d6fb8ad5e6a41635d9afd697cfd4afeb79bedb3b575ae49c5c5b42`；fdroiddata branch head `d3f6c008e876ac2ff6ebeef60c718562bcc1523f`。
- [x] `PASS` fork pipeline 全部 9 jobs 终态 success；`fdroid build` job `16070732688` 构建 61/62，`check apk` job `16070732696` success；pipeline URL：https://gitlab.com/zengtao227/fdroiddata/-/pipelines/2785824769
- [x] `PASS` MR 使用官方 App inclusion 模板，checkbox 已按 v1.0.5 真实状态更新：tag/auto-update 与双 ABI 已勾选，Reproducible Builds 保持未勾选并明确写明选择 F-Droid 自签；MR URL：https://gitlab.com/fdroid/fdroiddata/-/merge_requests/44809
- [x] `PASS` maintainer 布局讨论已回复：note `3726279025`；包含根因、更正说明、320/360/411dp 原生 Android QA、绿色 pipeline 与 360dp 修复截图。
- [x] `PASS` token/clipboard 清理：全程使用既有 Git credential helper，未创建、读取、回显或复制一次性 token；截图上传临时使用的浏览器图片 clipboard 已清空，未把凭据写入临时文件或 clipboard。

## 最终状态

- 当前层级：GitHub v1.0.5 已发布并锁定到 `66d6249...`；fdroiddata MR !44809 已更新到 `d3f6c008...`，remote raw 一致，pipeline `2785824769` 的 9 个 jobs 全部 success；官方模板说明与 maintainer 回复均已公开更新。
- 未完成项与外部阻塞：等待 F-Droid maintainer review/merge 与后续仓库索引；当前无需再推送代码或 metadata。
- Evidence reviewer：Codex 主线程
