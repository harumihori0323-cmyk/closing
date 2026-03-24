const { Router } = require("express");
const Anthropic = require("@anthropic-ai/sdk").default;
const { config } = require("../config");
const { validateBody, aiPrepareSchema, aiRespondSchema } = require("../middleware/validate");

const router = Router();
const anthropic = config.anthropicApiKey
  ? new Anthropic({ apiKey: config.anthropicApiKey })
  : null;

// APIキーチェックミドルウェア
function requireApiKey(req, res, next) {
  if (!anthropic) {
    return res.status(503).json({ error: "AI機能は現在利用できません。ANTHROPIC_API_KEYが設定されていません。" });
  }
  next();
}

// クロージング準備：話すべきポイント生成
router.post("/prepare", requireApiKey, validateBody(aiPrepareSchema), async (req, res, next) => {
  const { customer } = req.body;
  try {
    const message = await anthropic.messages.create({
      model: config.aiModel,
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `あなたはトップセールスのクロージング専門コンサルタントです。
以下の顧客情報に基づいて、クロージング商談で話すべきポイントを具体的に教えてください。

【顧客情報】
- 名前: ${customer.name}
- 会社名: ${customer.company}
- 業種: ${customer.industry}
- 役職: ${customer.position}
- 提案内容: ${customer.proposal}
- 見積金額: ${customer.budget}
- 顧客の課題: ${customer.challenges}
- 過去のやりとり: ${customer.history}
- 備考: ${customer.notes}

以下の形式で回答してください：
1. 【オープニング】最初に言うべきこと
2. 【キーポイント】必ず触れるべき3〜5つのポイント
3. 【想定される反論と切り返し】よくある反論とその対処法
4. 【クロージングトーク】契約を促す具体的なセリフ例
5. 【注意点】この顧客特有の注意すべき点`,
        },
      ],
    });
    res.json({ advice: message.content[0].text });
  } catch (error) {
    next(error);
  }
});

// リアルタイム応答支援：相手の発言に対する最適な返答生成
router.post("/respond", requireApiKey, validateBody(aiRespondSchema), async (req, res, next) => {
  const { customer, transcript, latestUtterance } = req.body;
  try {
    const message = await anthropic.messages.create({
      model: config.aiModel,
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `あなたはトップセールスのリアルタイムクロージングアドバイザーです。
商談中に相手が発言した内容に対して、契約成立に導くための最適な返答を提案してください。

【顧客情報】
- 名前: ${customer.name}
- 会社名: ${customer.company}
- 提案内容: ${customer.proposal}
- 見積金額: ${customer.budget}
- 顧客の課題: ${customer.challenges}

【これまでの会話】
${transcript}

【相手の最新の発言】
「${latestUtterance}」

以下の形式で簡潔に回答してください：
🎯 【推奨する返答】
そのまま言えるセリフを1〜3文で。

💡 【意図・戦略】
なぜこの返答が有効かを一言で。

⚠️ 【避けるべきこと】
この場面で言ってはいけないことを一言で。`,
        },
      ],
    });
    res.json({ response: message.content[0].text });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
