require("dotenv").config();
const http = require("http");
const { setCors, sendJSON } = require("./middleware/helpers");
const { estudiantesRouter } = require("./routes/estudiantes");
const { notasRouter } = require("./routes/notas");

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  // Aplicar CORS a todas las respuestas
  setCors(res);

  // Preflight OPTIONS
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  // Extraer pathname sin query string
  const pathname = req.url.split("?")[0];

  try {
    // Health check
    if (req.method === "GET" && pathname === "/") {
      return sendJSON(res, 200, { status: "ok", message: "API Notas Estudiantiles 🎓" });
    }

    // Rutas de estudiantes
    const handledByEstudiantes = await estudiantesRouter(req, res, pathname);
    if (handledByEstudiantes !== false) return;

    // Rutas de notas
    const handledByNotas = await notasRouter(req, res, pathname);
    if (handledByNotas !== false) return;

    // 404
    sendJSON(res, 404, { error: "Ruta no encontrada" });
  } catch (err) {
    console.error("Error del servidor:", err);
    sendJSON(res, 500, { error: "Error interno del servidor" });
  }
});

server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
