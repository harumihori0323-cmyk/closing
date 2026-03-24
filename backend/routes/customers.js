const { Router } = require("express");
const customerDb = require("../db/customers");
const { validateBody, customerSchema, customerUpdateSchema } = require("../middleware/validate");

const router = Router();

// 顧客一覧取得
router.get("/", (req, res) => {
  res.json(customerDb.findAll());
});

// 顧客登録
router.post("/", validateBody(customerSchema), (req, res) => {
  const customer = customerDb.create(req.body);
  res.status(201).json(customer);
});

// 顧客更新
router.put("/:id", validateBody(customerUpdateSchema), (req, res) => {
  const customer = customerDb.update(req.params.id, req.body);
  if (!customer) {
    return res.status(404).json({ error: "顧客が見つかりません" });
  }
  res.json(customer);
});

// 顧客削除
router.delete("/:id", (req, res) => {
  const deleted = customerDb.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: "顧客が見つかりません" });
  }
  res.json({ success: true });
});

module.exports = router;
