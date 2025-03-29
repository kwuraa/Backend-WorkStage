import sqlite3 from "sqlite3";
import { DATABASE_PATH } from "../config/config";

const sqlite3Verbose = sqlite3.verbose();
const db = new sqlite3Verbose.Database(DATABASE_PATH, (err) => {
  if (err) console.error("Erro ao conectar ao banco de dados:", err.message);
  else console.log("Conectado ao SQLite");
});

export const query = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const get = (sql: string, params: any[] = []): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const run = (
  sql: string,
  params: any[] = []
): Promise<{ lastID: number; changes: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: sqlite3.RunResult, err: Error | null) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pendente',
      data_cadastro TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS processos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      nome TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendente',
      FOREIGN KEY(produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    )`
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS historico_produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT NOT NULL,
      data_cadastro TEXT NOT NULL,
      data_finalizacao TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )`
  );
});

export default db;
