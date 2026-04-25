const supabase = require("../db/supabase");

// PATCH /api/notas
async function actualizarNotas(body) {
  const { cedula, nota1, nota2, nota3, nota4 } = body;

  if (!cedula) {
    return { status: 400, data: { error: "El campo cedula es requerido" } };
  }

  const notas = [nota1, nota2, nota3, nota4];
  for (const n of notas) {
    if (n === undefined || n === null || isNaN(Number(n)) || Number(n) < 0 || Number(n) > 10) {
      return { status: 400, data: { error: "Las 4 notas son requeridas y deben estar entre 0 y 10" } };
    }
  }

  const n1 = parseFloat(Number(nota1).toFixed(2));
  const n2 = parseFloat(Number(nota2).toFixed(2));
  const n3 = parseFloat(Number(nota3).toFixed(2));
  const n4 = parseFloat(Number(nota4).toFixed(2));
  const definitiva = parseFloat(((n1 + n2 + n3 + n4) / 4).toFixed(2));

  // Obtener el estudiante
  const { data: estudiante, error: errEst } = await supabase
    .from("estudiantes")
    .select("id")
    .eq("cedula", cedula.trim())
    .single();

  if (errEst || !estudiante) {
    return { status: 404, data: { error: "Estudiante no encontrado" } };
  }

  // Actualizar la matrícula
  const { data, error } = await supabase
    .from("matriculas")
    .update({ nota1: n1, nota2: n2, nota3: n3, nota4: n4, definitiva })
    .eq("estudiante_id", estudiante.id)
    .select()
    .single();

  if (error) return { status: 500, data: { error: error.message } };

  return {
    status: 200,
    data: {
      message: "Notas actualizadas correctamente",
      notas: { nota1: n1, nota2: n2, nota3: n3, nota4: n4, definitiva },
    },
  };
}

module.exports = { actualizarNotas };
