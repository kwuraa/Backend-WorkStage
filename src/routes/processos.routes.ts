import express, { Router } from "express";
import {
  createProcesso,
  getProcessosByProduto,
  updateProcesso,
  deleteProcesso,
  concluirProcesso,
} from "../controllers/processos.controller";

const router: Router = express.Router();

router.post("/", createProcesso);
router.put("/:id", updateProcesso);
router.delete("/:id", deleteProcesso);
router.put("/:id/concluir", concluirProcesso);

export default router;
