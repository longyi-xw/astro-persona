本目录是数据与文案，不是代码。zh/en 必须成对、按 id 对齐。
- signs/{zh,en}.json：12 星座展示文案（按 id 对齐）；基线向量在 signs/baselines.json（与语言无关）。
- questions/{zh,en}.json：题面/选项文案（按 id 对齐）；选项维度权重在 questions/weights.json（与语言无关）。
- copy/{zh,en}.json：原型名/关键词/异变激励语/匹配解释模板，供 TemplateNarrativeProvider 查表。
- config/weights.json：年龄→α、异变阈值、匹配权重。config/compat-matrix.json：12×12 元素相性（由 scripts/gen-compat.mjs 生成）。
改 weights.json / compat-matrix.json 属于"调参"，改完要让 core 的校准用例回归（pnpm test）。
新增题目或维度：先改 types 与 schema，再改数据，zh/en 与 weights 三处同步。
