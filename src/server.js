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
// SWAGGER UI (CORREGIDO)
// =========================
if (pathname.startsWith("/api-docs")) {
  let file = pathname.replace("/api-docs", "");

  // Default
  if (file === "" || file === "/") {
    file = "index.html";
  } else {
    file = file.replace(/^\/+/, ""); // 🔥 quitar slash inicial
  }

  const filePath = path.join(swaggerUiPath, file);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error("Swagger file error:", filePath);
      res.writeHead(404);
      return res.end("Archivo no encontrado");
    }

    let content = data;

    // Solo modificar index.html
    if (file === "index.html") {
      content = data.toString().replace(
        "https://petstore.swagger.io/v2/swagger.json",
        "/swagger.json"
      );
    }

    const ext = path.extname(filePath);

    const contentTypes = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".png": "image/png",
      ".json": "application/json",
      ".ico": "image/x-icon"
    };

    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "text/plain"
    });

    res.end(content);
  });

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
