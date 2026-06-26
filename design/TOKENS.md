# 星座百科 · 设计令牌与原型拆解 (TOKENS)

> 由 `prototype/untitled/project/星座百科原型.dc.html` 与 `EnergyCompass.dc.html` 拆解而来。
> **这是工程实现的视觉真源摘要**。后续阶段读本文件，不要再整文件重读 `.dc.html`。
> 取值均为原型实测值。

---

## 1. 颜色令牌

### 1.1 基底与强调

| 令牌 | 名称 | 值 | 用途 |
|---|---|---|---|
| `--ink` | 夜墨 Midnight Ink | `#0E1530` | 主背景（深蓝黑，非纯黑） |
| `--space` | 深空 Deep Space | `#1B2452` | 卡片/分区背景（多以 `rgba(27,36,82,.5~.6)` 出现） |
| `--bone` | 骨白 Bone | `#F4EFE6` | 深色上的主文字 |
| `--gold` | 星金 Star Gold | `#C9A24B` | 唯一金属强调色：CTA、签名、描边。克制使用 |

### 1.2 四象色（仅用于罗盘 / 维度标签 / 数据）

| 令牌 | 维度 | 值 |
|---|---|---|
| `--fire` 火 Ember | fire | `#E2683C` |
| `--earth` 土 Sage | earth | `#8A9A5B` |
| `--air` 风 Mist | air | `#9FC1D4` |
| `--water` 水 Tide | water | `#2E7C8A` |

极性轴 `expr`(内显↔外显) 与 `order`(混沌↔守序) 用 `--gold` 作为轴色。

### 1.3 文字层级灰阶（蓝灰系，原型实测）

| 用途 | 值 |
|---|---|
| 主文字 | `#F4EFE6` (bone) |
| 正文亮 | `#cfd4ea` |
| 正文/次要 | `#9aa3cc` |
| 弱化标签 | `#8b95c4` / `#8089b0` |
| 更弱（占位、注脚） | `#7e88b4` / `#6b76a8` |
| 金色副标题（衬线斜体） | `#cdbf9e` / `#d7ccae` |

### 1.4 四象浅色（标签/徽章文字，在深底上提亮）

火 `#F0B59A` · 土 `#B7C089` · 风 `#BBD4E2` · 水 `#7FC0CC` · 金 `#E2CB8C`

### 1.5 描边 / 分隔 / 背景透明度约定

- 金描边：`rgba(201,162,75,.12)`（分隔线）→ `.18`（面板边框）→ `.28~.5`（强调/选中）。
- 卡片底：`rgba(27,36,82,.5~.6)`。
- 四象色边框：`rgba(<象>,.28~.6)`，背景填充 `rgba(<象>,.10~.22)`。

---

## 2. 字体与排版

| 角色 | 字体 | 备注 |
|---|---|---|
| 拉丁标题 | **Cormorant Garamond** (500/600/700, 含 italic) | 副标题常用 *italic*；高对比文学衬线 |
| 中文标题 | **Noto Serif SC** (500/600/700) | 与拉丁衬线气质呼应 |
| 正文 | **Inter** + **Noto Sans SC** (400/500/600) | `font-family:'Inter','Noto Sans SC',sans-serif` |
| 数据/分数/标签 | **IBM Plex Mono** (400/500/600) | 诊断感；eyebrow、计数、得分、URL |
| 星座符号 | **Noto Sans Symbols 2** | `font-variant-emoji:text`；glyph 末尾加 `︎` 强制文本字形 |

Google Fonts 引入串（原型 `<helmet>`）：
```
Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600
&family=Noto+Serif+SC:wght@500;600;700
&family=Inter:wght@400;500;600
&family=Noto+Sans+SC:wght@400;500
&family=IBM+Plex+Mono:wght@400;500;600
&family=Noto+Sans+Symbols+2
```

**字号尺度（实测）**：hero h1 58 / hero sub 28(italic) / 详情标题 40 / 结果原型名 38 / 分享卡原型名 34–38 / 区块 h2 24–30 / 正文 13–16 / eyebrow·标签 11–13(mono, `letter-spacing:.14–.22em`, uppercase) / 得分 14–24(mono)。

排版手感：敢留白、字号敢大、eyebrow 用大字距等宽小标题。

---

## 3. 形状 / 阴影 / 效果

- **圆角**：面板 `24px`（分享卡 `26px`）；内卡 `12–18px`；按钮与 pill `999px`。
- **阴影**：面板 `0 40px 90px rgba(0,0,0,.5)`；结果/分享卡 `0 50px 110px rgba(0,0,0,.6)`。
- **星空背景**：在 `#0E1530` 上叠多层 `radial-gradient(1~1.5px ... at x% y%, rgba(...,.2~.4), transparent)` 形成稀疏星点；分享卡顶部再叠一层大半径四象色光晕 `radial-gradient(120% 80% at 50% 6%, rgba(<象>,.22~.30), transparent 55%)`。
- **罗盘外发光**：`filter:drop-shadow(0 0 30~42px rgba(201,162,75,.22~.3))`（按 accent 改色）。
- **动效**：克制——载入编排 / 滚动揭示 / 罗盘绘制；尊重 `prefers-reduced-motion`。

---

## 4. 签名组件 · EnergyCompass（六维能量罗盘）

来源：`EnergyCompass.dc.html`。**这是全站记忆点，须 1:1 还原。**

**Props**：
| prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `vector` | `{fire,earth,air,water,expr,order}` 各 ∈[0,1] | 必填 | 用户/数据多边形 |
| `baseline` | 同上(可选) | `null` | 叠放的对照多边形（虚线，风色） |
| `size` | number | 320 | 像素边长 |
| `accent` | color | `#C9A24B` | 数据多边形主色（按四象切换） |
| `showLabels` | boolean | false | 是否显示 火土风水显序 标签 |

**几何**（务必照搬）：
- `cx=cy=size/2`；半径 `R = size*0.36`。
- 6 轴角度：`ang(i) = (-90 + i*60)°`，顺序 `['fire','earth','air','water','expr','order']`（火在正上方，顺时针）。
- 顶点：`at(val,i) = (cx + R*val*cos(ang), cy + R*val*sin(ang))`。
- 同心环 3 圈：`R*0.34, R*0.67, R`，金色 `stroke-opacity .14`。
- 轴线：金色 `stroke-opacity .20`。
- baseline 多边形：风色 `#9FC1D4`，`stroke-opacity .6`，**虚线** `dash = size*0.018`，`stroke-width = max(1, size*0.004)`。
- 数据多边形：`fill=accent opacity .16`，`stroke=accent`，`stroke-width = max(1.4, size*0.007)`，套 `compassGlow` 高斯模糊滤镜（`stdDeviation = size*0.008`）。
- 轴端节点圆点：半径 `max(2, size*0.013)`，颜色=该维四象色（expr/order 用金）。
- 中心核心点：半径 `max(1.5, size*0.01)`，accent 色，发光。
- 外圈柔光：`<circle r=R*1.05 fill=url(#compassVeil)>`，accent 径向渐变 .10→0。
- 标签（showLabels）：位于 `r*1.2` 处，文本 `火/土/风/水/显/序`，IBM Plex Mono，bone `.78`，`font-size = size*0.05`。

维度→轴色映射：`{fire:#E2683C, earth:#8A9A5B, air:#9FC1D4, water:#2E7C8A, expr:#C9A24B, order:#C9A24B}`。

**复用点**：hero(360)、异变预告(92,叠 baseline)、详情基线(230,showLabels)、生成中(260)、结果(330,叠 baseline,showLabels)、匹配结果双罗盘(200,叠 baseline)、分享卡(248)。

---

## 5. 页面清单（原型 12 帧）

| # | 页面 | 路由（建议） | 关键点 |
|---|---|---|---|
| 01 | 首页 Landing | `/[locale]` | hero 衬线大标题 + 360 罗盘；四象一览 4 卡；异变预告（叠 baseline 小罗盘）；底部免责声明 |
| 02 | 星座百科列表 | `/[locale]/signs` | 按四象分组的 12 卡，glyph+中英名+日期+关键词，左边四象色条 |
| 03 | 星座详情 | `/[locale]/signs/[sign]` | 头图档案标签(等宽)→性格速写→基线罗盘(230,showLabels)→爱情/事业两栏→相性 高/中/低→CTA 测一测 |
| 04 | 测试·开始前 | `/[locale]/test` (intro) | 年龄段 pill（<18/18–25/26–35/36–45/46+）+ 题量(快测~12/完整~20)，"不问精确生日" |
| 05 | 测试·答题 | `/[locale]/test` (run) | 顶部进度条+`第 n/N 题`(等宽)；衬线题面；A/B 选项卡，选中金描边；上一题 |
| 06 | 生成中 | 过渡态 | 260 罗盘绘制 + "正在生成你的能量画像 / Reading your chart…" |
| 07 | 测试结果 ★ | `/[locale]/result?s=...` | **高光页**：330 罗盘(叠 baseline)+原型名(衬线大字)+异变徽章；六维得分(等宽条形)；关键词标签；异变文案块；CTA 看匹配/保存卡 |
| 08 | 情感匹配·输入 | `/[locale]/match` (input) | 说明 + 理想型开关；开启后 3 组对照滑块(冒险/外放/感性，四象色)；开始匹配 |
| 09 | 匹配结果 | `/[locale]/match` (result) | 双罗盘叠图(用户实线/对方虚线,200)+图例；Top3 卡(glyph+中英+匹配%等宽大字+"为什么合"+相似/互补标签)；异变说明条；分享/重测 |
| 10–12 | 分享卡 火/水/土 | 离屏组件 | 竖版 380×660：顶 brand+glyph；248 罗盘；异变徽章；原型名(衬线,底部象色描边)；3 关键词；底部 slogan + `astropersona.app` |

---

## 6. 样例数据（原型脚本内联，用作开发夹具 / 校准锚点）

```js
// 六维向量样例
userVector   = { fire:.86, earth:.32, air:.66, water:.28, expr:.74, order:.38 } // 炽焰先锋/Ember Vanguard, 显异
ariesBaseline= { fire:.80, earth:.46, air:.54, water:.36, expr:.66, order:.52 }
matchVector  = { fire:.70, earth:.30, air:.80, water:.42, expr:.62, order:.30 }
heroVector   = { fire:.78, earth:.50, air:.62, water:.44, expr:.60, order:.50 }
teaserVector = { fire:.92, earth:.20, air:.72, water:.24, expr:.84, order:.30 }
card2Vector  = { fire:.30, earth:.40, air:.45, water:.86, expr:.34, order:.56 } // 潮汐织梦者/Tide Weaver, 微异 (Pisces 水)
card3Vector  = { fire:.34, earth:.84, air:.40, water:.50, expr:.28, order:.82 } // 磐石筑梦人/Bedrock Builder, 典型 (Capricorn 土)
```

**结果页六维得分排序**（= userVector×100，降序展示，标注主导/缺失）：
火86 主导 · 显74 · 风66 · 序38 · 土32 · 水28 缺失。

**匹配样例（异变用户，已弱化星座）**：射手 88%(相似·火/互补·序) · 水瓶 81%(互补·风/相似·显) · 狮子 76%(相似·火/注意·序)。

**异变分档徽章**：微异 Minor Drift · 显异 Marked Drift · 极异（极端）；典型 True to sign（未异变）。

---

## 7. 十二星座静态数据（来自原型列表）

glyph 均追加 `︎`。元素/三态为占星通识。

| id | glyph | 中 | en | 日期 | 关键词(zh·en) | 元素 | 三态 |
|---|---|---|---|---|---|---|---|
| aries | ♈ ♈ | 白羊座 | Aries | 03.21–04.19 | 莽撞先行 · Headstrong | fire | cardinal |
| taurus | ♉ ♉ | 金牛座 | Taurus | 04.20–05.20 | 稳如磐石 · Grounded | earth | fixed |
| gemini | ♊ ♊ | 双子座 | Gemini | 05.21–06.20 | 思维跳跃 · Quicksilver | air | mutable |
| cancer | ♋ ♋ | 巨蟹座 | Cancer | 06.21–07.22 | 柔软铠甲 · Tender | water | cardinal |
| leo | ♌ ♌ | 狮子座 | Leo | 07.23–08.22 | 天生主角 · Radiant | fire | fixed |
| virgo | ♍ ♍ | 处女座 | Virgo | 08.23–09.22 | 精确之眼 · Precise | earth | mutable |
| libra | ♎ ♎ | 天秤座 | Libra | 09.23–10.22 | 权衡之美 · Poised | air | cardinal |
| scorpio | ♏ ♏ | 天蝎座 | Scorpio | 10.23–11.21 | 深海引力 · Intense | water | fixed |
| sagittarius | ♐ ♐ | 射手座 | Sagittarius | 11.22–12.21 | 远方信徒 · Seeker | fire | mutable |
| capricorn | ♑ ♑ | 摩羯座 | Capricorn | 12.22–01.19 | 长期主义 · Enduring | earth | cardinal |
| aquarius | ♒ ♒ | 水瓶座 | Aquarius | 01.20–02.18 | 未来来客 · Maverick | air | fixed |
| pisces | ♓ ♓ | 双鱼座 | Pisces | 02.19–03.20 | 潮汐织梦 · Dreaming | water | mutable |

守护星（详情页档案用）：aries→火星 Mars。其余按通识补全（taurus/libra→金星, gemini/virgo→水星, cancer→月亮, leo→太阳, scorpio→冥王/火星, sagittarius→木星, capricorn→土星, aquarius→天王/土星, pisces→海王/木星）。

---

## 8. UI 文案锚点（双语，原型实测，供 i18n 起稿）

- Hero：`星座是起点，不是终点。` / `Your sign is a starting point, not a verdict.`；副：`测一测你被星座框住了多少。` / `Find out how far you've drifted from it.`
- CTA：`开始性格测试 · Take the test` / `浏览十二星座 · Explore the 12 signs`
- 异变激励：`你已经走出了星座给的剧本。这一切，都是你一路经历换来的。` / `You've outgrown the script your sign handed you—every bit of it earned on the way here.`
- 免责声明：`娱乐与自我探索用途，非科学结论 · For entertainment and self-reflection, not scientific advice.`
- 匹配异变说明：`你是异变体，已为你弱化星座、强化真实人格来匹配。` / `We weighted your real personality over your sign.`
- 分享卡 slogan：`星座是起点，不是终点` · 站点 `astropersona.app`
