import express, { Router } from "express";
import {
  createProduto,
  getProdutos,
  getProdutoById,
  updateProdutoStatus,
  deleteProduto,
  searchProdutos,
} from "../controllers/produtos.controler";
import { getProcessosByProduto } from "../controllers/processos.controller";

const router: Router = express.Router();

router.post("/", createProduto);
router.get("/", getProdutos);
router.get("/:id", getProdutoById);
router.get("/:id/processos", getProcessosByProduto);
router.put("/:id", updateProdutoStatus);
router.delete("/:id", deleteProduto);

router.get("/search", searchProdutos);

export default router;
