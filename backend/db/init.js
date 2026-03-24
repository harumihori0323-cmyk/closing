const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
const { config } = require("../config");

let db;

function getDb() {
  if (db) return db;

  db = new Database(config.dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // テーブル作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company TEXT NOT NULL DEFAULT '',
      industry TEXT DEFAULT '',
      position TEXT DEFAULT '',
      proposal TEXT DEFAULT '',
      budget TEXT DEFAULT '',
      challenges TEXT DEFAULT '',
      history TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return db;
}

// 既存のcustomers.jsonからデータを移行
function migrateFromJson() {
  const jsonPath = path.join(__dirname, "..", "customers.json");
  if (!fs.existsSync(jsonPath)) return 0;

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  if (!Array.isArray(data) || data.length === 0) return 0;

  const database = getDb();
  const existing = database.prepare("SELECT COUNT(*) as count FROM customers").get();
  if (existing.count > 0) return 0; // 既にデータがある場合はスキップ

  const insert = database.prepare(`
    INSERT OR IGNORE INTO customers (id, name, company, industry, position, proposal, budget, challenges, history, notes, created_at)
    VALUES (@id, @name, @company, @industry, @position, @proposal, @budget, @challenges, @history, @notes, @createdAt)
  `);

  const insertMany = database.transaction((customers) => {
    for (const c of customers) {
      insert.run({
        id: c.id,
        name: c.name || "",
        company: c.company || "",
        industry: c.industry || "",
        position: c.position || "",
        proposal: c.proposal || "",
        budget: c.budget || "",
        challenges: c.challenges || "",
        history: c.history || "",
        notes: c.notes || "",
        createdAt: c.createdAt || new Date().toISOString(),
      });
    }
    return customers.length;
  });

  return insertMany(data);
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, migrateFromJson, closeDb };
