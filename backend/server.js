const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk").default;
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const DATA_FILE = path.join(__dirname, "customers.json");

// --- 顧客データ管理 ---

function loadCustomers() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function saveCustomers(customers) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(customers, null, 2), "utf-8");
}

// 顧客一覧取得
app.get("/api/customers", (req, res) => {
  res.json(loadCustomers());
});

// 顧客登録
app.post("/api/customers", (req, res) => {
  const customers = loadCustomers();
  const customer = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  customers.push(customer);
  saveCustomers(customers);
  res.json(customer);
});

// 顧客更新
app.put("/api/customers/:id", (req, res) => {
  const customers = loadCustomers();
  const idx = customers.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "顧客が見つかりません" });
  customers[idx] = { ...customers[idx], ...req.body };
  saveCustomers(customers);
  res.json(customers[idx]);
});

// 顧客削除
app.delete("/api/customers/:id", (req, res) => {
  let customers = loadCustomers();
  customers = customers.filter((c) => c.id !== req.params.id);
  saveCustomers(customers);
  res.json({ success: true });
});

// --- AI連携 ---

// クロージング準備：話すべきポイント生成
app.post("/api/ai/prepare", async (req, res) => {
  const { customer } = req.body;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
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
    console.error("AI prepare error:", error);
    res.status(500).json({ error: "AI応答の生成に失敗しました" });
  }
});

// リアルタイム応答支援：相手の発言に対する最適な返答生成
app.post("/api/ai/respond", async (req, res) => {
  const { customer, transcript, latestUtterance } = req.body;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
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
    console.error("AI respond error:", error);
    res.status(500).json({ error: "AI応答の生成に失敗しました" });
  }
});

// 本番環境ではフロントエンドの静的ファイルを配信
const distPath = path.join(__dirname, "../frontend/dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
