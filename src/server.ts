import app from "./app"; // ✅ Importa a configuração do Express
import dotenv from "dotenv";
import { PORT } from "./config/config";

dotenv.config();

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
