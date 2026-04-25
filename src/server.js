require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const { setCors, sendJSON } = require("./middleware/helpers");
const { estudiantesRouter } = require("./routes/estudiantes");
const { notasRouter } = require("./routes/notas");
const swaggerSpec = require("./swagger");

const PORT = process.env.PORT || 3000;

// ─── Ruta física de swagger-ui-dist ───────────────────────────────────────────
const swaggerUiPath = path.dirname(require.resolve("swagger-ui-dist/package.json"));

// ─── Tipos MIME básicos para los assets de Swagger UI ─────────────────────────
const MIME_TYPES = {
  ".html": "text/html",
  ".css":  "text/css",
  ".js":   "application/javascript",
  ".png":  "image/png",
  ".map":  "application/json",
};

// ─── Sirve un archivo estático de swagger-ui-dist ─────────────────────────────
function serveSwaggerAsset(res, filename) {
  const filePath = path.join(swaggerUiPath, filename);
  const ext = path.extname(filename);
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const pathname = req.url.split("?")[0];

  try {
    // ── Health check ──────────────────────────────────────────────────────────
    if (req.method === "GET" && pathname === "/") {
      return sendJSON(res, 200, { status: "ok", message: "API Notas Estudiantiles 🎓" });
    }

    // ── JSON de la especificación OpenAPI ─────────────────────────────────────
    if (req.method === "GET" && pathname === "/api-docs/swagger.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(swaggerSpec));
    }

    // ── Swagger UI — redirige /api-docs → /api-docs/ ──────────────────────────
    if (req.method === "GET" && pathname === "/api-docs") {
      res.writeHead(301, { Location: "/api-docs/" });
      return res.end();
    }

    // ── Swagger UI — sirve index.html con la URL del spec inyectada ───────────
    if (req.method === "GET" && pathname === "/api-docs/") {
      const indexPath = path.join(swaggerUiPath, "swagger-initializer.js");

      // HTML mínimo que monta Swagger UI apuntando a nuestro spec
      const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>API Notas Estudiantiles — Docs</title>
  <link rel="stylesheet" href="/api-docs/swagger-ui.css"/>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="/api-docs/swagger-ui-bundle.js"></script>
  <script src="/api-docs/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: "/api-docs/swagger.json",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        deepLinking: true,
      });
    };
  </script>
</body>
</html>`;
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(html);
    }

    // ── Swagger UI — assets (CSS, JS, imágenes) ───────────────────────────────
    if (req.method === "GET" && pathname.startsWith("/api-docs/")) {
      const filename = pathname.replace("/api-docs/", "");
      return serveSwaggerAsset(res, filename);
    }

    // ── Rutas del negocio ─────────────────────────────────────────────────────
    const handledByEstudiantes = await estudiantesRouter(req, res, pathname);
    if (handledByEstudiantes !== false) return;

    const handledByNotas = await notasRouter(req, res, pathname);
    if (handledByNotas !== false) return;

    sendJSON(res, 404, { error: "Ruta no encontrada" });
  } catch (err) {
    console.error("Error del servidor:", err);
    sendJSON(res, 500, { error: "Error interno del servidor" });
  }
});

server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 Swagger UI disponible en http://localhost:${PORT}/api-docs/`);
});