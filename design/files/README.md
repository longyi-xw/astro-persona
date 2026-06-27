# content / 内容数据说明

本目录是**版本化、语言无关核心数据 + 双语展示文案分离**的内容层，供 `src/core/*` 纯函数消费。算法只认 `id`，与语言无关。

## 目录结构
```
content/
├─ signs/
│  ├─ profiles.json   # 语言无关：元素/三态/守护星/日期/六维基线向量(baseline)
│  ├─ zh.json         # 中文展示文案（name/tagline/summary/strengths…），按 id 对齐
│  └─ en.json         # 英文展示文案，按 id 对齐
└─ questions/
   ├─ items.json      # 语言无关：每题每选项对六维的权重
   ├─ zh.json         # 中文题面与选项文案，按 id 对齐
   └─ en.json         # 英文题面与选项文案，按 id 对齐
```
校验与派生量工具见 `src/core/content.schema.ts`（Zod schema + `validateContent` + `computeMaxScores` + `computeNeutral`）。

## 六个维度
| 维度 | 含义 | 类型 |
|---|---|---|
| fire | 行动力 / 热情 / 外驱 | 元素能量 0~1 |
| earth | 务实 / 秩序 / 稳定 | 元素能量 0~1 |
| air | 思辨 / 社交 / 求新 | 元素能量 0~1 |
| water | 情感 / 直觉 / 共情 | 元素能量 0~1 |
| expr | 内显(0) ↔ 外显(1) | 极性轴 |
| order | 混沌(0) ↔ 守序(1) | 极性轴 |

## 星座基线向量（baseline）
- 由四象 + 三态 + 守护星的**市场共识**调出，并保证**同元素三个星座彼此可区分**（如三个火象：白羊冲动低秩序、狮子稳定高外显、射手自由高求新）。
- 极性轴编码：cardinal/fixed/mutable 与内外向倾向共同决定 `expr`、`order`。
- 这些是"典型值"，是异变检测要对比的标准，可在 `profiles.json` 直接调参，无需改代码。

## 题库与打分
- **打分**：`raw[d] = Σ(选中选项 weights[d])`。
- **归一化**：`v[d] = raw[d] / maxScores[d]`，`maxScores[d]` 为各题中该维最大可得权重之和。
- **极性轴**：表达型/守序型选项带正权重；内省型/随性型选项不带该维权重（以缺省表示低分），改为承载其它维度——所以一个总选"内省/随性"的人，`expr`、`order` 自然趋近 0。

**maxScores 校验值**（由当前 16 题 `items.json` 算得，加载时应用 `computeMaxScores` 重算并断言一致，防止改题漂移）：
```
{ fire: 17, earth: 18, air: 17, water: 14, expr: 11, order: 23 }
```

**算路示例**（全选 a）：
```
raw  = { fire:17, earth:0,  air:11, water:7,  expr:11, order:0 }
v    = { fire:1.00, earth:0, air:0.65, water:0.50, expr:1.00, order:0 }  // 极端火象/外显/随性
```
对照全选 b：`v = { fire:0, earth:1.00, air:0.35, water:0.29, expr:0, order:1.00 }`（极端土象/守序/内省）。两个极端正好把维度空间撑开，验证权重方向正确。

## 中性个体画像（B_neutral）
年龄加权（docs/02 第 5.2 节）需要"中性画像"作为衰减目标。它 = 12 星座 baseline 的逐维平均，用 `computeNeutral(profiles.signs)` 在加载时算出，参考值：
```
{ fire:0.53, earth:0.49, air:0.55, water:0.52, expr:0.58, order:0.53 }
```

## 与算法的衔接
- `personality.ts` 读 `items.json` + `maxScores` → 产出用户向量 `V_user`。
- `age.ts` 读 `profiles` 的 `baseline` 与 `neutral` → 产出年龄调整后基线 `B_eff`。
- `mutation.ts` 比较 `V_user` 与 `B_eff` → 异变判定（注意校准异变率落在 15%–30%）。
- `matching.ts` 用各星座 `baseline` 作为"候选典型画像"参与相似/互补与理想型计算。

## 校验（建议加进 tests/）
```ts
import { validateContent, computeMaxScores } from '../src/core/content.schema';
import profiles from '../content/signs/profiles.json';
import signZh from '../content/signs/zh.json';
import signEn from '../content/signs/en.json';
import items from '../content/questions/items.json';
import qZh from '../content/questions/zh.json';
import qEn from '../content/questions/en.json';

const data = validateContent({ profiles, signZh, signEn, items, qZh, qEn });
// 断言 zh/en 与核心 id 完全对齐（validateContent 内部已校验，失败会抛错）
// 断言归一化分母与预期一致：
expect(data.maxScores).toEqual({ fire:17, earth:18, air:17, water:14, expr:11, order:23 });
```

## 扩展指引
- **题量**：当前 16 题已覆盖六维；要做"完整 20 题 / 快测 12 题"，按同结构增删，`maxScores` 会自动重算。`expr` 覆盖相对略少，扩题时可优先补该维。
- **还缺的内容层**：`content/copy/{zh,en}.json`（原型名/关键词/异变激励语/匹配解释模板）与 `content/config/{weights.json,compat-matrix.json}`（年龄 α、异变阈值、匹配权重、12×12 元素相性）尚未生成——这是让结果页文案与匹配真正跑起来的下一步。
- **调参属于"内容"不属于"代码"**：改 baseline / 权重 / 阈值后，让 `src/core` 的校准用例回归即可。

> 免责：星座描述为市场共识、娱乐用途，非科学结论。
