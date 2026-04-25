require("dotenv").config();
const fs = require("fs");
const path = require("path");
const swaggerUiPath = require("swagger-ui-dist").getAbsoluteFSPath();
const http = require("http");
const { setCors, sendJSON } = require("./middleware/helpers");
const { estudiantesRouter } = require("./routes/estudiantes");
const { notasRouter } = require("./routes/notas");

const PORT = process.env.PORT || 3000;

// Tipos MIME
const contentTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// Función reutilizable para servir archivos de Swagger UI
function serveSwaggerFile(res, file) {
  const filePath = path.join(swaggerUiPath, file);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    return res.end("Archivo no encontrado");
  }

  let content = fs.readFileSync(filePath);

  // En index.html: reemplazar la URL del spec Y las rutas relativas de assets
  if (file === "index.html") {
    content = content
      .toString()
      // Apuntar al swagger.json propio
      .replace(
        "https://petstore.swagger.io/v2/swagger.json",
        "/swagger.json"
      )
      // Prefijar todos los assets relativos con /api-docs/
      .replace(/(href|src)="(?!http|\/\/)([^"]+)"/g, '$1="/api-docs/$2"');
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
  });
  res.end(content);
}

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const pathname = req.url.split("?")[0];

  try {
    // Health check
    if (req.method === "GET" && pathname === "/") {
      return sendJSON(res, 200, { status: "ok", message: "API Notas Estudiantiles 🎓" });
    }

    // Swagger JSON
    if (req.method === "GET" && pathname === "/swagger.json") {
      const swagger = fs.readFileSync(path.join(__dirname, "swagger.json"));
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(swagger);
    }

    // Swagger UI — ruta principal /api-docs y sus assets
    if (req.method === "GET" && pathname.startsWith("/api-docs")) {
      let file = pathname.replace("/api-docs", "").replace(/^\/+/, "");
      if (!file) file = "index.html";
      return serveSwaggerFile(res, file);
    }

    // ⚡ Fallback: Swagger UI pide assets desde la raíz (sin prefijo)
    // Detectamos si el archivo existe en swagger-ui-dist y lo servimos
    const knownSwaggerAssets = [
      "swagger-ui.css",
      "swagger-ui-bundle.js",
      "swagger-ui-standalone-preset.js",
      "swagger-initializer.js",
      "index.css",
      "favicon-32x32.png",
      "favicon-16x16.png",
    ];
    const bareFile = pathname.replace(/^\//, "");
    if (req.method === "GET" && knownSwaggerAssets.includes(bareFile)) {
      return serveSwaggerFile(res, bareFile);
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