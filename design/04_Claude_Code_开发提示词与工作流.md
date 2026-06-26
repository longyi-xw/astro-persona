# 星座百科 · Claude Code 开发提示词与工作流

> 配套：《01 系统需求文档 SRS》《02 技术设计文档》《03 Claude Design 页面设计提示词》。
> 本文把"原型 → 工程实现"的全过程拆成可直接粘贴给 `claude` 的提示词，并贯穿三个支柱：**记忆（CLAUDE.md + 自动记忆）**、**Skill（按需加载的可复用工作流）**、**上下文压缩（聚焦会话 + /compact + 子代理）**。

---

## 0. 工作流总览

```
Claude Design 原型(.dc.html)
        │  导出到仓库 design/
        ▼
Claude Code 工程化  ──  记忆: CLAUDE.md(持久指令) + 自动记忆(学习你的纠正)
        │              Skill: design-to-page / quiz-question / calibrate
        │              压缩: 一阶段一会话 + /compact + 子代理吸收检索
        ▼
Cloudflare Pages 部署
```

三条铁律，先写进脑子，后面提示词都围着它转：
1. **算法是纯函数**（`src/core/*`），配置驱动、可单测——它们是这个项目最值钱、最该被记忆和测试锁住的部分。
2. **内容/文案/权重外置**（`content/*`），与逻辑分离，双语按 `id` 对齐。
3. **无后端、无密钥进前端**；结果用 URL 编码复现；LLM 只留接口。

---

## 1. 准备工作

### 1.1 初始化
```bash
# 安装（需 Node 18+）
npm install -g @anthropic-ai/claude-code
# 进入空仓库后启动，并让它生成初始 CLAUDE.md
claude
> /init
```
`/init` 会扫描仓库生成一份 CLAUDE.md 草稿——**别直接用**，用下面 2.2 的版本替换/合并它。

### 1.2 把 Claude Design 原型接入仓库（这就是"导入"该发生的地方）
原型在 Claude Design 里、且 URL 需要登录，所以不要试图让模型去抓那个链接；**导入对象是 Claude Code 的本地文件系统**：

1. 在 Claude Design 里打开项目 → 导出 / 下载 `星座百科原型.dc.html`。
2. 放进仓库：`design/星座百科原型.dc.html`。
3. 让 Claude Code 把它当**视觉真源**（结构、布局、配色取值、组件层级都从这里抠）。

首条提示词：
```
读取 design/星座百科原型.dc.html 和 docs/03_Claude_Design_页面设计提示词.md。
这是本项目的视觉真源与设计系统。请先只做一件事：输出一份「原型→组件」拆解清单——
列出原型里出现的页面、可复用组件（尤其是六维能量罗盘 EnergyCompass）、设计令牌
（颜色/字号/间距的实际取值），以及它们与设计系统文档的对应关系。先不要写任何代码。
```

> 提示：`.dc.html` 可能较大，单独用一次会话/子代理做这步拆解（见第 4 节），把结论沉淀进 `design/TOKENS.md`，后续别再整文件重读。

---

## 2. 记忆策略（内存记忆）

Claude Code 有**两套记忆**，每次会话开始都会加载：
- **CLAUDE.md**：你写的持久指令（约定、命令、"永远要做 X"）。根目录的会在 `/compact` 后从磁盘重新注入，所以**该长期生效的规则一定写进它**，而不是只在对话里说。
- **自动记忆**：Claude 根据你的纠正/偏好自行记录的笔记。让它帮你积累"这个项目踩过的坑"。

### 2.1 根目录 `CLAUDE.md`（直接用，控制在 ~200 行内）
```md
# 星座百科 / Astro Persona

全球中英双语星座性格分析站。Jamstack：SSG 优先 + 客户端纯函数运算 + 预留边缘函数。
权威事实见 docs/：01 需求、02 技术设计、03 设计系统。视觉真源：design/星座百科原型.dc.html。

## 命令
- 开发：pnpm dev
- 类型检查：pnpm typecheck
- 单测：pnpm test
- 静态产出：pnpm generate
- 提交前必跑：pnpm lint && pnpm typecheck && pnpm test

## 架构铁律
- src/core/* 必须是纯函数，无框架依赖，所有参数来自 content/config/，必须有 Vitest 单测。
- 内容/文案/权重一律放 content/*，禁止在组件里硬编码展示文案或星座数据。
- 双语文案按稳定 id 对齐；算法只认 id，与语言无关。
- 文案统一经 src/narrative 的 NarrativeProvider 产出；本期只启用 TemplateNarrativeProvider。
- 不引入后端、不把任何密钥放进前端；结果状态编码进 URL 以复现。
- 修改 src/core/* 后，必须同步更新/通过 tests/，并复核异变率仍在 15%–30%。

## 约定
- TypeScript strict；2 空格缩进；组件用 <script setup lang="ts">。
- 提交信息用祈使句、范围前缀（feat/fix/refactor: ...）。
- 新增星座维度/题目权重时，先改 content schema 与类型，再改实现。

## Compact Instructions（压缩时务必保留）
- 保留：当前所处开发阶段、刚改过的 core 算法与其参数、未通过的测试、待办。
- 可丢弃：已读完的大文件原文、已完成阶段的中间讨论。
```

### 2.2 路径作用域（嵌套 CLAUDE.md，按需加载、不污染根文件）
在子目录放小而专的规则，仅当 Claude 读到该目录文件时加载：
- `src/core/CLAUDE.md`：
  ```
  本目录只放纯函数。禁止 import 任何 Vue/Nuxt/DOM。每个导出函数都要有对应 *.test.ts。
  改动公式时，先看 docs/02 第 5 节的默认参数与校准要求，再动手。
  ```
- `content/CLAUDE.md`：
  ```
  本目录是数据与文案，不是代码。zh/en 必须成对、按 id 对齐。
  改 weights.json / compat-matrix.json 属于"调参"，改完要让 core 的校准用例回归。
  ```

### 2.3 自动记忆约定（写进根 CLAUDE.md 的一行即可）
```
当我纠正你某个本项目专属的做法（如某个调参方向、某个 i18n 坑），把结论记进自动记忆，
下次别再犯。但项目级长期规则应由我手动写进 CLAUDE.md，而非只存自动记忆。
```

---

## 3. 推荐 Skill

Skill 是**按需加载**的可复用工作流（注意：Skill 列表是压缩后唯一不自动重载的启动内容，所以触发它的提示词要明确）。为本项目建三个，放 `.claude/skills/`：

### 3.1 `design-to-page`（按原型实现一个页面）
`.claude/skills/design-to-page/SKILL.md`
```md
---
name: design-to-page
description: 当需要把 Claude Design 原型(design/星座百科原型.dc.html)中的某个页面或组件实现为 Nuxt/Vue 时使用。负责对照设计令牌、双语 i18n 约定与签名组件 EnergyCompass，产出符合架构铁律的 .vue 文件。当用户说"实现首页/结果页/某组件""按原型做这一页"时触发。
---

# 从原型到页面

1. 只读取 design/星座百科原型.dc.html 中**目标页面对应的片段**与 design/TOKENS.md，不要整文件重读。
2. 复用既有组件（优先 EnergyCompass、QuestionCard、ResultCard），缺失才新建。
3. 所有展示文案走 i18n（content/copy 或 locales），禁止硬编码中文/英文字符串。
4. 颜色/字号/间距一律引用设计令牌变量，不要写魔法值。
5. 交付后给出：新增/改动文件清单、用到的 token、待补的 i18n key。
6. 不在页面里写业务算法；调用 src/core 与 src/narrative。
```

### 3.2 `quiz-question`（新增/校验一道测试题）
`.claude/skills/quiz-question/SKILL.md`
```md
---
name: quiz-question
description: 当需要新增、修改或校验性格测试题目时使用。确保题目符合 Question schema、中英成对、各选项对六维(fire/earth/air/water/expr/order)的权重合理，并在改动后提示重跑校准。当用户说"加一道题""检查题库权重""这题考察哪个维度"时触发。
---

# 题库维护

1. 按 docs/02 的 Question/QuestionOption schema 写入 content/questions/{zh,en}.json，id 对齐。
2. 情境化表述，避免直白自评；每个选项标注其对各维度的权重，且权重要能区分维度。
3. 改完提醒：题量/权重变化会影响归一化与异变率 → 让 src/core 的校准用例回归。
4. 输出该题"考察哪些维度、为何这样配权重"的一句话说明。
```

### 3.3 `calibrate`（调参与校准）
```md
---
name: calibrate
description: 当需要调整匹配权重、年龄 α、异变阈值并验证整体异变率/排序是否合理时使用。当用户说"异变率太高/太低""调匹配权重""校准一下"时触发。
---
# 校准
1. 只改 content/config/*.json，不改 src/core 逻辑。
2. 跑 tests/ 中的校准用例，确认异变率落在 15%–30%、匹配排序符合预期方向。
3. 报告改了哪些参数、前后指标对比。
```

### 3.4 分工口诀
- **每次都要遵守的规则** → CLAUDE.md。
- **特定多步流程，按需触发** → Skill。
- **冗长的检索/大文件阅读** → 子代理（见下）。

---

## 4. 上下文压缩方式

### 4.1 一阶段一会话
按第 5 节的阶段切分，**每个阶段开一个聚焦会话**，做完就 `/clear` 或新开。不要在一个长会话里从脚手架干到部署——上下文会被工具输出（文件读取、测试日志）撑爆，质量下降。

### 4.2 命令时机
- `/context`：怀疑上下文被占满时，看什么在吃 token（工具输出通常是大头）。
- `/compact`：**主动用**，别等它自动压。在一个阶段内做了大量文件读取/调试后、准备进入下一小步前压一次。根 CLAUDE.md 的 Compact Instructions 决定压缩保留什么（见 2.1）。
- `/memory`：规则没被遵守时，查当前加载了哪些指令文件、顺序如何。
- `/cost`：看本会话 token 消耗，判断是否该切会话。
- `claude -c`：续上一会话而非从零开始，保上下文。

### 4.3 用子代理吸收冗长检索
让子代理在**独立上下文**里做"读大文件 / 探索代码库 / 依赖排查"这类啰嗦活，只把结论带回主线程，避免主上下文被中间过程污染。典型用法：
```
用子代理读 design/星座百科原型.dc.html 全文，只返回结果页相关的结构与令牌清单，
其余别带回来。
```

### 4.4 其它习惯
- **引用路径而非粘贴内容**：让它用 Read 工具读 `docs/02_技术设计文档.md` 第 5 节，而不是把公式贴进对话。
- **结论沉淀成文件**：把原型拆解写进 `design/TOKENS.md`、把决策写进 CLAUDE.md，下次直接读，不重算。
- **Checkpoint 注意**：编辑工具的改动可回滚，但 Bash 里的 `rm/mv/cp` 不在 checkpoint 范围——危险文件操作前自己确认。

### 4.5 速查
| 场景 | 动作 |
|---|---|
| 长期规则 | 写进 CLAUDE.md |
| 特定多步流程 | 做成 Skill 触发 |
| 读大文件/查代码库 | 派子代理 |
| 上下文变重 | /context → /compact |
| 换主题/换阶段 | /clear 或新会话 |
| 规则失效 | /memory 排查 |

---

## 5. 分阶段开发提示词（按原型逐步实现，可直接粘贴）

> 每段开头默认你已在新的聚焦会话里。涉及算法的阶段，务必让它**先读 docs/02 对应小节**再写。

### Phase 0 · 脚手架与记忆
```
初始化一个 Nuxt 3 + TypeScript(strict) 项目，包管理用 pnpm。装 @nuxtjs/i18n、Pinia、UnoCSS、Vitest。
按 docs/02_技术设计文档.md 第 3 节建立目录结构（content/ src/core src/narrative src/composables
src/components pages/ tests/）。把我提供的根 CLAUDE.md、src/core/CLAUDE.md、content/CLAUDE.md 写入。
配好 lint/typecheck/test 脚本。先不写业务逻辑，跑通 pnpm dev 与 pnpm test 空壳。
```

### Phase 1 · 数据与类型层
```
按 docs/02 第 4 节定义 src/core/types.ts（PersonalityVector、SignProfile、Question、Config、
ResultState 等）。在 content/ 下建好 signs/questions/copy/config 的 JSON 骨架与 zh/en 成对文件，
先放 2 个星座、3 道题、最小配置作为样例，确保 schema 能被类型校验。不要填满 12 星座——那是内容工作。
```

### Phase 2 · 核心算法 + 单测（最关键，慢慢来）
```
先读 docs/02 第 5 节的公式与默认参数。然后在 src/core 实现纯函数：
personality.ts(打分)、age.ts(年龄加权)、mutation.ts(异变)、matching.ts(匹配，含理想型与异变联动)。
严格遵守 src/core/CLAUDE.md：不依赖任何框架/DOM。同步写 Vitest 单测覆盖正常与边界，
并加一组"校准用例"：给定一批合成向量，断言异变率落在 15%–30%、匹配排序方向正确。全绿再停。
```

### Phase 3 · 文案 Provider
```
按 docs/02 第 8 节实现 src/narrative：NarrativeProvider 接口、TemplateNarrativeProvider（查 content/copy
拼装，本期唯一启用）、LLMNarrativeProvider（stub，构造时注入 fallback，本期直接降级到模板），
以及按 VITE_USE_LLM 切换的工厂。给 Template 实现写单测：同输入产出确定文案，中英各一套。
```

### Phase 4 · i18n 基建
```
配置 @nuxtjs/i18n：prefix 策略(/zh /en)、按 Accept-Language 预选并记忆偏好、输出 hreflang(zh/en/x-default)。
把 content/copy 接进 i18n。验收：同一结果在 /zh 与 /en 下文案自然且对齐，切换语言 URL 状态保留。
```

### Phase 5 · 签名组件 EnergyCompass + 设计令牌
```
触发 design-to-page skill。先把 design/TOKENS.md 落地为 UnoCSS 主题/CSS 变量（夜墨/星金/四象色、
中英衬线+等宽字体）。再实现 EnergyCompass：SVG 六维星图雷达，输入一个 PersonalityVector 渲染发光多边形，
支持"叠放两个向量"(用户实线/对方虚线)以备结果页与匹配页复用。配 reduced-motion 降级。
```

### Phase 6 · 页面（按原型逐页，每页一个会话）
```
触发 design-to-page skill，按 design/星座百科原型.dc.html 实现【首页】。只读该页片段与 TOKENS。
复用 EnergyCompass，文案走 i18n，颜色走令牌。给出文件清单与待补 i18n key。
```
> 之后依次用同一模式做：星座百科列表+详情 → 测试问卷流程 → 测试结果页(含异变与分享卡占位) → 情感匹配输入页(含理想型) → 匹配结果页(双罗盘叠图)。**每页新开会话**，做完 /clear。

### Phase 7 · 分享与增长
```
按 docs/02 第 7 节实现：用 modern-screenshot 把离屏 ResultCard 组件转 PNG（客户端，无后端）；
Web Share API 优先、桌面退化为下载+复制链接；把 ResultState 紧凑序列化+base64url 编码进 URL，
打开链接能复现同一结果与语言。社交预览先用静态默认 OG 图（动态 OG 列为未来项，勿在本期引服务端）。
```

### Phase 8 · 部署
```
配置 Cloudflare Pages：构建命令 pnpm generate、产出目录、PR 预览部署。任何密钥都不进前端与仓库。
补 README 的本地开发与部署说明。最后跑一次 lint+typecheck+test 全绿。
```

---

## 6. 一页速查
- **记忆**：长期规则进根 CLAUDE.md（<200 行，会在 /compact 后重注入）；目录级规则进嵌套 CLAUDE.md；让 Claude 把你的纠正记进自动记忆。
- **Skill**：design-to-page / quiz-question / calibrate，按需触发；触发语要点名 skill 或其关键词。
- **压缩**：一阶段一会话；主动 /compact；/context 看占用；子代理吃大文件；引用路径不粘内容；结论沉淀成文件。
- **底线**：core 纯函数且有测试、文案外置双语、无密钥进前端、异变率 15%–30%。

> 参考（落地前以官网为准）：Claude Code 记忆 https://code.claude.com/docs/en/memory ；文档总览 https://docs.claude.com/en/docs/claude-code/overview
