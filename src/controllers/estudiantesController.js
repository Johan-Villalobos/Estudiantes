const supabase = require("../db/supabase");

// POST /api/estudiantes
async function registrarEstudiante(body) {
  const { cedula, nombre, correo, celular, materia } = body;

  if (!cedula || !nombre || !correo || !celular || !materia) {
    return { status: 400, data: { error: "Todos los campos son requeridos: cedula, nombre, correo, celular, materia" } };
  }

  // Buscar si ya existe el estudiante (por cédula)
  const { data: existente } = await supabase
    .from("estudiantes")
    .select("id")
    .eq("cedula", cedula.trim())
    .single();

  if (existente) {
    // Actualizar si ya existe
    const { data, error } = await supabase
      .from("estudiantes")
      .update({ nombre: nombre.trim(), correo: correo.trim(), celular: celular.trim() })
      .eq("cedula", cedula.trim())
      .select()
      .single();

    if (error) return { status: 500, data: { error: error.message } };
    return { status: 200, data: { message: "Estudiante actualizado", estudiante: data } };
  }

  // Crear nuevo estudiante
  const { data: nuevoEst, error: errEst } = await supabase
    .from("estudiantes")
    .insert({ cedula: cedula.trim(), nombre: nombre.trim(), correo: correo.trim(), celular: celular.trim() })
    .select()
    .single();

  if (errEst) return { status: 500, data: { error: errEst.message } };

  // Crear matrícula (relación estudiante-materia) con notas en null
  const { data: matData, error: errMat } = await supabase
    .from("materias")
    .select("id")
    .eq("nombre", materia.trim())
    .single();

  let materiaId;
  if (!matData) {
    // Crear materia si no existe
    const { data: nuevaMat, error: errNuevaMat } = await supabase
      .from("materias")
      .insert({ nombre: materia.trim() })
      .select()
      .single();
    if (errNuevaMat) return { status: 500, data: { error: errNuevaMat.message } };
    materiaId = nuevaMat.id;
  } else {
    materiaId = matData.id;
  }

  const { error: errMatricula } = await supabase
    .from("matriculas")
    .insert({ estudiante_id: nuevoEst.id, materia_id: materiaId });

  if (errMatricula) return { status: 500, data: { error: errMatricula.message } };

  return {
    status: 201,
    data: {
      message: "Estudiante registrado exitosamente",
      estudiante: { ...nuevoEst, materia: materia.trim() },
    },
  };
}

// GET /api/estudiantes/buscar?cedula=xxx&nombre=xxx
async function buscarEstudiante(query) {
  const { cedula, nombre } = query;

  if (!cedula || !nombre) {
    return { status: 400, data: { error: "Se requieren los parámetros cedula y nombre" } };
  }

  const { data, error } = await supabase
    .from("estudiantes")
    .select(`
      id,
      cedula,
      nombre,
      correo,
      celular,
      matriculas (
        nota1,
        nota2,
        nota3,
        nota4,
        definitiva,
        materias ( nombre )
      )
    `)
    .ilike("cedula", cedula.trim())
    .ilike("nombre", nombre.trim())
    .single();

  if (error || !data) {
    return { status: 404, data: { error: "Estudiante no encontrado" } };
  }

  const matricula = data.matriculas?.[0] ?? {};
  const resultado = {
    cedula: data.cedula,
    nombre: data.nombre,
    correo: data.correo,
    celular: data.celular,
    materia: matricula.materias?.nombre ?? null,
    nota1: matricula.nota1 ?? null,
    nota2: matricula.nota2 ?? null,
    nota3: matricula.nota3 ?? null,
    nota4: matricula.nota4 ?? null,
    definitiva: matricula.definitiva ?? null,
  };

  return { status: 200, data: resultado };
}

// GET /api/estudiantes
async function listarEstudiantes() {
  const { data, error } = await supabase
    .from("estudiantes")
    .select(`
      cedula,
      nombre,
      correo,
      celular,
      matriculas (
        nota1,
        nota2,
        nota3,
        nota4,
        definitiva,
        materias ( nombre )
      )
    `)
    .order("nombre");

  if (error) return { status: 500, data: { error: error.message } };

  const lista = data.map((e) => {
    const m = e.matriculas?.[0] ?? {};
    return {
      cedula: e.cedula,
      nombre: e.nombre,
      correo: e.correo,
      celular: e.celular,
      materia: m.materias?.nombre ?? null,
      nota1: m.nota1 ?? null,
      nota2: m.nota2 ?? null,
      nota3: m.nota3 ?? null,
      nota4: m.nota4 ?? null,
      definitiva: m.definitiva ?? null,
    };
  });

  return { status: 200, data: lista };
}

module.exports = { registrarEstudiante, buscarEstudiante, listarEstudiantes };
