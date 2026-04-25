const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Notas Estudiantiles",
      version: "1.0.0",
      description: "Sistema de gestión de notas estudiantiles",
    },
    servers: [
      {
        url: "https://TU-APP.onrender.com", // Cambia por tu URL de Render
        description: "Servidor de producción",
      },
      {
        url: "http://localhost:3000",
        description: "Servidor local",
      },
    ],
    components: {
      schemas: {
        Estudiante: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            nombre: { type: "string", example: "Juan Pérez" },
            email: { type: "string", example: "juan@email.com" },
          },
        },
        Nota: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            estudiante_id: { type: "integer", example: 1 },
            materia: { type: "string", example: "Matemáticas" },
            nota: { type: "number", example: 4.5 },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Mensaje de error" },
          },
        },
      },
    },
    paths: {
      "/": {
        get: {
          summary: "Health check",
          tags: ["General"],
          responses: {
            200: {
              description: "API funcionando",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      message: { type: "string", example: "API Notas Estudiantiles 🎓" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/estudiantes": {
        get: {
          summary: "Obtener todos los estudiantes",
          tags: ["Estudiantes"],
          responses: {
            200: {
              description: "Lista de estudiantes",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Estudiante" } },
                },
              },
            },
          },
        },
        post: {
          summary: "Crear un estudiante",
          tags: ["Estudiantes"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["nombre", "email"],
                  properties: {
                    nombre: { type: "string", example: "Juan Pérez" },
                    email: { type: "string", example: "juan@email.com" },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Estudiante creado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Estudiante" },
                },
              },
            },
          },
        },
      },
      "/estudiantes/{id}": {
        get: {
          summary: "Obtener estudiante por ID",
          tags: ["Estudiantes"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            200: { description: "Estudiante encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Estudiante" } } } },
            404: { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          },
        },
        put: {
          summary: "Actualizar estudiante",
          tags: ["Estudiantes"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    nombre: { type: "string" },
                    email: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Actualizado correctamente" },
            404: { description: "No encontrado" },
          },
        },
        delete: {
          summary: "Eliminar estudiante",
          tags: ["Estudiantes"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            200: { description: "Eliminado correctamente" },
            404: { description: "No encontrado" },
          },
        },
      },
      "/notas": {
        get: {
          summary: "Obtener todas las notas",
          tags: ["Notas"],
          responses: {
            200: {
              description: "Lista de notas",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Nota" } },
                },
              },
            },
          },
        },
        post: {
          summary: "Crear una nota",
          tags: ["Notas"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["estudiante_id", "materia", "nota"],
                  properties: {
                    estudiante_id: { type: "integer", example: 1 },
                    materia: { type: "string", example: "Matemáticas" },
                    nota: { type: "number", example: 4.5 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Nota creada", content: { "application/json": { schema: { $ref: "#/components/schemas/Nota" } } } },
          },
        },
      },
      "/notas/{id}": {
        get: {
          summary: "Obtener nota por ID",
          tags: ["Notas"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            200: { description: "Nota encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/Nota" } } } },
            404: { description: "No encontrada" },
          },
        },
        put: {
          summary: "Actualizar nota",
          tags: ["Notas"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    materia: { type: "string" },
                    nota: { type: "number" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Actualizada correctamente" },
            404: { description: "No encontrada" },
          },
        },
        delete: {
          summary: "Eliminar nota",
          tags: ["Notas"],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
          responses: {
            200: { description: "Eliminada correctamente" },
            404: { description: "No encontrada" },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = { swaggerSpec };