require("dotenv").config();
const fs = require("fs");
const path = require("path");
const swaggerUiPath = require("swagger-ui-dist").getAbsoluteFSPath();
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
// ====================
// SWAGGER JSON
// ====================
if (req.method === "GET" && pathname === "/swagger.json") {
  const swagger = fs.readFileSync(path.join(__dirname, "swagger.json"));
  res.writeHead(200, { "Content-Type": "application/json" });
  return res.end(swagger);
}

// =========================
// SWAGGER UI (VERSIÓN FINAL)
// =========================
if (pathname.startsWith("/api-docs")) {
  let file = pathname.replace("/api-docs", "");

  // Si es la raíz
  if (file === "" || file === "/") {
    file = "index.html";
  }

  // Limpiar path (evita errores en Render)
  file = file.replace(/^\/+/, "");

  const filePath = path.join(swaggerUiPath, file);

  // 🔥 Verificar existencia antes de leer
  if (!fs.existsSync(filePath)) {
    console.error("Archivo no encontrado:", filePath);
    res.writeHead(404);
    return res.end("Archivo no encontrado");
  }

  let content = fs.readFileSync(filePath);

  // Solo modificar index.html
  if (file === "index.html") {
    content = content.toString().replace(
      "https://petstore.swagger.io/v2/swagger.json",
      "/swagger.json"
    );
  }

  // Tipos MIME completos (CLAVE 🔥)
  const ext = path.extname(filePath).toLowerCase();

  const contentTypes = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
  };

  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream"
  });

  res.end(content);
  return;
}
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
