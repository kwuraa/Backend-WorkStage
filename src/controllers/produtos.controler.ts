import { Request, Response } from "express";
import { run, query, get } from "../db/db";
import db from "../db/db";
import { promisify } from "util";

const dbAll = promisify(db.all).bind(db);

export const createProduto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { nome, descricao, processos } = req.body;
    if (!nome) {
      res.status(400).json({ error: "Nome do produto é obrigatório" });
      return;
    }

    // Insere o produto
    const result = await run(
      `INSERT INTO produtos (nome, descricao) VALUES (?, ?)`,
      [nome, descricao || ""]
    );
    const produtoId = result.lastID;

    // Insere processos (se existirem)
    if (processos && processos.length) {
      for (const processo of processos) {
        await run(`INSERT INTO processos (produto_id, nome) VALUES (?, ?)`, [
          produtoId,
          processo.nome,
        ]);
      }
    }

    res.status(201).json({
      id: produtoId,
      nome,
      descricao: descricao || "",
      status: "pendente",
      processos: processos || [],
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar produto" });
  }
};

export const getProdutos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const produtos = await query(`SELECT * FROM produtos ORDER BY id DESC`);
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar produtos" });
  }
};

export const getProdutoById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const produto = await get(`SELECT * FROM produtos WHERE id = ?`, [
      req.params.id,
    ]);
    if (!produto) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }
    res.json(produto);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
};

export const updateProdutoStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ error: "Status é obrigatório" });
      return;
    }

    const result = await run(`UPDATE produtos SET status = ? WHERE id = ?`, [
      status,
      req.params.id,
    ]);

    if (result.changes === 0) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }
    res.json({ message: "Produto atualizado" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
};

export const deleteProduto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const result = await run(`DELETE FROM produtos WHERE id = ?`, [
      req.params.id,
    ]);

    if (result.changes === 0) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir produto" });
  }
};

const dbQuery = (sql: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const searchProdutos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Query recebida no backend:", req.query);

    const search: string | null = req.query.search
      ? req.query.search.toString().trim().toLowerCase()
      : null;

    if (!search) {
      res.status(400).json({ error: "Parâmetro de busca obrigatório" });
      return;
    }

    const sql = `SELECT id, nome, data_cadastro, status FROM produtos WHERE LOWER(nome) LIKE ?`;
    const params = [`%${search}%`];

    console.log("Executando SQL:", sql, params);

    const rows: any[] = await dbQuery(sql, params);

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(404).json({ message: "Nenhum item encontrado" });
      return;
    }

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar itens:", error);
    res.status(500).json({ error: "Erro ao buscar itens" });
  }
};
