# Changelog

## v2 — 接入完整数据 (data integration)

接续 v1 的最小样例壳，把完整内容数据真正接进算法跑通端到端（design/05）。

- **数据**：12 星座共识基线 + 16 题题库（双语，按 id 对齐）；新增 `content/config/weights.json`（年龄 α 断点 / 异变阈值 / 匹配权重）与脚本生成的 12×12 `compat-matrix.json`（按星座距离：同象 .85、六分 .75、对宫 .60、刑克 .45、同座 .70）。
- **校验**：引入 `zod`；`src/core/content.schema.ts` 校验全部内容/配置 + zh/en id 对齐 + 矩阵对称；**`src/content/index.ts` 成为唯一数据入口**（启动校验一次，缓存 `maxScores`/`neutral`，强类型 getter）。组件与 `src/core` 不再直接 import JSON。
- **算法去样例化**：`personality` 改用 `raw/maxScores` 归一化（非负权重，极性轴以缺省表示低分）；`age` 用断点求 α；`matching` 用注入的相性矩阵 + `config.match.personality` 的相似/互补维。
- **重新校准**：真实数据下异变率重测，`tauBase 0.36 / beta 0.16` → 总异变率 ~19%（各年龄段 16→25%，单调）。回归锁：`maxScores {17,18,17,14,11,23}`、`neutral {.53,.49,.55,.52,.58,.53}`。
- **页面**：星座百科列表/详情接新展示字段（tagline/summary/strengths/weaknesses/love/career/keywords）；测试流程改 16 题；匹配页用真实基线+矩阵+权重跑分。
- **文案库**：`content/copy/{zh,en}.json` —— 17 条原型名（按 top-1/top-2 主导维，原创、无 MBTI）、六维高/低关键词、**多变体异变激励语**（由向量确定性选取：同结果稳定、跨人多变；调性=冷峻诊断仪 × 燃 × 宿命）、匹配解释模板。接入 `TemplateNarrativeProvider`，结果页与匹配页文案改由 Provider 产出。
- **测试**：59 个用例（算法 + 校准 + 内容校验 + 文案 + 端到端 + 组件 + 编解码）。

## v1 — 脚手架与最小壳 (scaffold)

Nuxt 3 + TS(strict) Jamstack 站；纯函数 core + Vitest；EnergyCompass 签名组件；i18n（/zh /en + hreflang）；结果 URL 编码复现；分享卡（modern-screenshot）；Cloudflare Workers 静态部署。
