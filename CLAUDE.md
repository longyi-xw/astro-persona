# 星座百科 / Astro Persona

全球中英双语星座性格分析站。Jamstack：SSG 优先 + 客户端纯函数运算 + 预留边缘函数。
权威事实见 design/：01 需求、02 技术设计、03 设计系统。视觉真源：design/星座百科原型.dc.html，
其拆解摘要见 design/TOKENS.md（优先读摘要，别整文件重读 .dc.html）。

## 命令
- 开发：pnpm dev
- 类型检查：pnpm typecheck
- 单测：pnpm test
- 静态产出：pnpm generate
- 提交前必跑：pnpm lint && pnpm typecheck && pnpm test（= pnpm check）

## 架构铁律
- 所有内容/配置数据只能经 src/content/index.ts 取用；组件与 src/core 禁止直接 import content/*.json（src/content 启动时 zod 校验一次，失败即 build/test 变红）。
- src/core/* 必须是纯函数，无框架依赖，所有参数来自 content/config/（注入而非 import），必须有 Vitest 单测。
- 内容/文案/权重一律放 content/*，禁止在组件里硬编码展示文案或星座数据。
- 双语文案按稳定 id 对齐；算法只认 id，与语言无关。
- 文案统一经 src/narrative 的 NarrativeProvider 产出；本期只启用 TemplateNarrativeProvider。
- 不引入后端、不把任何密钥放进前端；结果状态编码进 URL 以复现（base64url）。
- 修改 src/core/* 后，必须同步更新/通过 tests/，并复核异变率仍在 15%–30%。

## 约定
- TypeScript strict；2 空格缩进；组件用 <script setup lang="ts">。
- UI chrome 文案走 i18n（src/locales）；领域文案（原型名/关键词/异变语/匹配解释）走 content/copy，经 narrative 产出。
- 颜色/字号/间距引用设计令牌（uno.config.ts theme + tokens.css 变量），不写魔法值。
- 提交信息用祈使句、范围前缀（feat/fix/refactor: ...）。
- 新增星座维度/题目权重时，先改 content schema 与类型，再改实现。

## 自动记忆
当我纠正你某个本项目专属做法（某个调参方向、某个 i18n 坑），把结论记进记忆，下次别再犯；
但项目级长期规则应由我手动写进本文件，而非只存记忆。

## Compact Instructions（压缩时务必保留）
- 保留：当前所处开发阶段、刚改过的 core 算法与其参数、未通过的测试、待办。
- 可丢弃：已读完的大文件原文、已完成阶段的中间讨论。
