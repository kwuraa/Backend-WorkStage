import app from "./app"; // ✅ Importa a configuração do Express
import dotenv from "dotenv";
import { PORTDB } from "./config/config";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

app.listen(PORTDB, () => {
  console.log(`🚀 Servidor rodando na porta ${PORTDB}`);
});

const PORT = process.env.PORT || 5000;

// Criar servidor HTTP
const server = createServer(app);

// Criar servidor WebSocket
export const io = new Server(server, {
  cors: {
    origin: "*", // Permitir conexões do frontend
  },
});

// Evento de conexão WebSocket
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado via WebSocket");

  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado");
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSockets rodando na porta ${PORT}`);
});
