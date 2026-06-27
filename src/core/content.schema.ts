// content.schema.ts
// 星座百科 · 内容数据的 schema、类型与校验/派生工具。
// 放在 src/core/ 下；纯 TS，无框架/DOM 依赖。需安装 zod。
import { z } from 'zod';

/* ============================== 基础维度 ============================== */

export const DIMS = ['fire', 'earth', 'air', 'water', 'expr', 'order'] as const;
export type Dim = (typeof DIMS)[number];

export const ELEMENTS = ['fire', 'earth', 'air', 'water'] as const;
export type Element = (typeof ELEMENTS)[number];

export const MODALITIES = ['cardinal', 'fixed', 'mutable'] as const;
export type Modality = (typeof MODALITIES)[number];

/** 六维人格向量，每维 0~1 */
export const PersonalityVectorSchema = z.object({
  fire: z.number().min(0).max(1),
  earth: z.number().min(0).max(1),
  air: z.number().min(0).max(1),
  water: z.number().min(0).max(1),
  expr: z.number().min(0).max(1),
  order: z.number().min(0).max(1),
});
export type PersonalityVector = z.infer<typeof PersonalityVectorSchema>;

/* ============================== 星座 ============================== */

const MonthDay = z.tuple([z.number().int().min(1).max(12), z.number().int().min(1).max(31)]);

export const SignProfileSchema = z.object({
  id: z.string(),
  glyph: z.string(),
  element: z.enum(ELEMENTS),
  modality: z.enum(MODALITIES),
  rulingBody: z.string(),
  dateRange: z.object({ start: MonthDay, end: MonthDay }),
  baseline: PersonalityVectorSchema,
});
export type SignProfile = z.infer<typeof SignProfileSchema>;

export const SignProfilesFileSchema = z.object({
  version: z.string(),
  dimensions: z.array(z.enum(DIMS)),
  note: z.string().optional(),
  signs: z.array(SignProfileSchema).length(12),
});

export const SignContentSchema = z.object({
  name: z.string(),
  rulingBody: z.string(),
  tagline: z.string(),
  summary: z.string(),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  love: z.string(),
  career: z.string(),
  keywords: z.array(z.string()).min(1),
});
export type SignContent = z.infer<typeof SignContentSchema>;

export const SignLocaleFileSchema = z.object({
  version: z.string(),
  locale: z.string(),
  signs: z.record(z.string(), SignContentSchema),
});

/* ============================== 题库 ============================== */

export const QuestionItemSchema = z.object({
  id: z.string(),
  options: z
    .array(
      z.object({
        id: z.string(),
        // 非负权重；缺省维度视为 0（Zod v4：partialRecord 才允许枚举键缺省）
        weights: z.partialRecord(z.enum(DIMS), z.number().min(0)).refine(
          (w) => Object.keys(w).length > 0,
          { message: '每个选项至少要对一个维度有权重' },
        ),
      }),
    )
    .min(2),
});
export type QuestionItem = z.infer<typeof QuestionItemSchema>;

export const QuestionItemsFileSchema = z.object({
  version: z.string(),
  dimensions: z.array(z.enum(DIMS)),
  scale: z.object({ min: z.number(), max: z.number() }).passthrough(),
  questions: z.array(QuestionItemSchema).min(1),
});

export const QuestionLocaleFileSchema = z.object({
  version: z.string(),
  locale: z.string(),
  questions: z.record(
    z.string(),
    z.object({ prompt: z.string(), options: z.record(z.string(), z.string()) }),
  ),
});

/* ============================== 配置 ============================== */

export const MatchWeightsSchema = z.object({ w1: z.number(), w2: z.number(), w3: z.number() });
export type MatchWeights = z.infer<typeof MatchWeightsSchema>;

/** 年龄 α / 异变阈值 / 匹配权重（content/config/weights.json）。 */
export const ConfigSchema = z.object({
  age: z.object({
    breakpoints: z
      .array(z.object({ maxAge: z.number(), alpha: z.number().min(0).max(1) }))
      .min(1),
  }),
  mutation: z.object({
    tauBase: z.number().min(0).max(1),
    beta: z.number().min(0).max(1),
    levels: z.tuple([z.number().min(0), z.number().min(0)]),
  }),
  match: z.object({
    base: MatchWeightsSchema,
    withIdeal: MatchWeightsSchema,
    mutationMultiplier: z.number().min(0).max(1),
    personality: z.object({
      wSim: z.number(),
      wComp: z.number(),
      simDims: z.array(z.enum(DIMS)).min(1),
      compDims: z.array(z.enum(DIMS)).min(1),
    }),
  }),
});
export type Config = z.infer<typeof ConfigSchema>;

/** 12×12 元素相性矩阵（content/config/compat-matrix.json）。 */
export const CompatMatrixSchema = z.object({
  matrix: z.record(z.string(), z.record(z.string(), z.number().min(0).max(1))),
});
export type CompatMatrix = Record<string, Record<string, number>>;

/* ============================== 文案库 ============================== */

export const ArchetypeSchema = z.object({
  id: z.string(),
  primary: z.enum(DIMS),
  secondary: z.enum(DIMS).optional(),
  name: z.string(),
  blurb: z.string(),
});
export type Archetype = z.infer<typeof ArchetypeSchema>;

/** content/copy/{zh,en}.json — 原型名/关键词/异变激励语(多变体)/匹配解释模板。 */
export const CopyFileSchema = z.object({
  version: z.string(),
  locale: z.string(),
  dims: z.record(z.enum(DIMS), z.string()),
  archetypes: z.array(ArchetypeSchema).min(12),
  keywords: z.record(
    z.enum(DIMS),
    z.object({ high: z.array(z.string()).min(1), low: z.array(z.string()).min(1) }),
  ),
  mutationLabel: z.record(z.enum(['0', '1', '2', '3']), z.string()),
  mutation: z.object({
    typical: z.array(z.string()).min(1),
    micro: z.array(z.string()).min(1),
    notable: z.array(z.string()).min(1),
    extreme: z.array(z.string()).min(1),
  }),
  matchReasons: z.object({
    lead: z.string(),
    sameElement: z.string(),
    complement: z.string(),
    similar: z.string(),
    ideal: z.string(),
    base: z.string(),
    sep: z.string(),
  }),
  personality: z.string(),
  matchSummary: z.string(),
});
export type CopyFile = z.infer<typeof CopyFileSchema>;

/* ============================== 派生量 ============================== */

const zeroVec = (): Record<Dim, number> =>
  ({ fire: 0, earth: 0, air: 0, water: 0, expr: 0, order: 0 });

/** 各维理论最大可得分：逐题取选项中该维最大权重再求和。用于归一化，应在加载时重算。 */
export function computeMaxScores(items: QuestionItem[]): Record<Dim, number> {
  const max = zeroVec();
  for (const q of items) {
    for (const d of DIMS) {
      const best = Math.max(...q.options.map((o) => (o.weights as Record<string, number>)[d] ?? 0));
      max[d] += best;
    }
  }
  return max;
}

/** 中性个体画像 = 12 星座基线的逐维平均，供年龄加权时向其衰减。 */
export function computeNeutral(signs: SignProfile[]): PersonalityVector {
  const sum = zeroVec();
  for (const s of signs) for (const d of DIMS) sum[d] += s.baseline[d];
  const n = signs.length;
  return DIMS.reduce((acc, d) => ({ ...acc, [d]: +(sum[d] / n).toFixed(4) }), {} as PersonalityVector);
}

/* ============================== 跨文件完整性校验 ============================== */

export interface RawContent {
  profiles: unknown;
  signZh: unknown;
  signEn: unknown;
  items: unknown;
  qZh: unknown;
  qEn: unknown;
  config: unknown;
  compat: unknown;
  copyZh: unknown;
  copyEn: unknown;
}

/** 校验所有内容文件并断言 zh/en 与核心 id 完全对齐；失败即抛错。返回解析后的强类型数据。 */
export function validateContent(raw: RawContent) {
  const profiles = SignProfilesFileSchema.parse(raw.profiles);
  const signZh = SignLocaleFileSchema.parse(raw.signZh);
  const signEn = SignLocaleFileSchema.parse(raw.signEn);
  const items = QuestionItemsFileSchema.parse(raw.items);
  const qZh = QuestionLocaleFileSchema.parse(raw.qZh);
  const qEn = QuestionLocaleFileSchema.parse(raw.qEn);
  const config = ConfigSchema.parse(raw.config);
  const compat = CompatMatrixSchema.parse(raw.compat).matrix;
  const copyZh = CopyFileSchema.parse(raw.copyZh);
  const copyEn = CopyFileSchema.parse(raw.copyEn);

  const archetypeIds = (c: CopyFile) => c.archetypes.map((a) => a.id).slice().sort();
  if (JSON.stringify(archetypeIds(copyZh)) !== JSON.stringify(archetypeIds(copyEn)))
    throw new Error('copy archetypes 的 id 在 zh/en 不一致')

  const signIds = profiles.signs.map((s) => s.id).sort();
  for (const [label, file] of [['signs/zh', signZh], ['signs/en', signEn]] as const) {
    const ids = Object.keys(file.signs).sort();
    if (JSON.stringify(ids) !== JSON.stringify(signIds))
      throw new Error(`${label} 的星座 id 与 profiles 不一致`);
  }

  const qIds = items.questions.map((q) => q.id).sort();
  for (const [label, file] of [['questions/zh', qZh], ['questions/en', qEn]] as const) {
    const ids = Object.keys(file.questions).sort();
    if (JSON.stringify(ids) !== JSON.stringify(qIds))
      throw new Error(`${label} 的题目 id 与 items 不一致`);
    // 选项 id 对齐
    for (const q of items.questions) {
      const lq = file.questions[q.id];
      if (!lq) throw new Error(`${label} 缺少题目 ${q.id}`);
      const optIds = q.options.map((o) => o.id).sort();
      const locOptIds = Object.keys(lq.options).sort();
      if (JSON.stringify(optIds) !== JSON.stringify(locOptIds))
        throw new Error(`${label} 的 ${q.id} 选项 id 与 items 不一致`);
    }
  }

  // 相性矩阵：12×12 齐全、对称、取值域已由 schema 保证
  const rowIds = Object.keys(compat).sort();
  if (JSON.stringify(rowIds) !== JSON.stringify(signIds))
    throw new Error('compat-matrix 行 id 与 profiles 不一致');
  for (const a of signIds) {
    const rowA = compat[a];
    if (!rowA || JSON.stringify(Object.keys(rowA).sort()) !== JSON.stringify(signIds))
      throw new Error(`compat-matrix ${a} 列 id 不全`);
    for (const b of signIds) {
      const ab = rowA[b];
      const ba = compat[b]?.[a];
      if (ab === undefined || ba === undefined || Math.abs(ab - ba) > 1e-9)
        throw new Error(`compat-matrix 不对称: ${a},${b}`);
    }
  }

  return {
    profiles,
    signContent: { zh: signZh, en: signEn },
    items,
    questionContent: { zh: qZh, en: qEn },
    config,
    compat,
    copy: { zh: copyZh, en: copyEn },
    maxScores: computeMaxScores(items.questions),
    neutral: computeNeutral(profiles.signs),
  };
}
