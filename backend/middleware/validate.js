const { z } = require("zod");

// 文字列フィールドのサニタイズ（HTMLタグ除去）
function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

// 顧客スキーマ
const customerSchema = z
  .object({
    name: z.string().min(1, "名前は必須です").max(100).transform(sanitize),
    company: z.string().max(100).transform(sanitize).default(""),
    industry: z.string().max(100).transform(sanitize).default(""),
    position: z.string().max(100).transform(sanitize).default(""),
    proposal: z.string().max(2000).transform(sanitize).default(""),
    budget: z.string().max(100).transform(sanitize).default(""),
    challenges: z.string().max(2000).transform(sanitize).default(""),
    history: z.string().max(5000).transform(sanitize).default(""),
    notes: z.string().max(2000).transform(sanitize).default(""),
  })
  .strict();

// 顧客更新スキーマ（全フィールド任意）
const customerUpdateSchema = customerSchema.partial();

// AI準備リクエストスキーマ
const aiPrepareSchema = z.object({
  customer: z.object({
    name: z.string(),
    company: z.string().optional().default(""),
    industry: z.string().optional().default(""),
    position: z.string().optional().default(""),
    proposal: z.string().optional().default(""),
    budget: z.string().optional().default(""),
    challenges: z.string().optional().default(""),
    history: z.string().optional().default(""),
    notes: z.string().optional().default(""),
  }),
});

// AIリアルタイム応答スキーマ
const aiRespondSchema = z.object({
  customer: z.object({
    name: z.string(),
    company: z.string().optional().default(""),
    proposal: z.string().optional().default(""),
    budget: z.string().optional().default(""),
    challenges: z.string().optional().default(""),
  }),
  transcript: z.string().max(50000),
  latestUtterance: z.string().min(1).max(5000),
});

// バリデーションミドルウェア生成
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const errors = issues.map((e) => ({
        field: (e.path || []).join("."),
        message: e.message,
      }));
      return res.status(400).json({ error: "バリデーションエラー", details: errors });
    }
    req.body = result.data;
    next();
  };
}

module.exports = {
  validateBody,
  customerSchema,
  customerUpdateSchema,
  aiPrepareSchema,
  aiRespondSchema,
};
