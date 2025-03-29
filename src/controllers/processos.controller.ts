import { Request, Response } from "express";
import db from "../db/db"; // Certifique-se de que o módulo 'db' exporta os métodos necessários

export const createProcesso = (req: Request, res: Response): void => {
  const { produto_id, nome } = req.body;
  if (!produto_id || !nome) {
    res.status(400).json({ error: "Produto ID e Nome são obrigatórios" });
    return;
  }

  db.run(
    `INSERT INTO processos (produto_id, nome) VALUES (?, ?)`,
    [produto_id, nome],
    function (this: { lastID: number }, err: Error | null) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res
        .status(201)
        .json({ id: this.lastID, produto_id, nome, status: "pendente" });
    }
  );
};

export const getProcessosByProduto = (req: Request, res: Response): void => {
  db.all(
    `SELECT * FROM processos WHERE produto_id = ?`,
    [req.params.id],
    (err: Error | null, rows: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
};

export const updateProcesso = (req: Request, res: Response): void => {
  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: "Status é obrigatório" });
    return;
  }

  db.run(
    `UPDATE processos SET status = ? WHERE id = ?`,
    [status, req.params.id],
    function (this: { changes: number }, err: Error | null) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: "Processo não encontrado" });
        return;
      }
      res.json({ message: "Processo atualizado" });
    }
  );
};

export const deleteProcesso = (req: Request, res: Response): void => {
  db.run(
    `DELETE FROM processos WHERE id = ?`,
    [req.params.id],
    function (this: { changes: number }, err: Error | null) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: "Processo não encontrado" });
        return;
      }
      res.status(204).send();
    }
  );
};

export const concluirProcesso = (req: Request, res: Response): void => {
  const { id } = req.params;

  db.run(
    `UPDATE processos SET status = 'concluído' WHERE id = ?`,
    [id],
    function (this: { changes: number }, err: Error | null) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: "Processo não encontrado" });
        return;
      }

      // Recupera o produto relacionado ao processo
      db.get(
        `SELECT produto_id FROM processos WHERE id = ?`,
        [id],
        (err: Error | null, row: any) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          if (!row) {
            res.status(404).json({ error: "Produto não encontrado" });
            return;
          }

          const produtoId = row.produto_id;

          // Procura o próximo processo pendente
          db.get(
            `SELECT id FROM processos WHERE produto_id = ? AND status = 'pendente' ORDER BY id ASC LIMIT 1`,
            [produtoId],
            (err: Error | null, nextProcess: any) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }

              if (nextProcess) {
                db.run(
                  `UPDATE processos SET status = 'em andamento' WHERE id = ?`,
                  [nextProcess.id],
                  (err: Error | null) => {
                    if (err) {
                      res.status(500).json({ error: err.message });
                      return;
                    }
                    res.json({
                      message: "Processo concluído. Próxima etapa iniciada.",
                      nextProcessId: nextProcess.id,
                    });
                  }
                );
              } else {
                db.get(
                  `SELECT COUNT(*) AS pendentes FROM processos WHERE produto_id = ? AND status IN ('pendente', 'em andamento')`,
                  [produtoId],
                  (err: Error | null, result: any) => {
                    if (err) {
                      res.status(500).json({ error: err.message });
                      return;
                    }
                    if (result.pendentes === 0) {
                      db.run(
                        `UPDATE produtos SET status = 'finalizado' WHERE id = ?`,
                        [produtoId],
                        (err: Error | null) => {
                          if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                          }
                          res.json({
                            message: "Processo concluído. Produto finalizado.",
                          });
                        }
                      );
                    } else {
                      res.json({
                        message:
                          "Processo concluído. Não há mais etapas pendentes.",
                      });
                    }
                  }
                );
              }
            }
          );
        }
      );
    }
  );
};
