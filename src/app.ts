import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app: Application = express();

app.use(cors());
app.use(express.json());

// Importa as rotas
import produtosRoutes from "./routes/produtos.routes";
import processosRoutes from "./routes/processos.routes";

app.use("/produtos", produtosRoutes);
app.use("/processos", processosRoutes);

export default app;
