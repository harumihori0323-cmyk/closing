const { getDb } = require("./init");

// SQLiteのカラム名(snake_case)をAPI側(camelCase)に変換
function toApiFormat(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    industry: row.industry,
    position: row.position,
    proposal: row.proposal,
    budget: row.budget,
    challenges: row.challenges,
    history: row.history,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function findAll() {
  const rows = getDb().prepare("SELECT * FROM customers ORDER BY created_at DESC").all();
  return rows.map(toApiFormat);
}

function findById(id) {
  const row = getDb().prepare("SELECT * FROM customers WHERE id = ?").get(id);
  return toApiFormat(row);
}

function create(data) {
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();

  getDb()
    .prepare(
      `INSERT INTO customers (id, name, company, industry, position, proposal, budget, challenges, history, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(id, data.name, data.company || "", data.industry || "", data.position || "", data.proposal || "", data.budget || "", data.challenges || "", data.history || "", data.notes || "", createdAt);

  return findById(id);
}

function update(id, data) {
  const existing = findById(id);
  if (!existing) return null;

  const fields = ["name", "company", "industry", "position", "proposal", "budget", "challenges", "history", "notes"];
  const updates = [];
  const values = [];

  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(data[field]);
    }
  }

  if (updates.length > 0) {
    values.push(id);
    getDb()
      .prepare(`UPDATE customers SET ${updates.join(", ")} WHERE id = ?`)
      .run(...values);
  }

  return findById(id);
}

function remove(id) {
  const result = getDb().prepare("DELETE FROM customers WHERE id = ?").run(id);
  return result.changes > 0;
}

module.exports = { findAll, findById, create, update, remove };
