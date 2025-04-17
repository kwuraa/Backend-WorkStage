import { Request, Response } from "express";
import { run, query, get } from "../db/db";
import db from "../db/db";
import { promisify } from "util";
import { io } from "../server";

const dbAll = promisify(db.all).bind(db);

export const createProduto = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { nome, descricao, processos, tem_nf } = req.body;

    if (!nome) {
      res.status(400).json({ error: "Nome do produto é obrigatório" });
      return;
    }

    const result = await run(
      `INSERT INTO produtos (nome, descricao, tem_nf) VALUES (?, ?, ?)`,
      [nome, descricao || "", tem_nf === true ? 1 : 0]
    );

    const produtoId = result.lastID;

    const processosInseridos = [];
    if (Array.isArray(processos) && processos.length > 0) {
      for (const processo of processos) {
        if (processo && typeof processo === "object" && processo.nome) {
          await run(`INSERT INTO processos (produto_id, nome) VALUES (?, ?)`, [
            produtoId,
            processo.nome,
          ]);
          processosInseridos.push({ nome: processo.nome });
        }
      }
    }

    const novoProduto = {
      id: produtoId,
      nome,
      descricao: descricao || "",
      tem_nf: tem_nf === true,
      status: "pendente",
      data_cadastro: new Date().toISOString(),
      processos: processosInseridos,
    };

    io.emit("novo_produto", novoProduto);

    res.status(201).json(novoProduto);
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
};

export const updateProdutoNF = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { tem_nf } = req.body;

    if (typeof tem_nf !== "boolean") {
      res.status(400).json({ error: "Campo 'tem_nf' deve ser booleano" });
      return;
    }

    const result = await run(`UPDATE produtos SET tem_nf = ? WHERE id = ?`, [
      tem_nf ? 1 : 0,
      req.params.id,
    ]);

    if (result.changes === 0) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    res.json({ message: "Valor de NF atualizado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar valor de NF" });
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
