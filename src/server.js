require("dotenv").config();
const fs = require("fs");
const path = require("path");
const swaggerUiPath = require("swagger-ui-dist").getAbsoluteFSPath();
const http = require("http");
const { setCors, sendJSON } = require("./middleware/helpers");
const { estudiantesRouter } = require("./routes/estudiantes");
const { notasRouter } = require("./routes/notas");

const PORT = process.env.PORT || 3000;

// Tipos MIME para archivos estáticos de Swagger
const contentTypes = {
  ".html": "text/html",
  ".js":   "application/javascript",
  ".css":  "text/css",
  ".json": "application/json",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
};

// Assets conocidos de Swagger UI que el browser puede pedir sin prefijo
const SWAGGER_ASSETS = new Set([
  "swagger-ui.css",
  "swagger-ui-bundle.js",
  "swagger-ui-standalone-preset.js",
  "swagger-initializer.js",
  "index.css",
  "favicon-32x32.png",
  "favicon-16x16.png",
  "oauth2-redirect.html",
]);

/**
 * Sirve un archivo de swagger-ui-dist.
 * @param {http.ServerResponse} res
 * @param {string} file  - nombre de archivo relativo a swaggerUiPath
 */
function serveSwaggerFile(res, file) {
  const filePath = path.join(swaggerUiPath, file);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    return res.end("Archivo no encontrado");
  }

  let content = fs.readFileSync(filePath);

  if (file === "index.html") {
    content = content
      .toString()
      // 1. Apuntar al swagger.json del servidor
      .replace(
        "https://petstore.swagger.io/v2/swagger.json",
        "/swagger.json"
      )
      // 2. Prefijar todos los src/href relativos con /api-docs/
      //    para que el browser no los pida desde la raíz
      .replace(/(href|src)="(?!https?:\/\/|\/\/)([^"]+)"/g, '$1="/api-docs/$2"');
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    "Content-Type": contentTypes[ext] || "application/octet-stream",
  });
  res.end(content);
}

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

    // ──────────────────────────────────────────────
    // SWAGGER JSON
    // ──────────────────────────────────────────────
    if (req.method === "GET" && pathname === "/swagger.json") {
      const swagger = fs.readFileSync(path.join(__dirname, "swagger.json"));
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(swagger);
    }

    // ──────────────────────────────────────────────
    // SWAGGER UI  →  /api-docs  y  /api-docs/*
    // ──────────────────────────────────────────────
    if (req.method === "GET" && pathname.startsWith("/api-docs")) {
      let file = pathname.replace("/api-docs", "").replace(/^\/+/, "");
      if (!file) file = "index.html";
      return serveSwaggerFile(res, file);
    }

    // ──────────────────────────────────────────────
    // FALLBACK: assets que el browser pide sin prefijo
    // (ocurre cuando swagger-initializer.js u otros
    //  generan URLs relativas a la raíz del dominio)
    // ──────────────────────────────────────────────
    const bareFile = pathname.replace(/^\//, "");
    if (req.method === "GET" && SWAGGER_ASSETS.has(bareFile)) {
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
  console.log(`📄 Swagger UI disponible en http://localhost:${PORT}/api-docs`);
});
