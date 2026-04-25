const { actualizarNotas } = require("../controllers/notasController");
const { jsonBody, sendJSON } = require("../middleware/helpers");

async function notasRouter(req, res, pathname) {
  // PATCH /api/notas
  if (req.method === "PATCH" && pathname === "/api/notas") {
    const body = await jsonBody(req);
    const result = await actualizarNotas(body);
    return sendJSON(res, result.status, result.data);
  }

  return false;
}

module.exports = { notasRouter };
