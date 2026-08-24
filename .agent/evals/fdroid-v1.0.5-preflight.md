# F-Droid v1.0.5 发布证据 Gate

本文件依据 `fdroid-release/references/preflight-evidence-template.md` 建立。每次 metadata 修改后更新受影响项；`PASS` 必须附真实命令、revision/hash 和关键输出。

## Source 与模板

- [ ] `PASS` 项目 source commit（完整 40 位）：
- [ ] `PASS` fdroiddata upstream commit：
- [ ] `PASS` fdroidserver master revision/来源（不能只写本地安装版号）：
- [ ] `PASS` build template URL、总行数、SHA-256、已逐行读到 EOF：
- [ ] `PASS` MR template URL、总行数、SHA-256、已逐行读到 EOF：
- [ ] `PASS` 框架版本仍在当前 builder 支持区间；同类已合并项目证据：

## Metadata 静态门

- [ ] `PASS` 当前 `schemas/metadata.json` validation；命令与输出：
- [ ] `PASS` 当前 fdroidserver master `rewritemeta` 后 `git diff --exit-code` 为空；命令与输出：
- [ ] `PASS` 再跑一次 rewritemeta 仍为空（幂等）：
- [ ] `PASS` `fdroid lint <appid>`：
- [ ] `PASS` `fdroid checkupdates <appid>` 与 `--auto` 行为已核对：
- [ ] `PASS` `Builds.commit`、tag peeled commit、GitHub source commit 一致：

## 构建与可复现门

- [ ] `PASS` scanner 真删文件后 count = 0；环境与日志：
- [ ] `PASS` recipe 的每条 prebuild/sed 均命中预期且无误伤：
- [ ] `PASS` builder 同款单一 JDK/Gradle/SDK 构建成功：
- [x] `PASS` pre-tag source build：JDK 17，`./gradlew :app:clean :app:assembleRelease --no-daemon`，`BUILD SUCCESSFUL in 1m 16s`；产物 `app-release-unsigned.apk`。
- [x] `PASS` source APK：`applicationId=com.zengtao.fortunetelling`，`versionName=1.0.5`，`versionCode=6`，`targetSdk=34`；`apksigner verify` 返回 `DOES NOT VERIFY / Missing META-INF/MANIFEST.MF`（预期未签名）；SHA-256 `e65beda950f909ac944ad658c30aaed4448ef0971c57b746b1796988047feecd`。
- [ ] `PASS` 实际 F-Droid APK output、applicationId、versionName、versionCode：
- [ ] `PASS` post-release 原样 recipe 保留 `Binaries`/`AllowedAPKSigningKeys`：
- [ ] `PASS` built-vs-reference comparison 成功、signer 匹配、两份 APK hash 已记录：

## Fork、凭据与 pipeline 门

- [ ] `PASS` fork public、source branch unprotected：
- [ ] `PASS` `git rev-parse --is-shallow-repository` = `false`：
- [ ] `PASS` project token 最小 role/scope、短有效期；值从未回显：
- [ ] `PASS` 远端 raw metadata 与本地 byte-for-byte 一致：
- [ ] `PASS` fork pipeline 全部 jobs 终态 success；pipeline URL：
- [ ] `PASS` MR 使用官方模板，checkbox 逐条诚实填写；MR URL：
- [ ] `PASS` token 已撤销、一次性文件已删除、两类 clipboard 已清空：

## 最终状态

- 当前层级：GitHub v1.0.5 尚未提交/发布；fdroiddata MR !44809 仍停留在 v1.0.4。
- 未完成项与外部阻塞：完成 tag、F-Droid recipe 预演、更新 MR pipeline，并等待 F-Droid maintainer 合并/索引。
- Evidence reviewer：Codex 主线程
