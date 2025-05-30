const { z } = require('zod');

/**
 * Esquemas de validación para Auth
 */
const authSchemas = {
  // Esquema para registro de usuario
  registro: z.object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    passwordConfirm: z.string().optional().default(''),
    rol: z.enum(['admin', 'dentista', 'cliente']).default('cliente'),
    telefono: z.string().optional()
  })
  .transform(data => ({
    ...data,
    passwordConfirm: data.passwordConfirm || data.password
  }))
  .refine(data => data.password === data.passwordConfirm, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirm']
  }),

  // Esquema para login
  login: z.object({
    email: z.string().email('Email inválido'),
    password: z.string()
  }),

  // Esquema para solicitud de restablecimiento de contraseña
  olvidoPassword: z.object({
    email: z.string().email('Email inválido')
  }),

  // Esquema para cambio de contraseña
  restablecerPassword: z.object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    passwordConfirm: z.string()
  }).refine(data => data.password === data.passwordConfirm, {
    message: 'Las contraseñas no coinciden',
    path: ['passwordConfirm']
  })
};

/**
 * Esquemas de validación para Clientes
 */
const clienteSchemas = {
  // Esquema para crear cliente
  crearCliente: z.object({
    usuario: z.object({
      nombre: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede tener más de 100 caracteres')
        .trim(),
      apellidos: z.string()
        .min(2, 'Los apellidos deben tener al menos 2 caracteres')
        .max(100, 'Los apellidos no pueden tener más de 100 caracteres')
        .trim(),
      email: z.string()
        .email('Email inválido')
        .trim()
        .toLowerCase(),
      telefono: z.string()
        .min(8, 'El teléfono debe tener al menos 8 dígitos')
        .max(9, 'El teléfono no puede tener más de 9 dígitos')
        .regex(/^[0-9]{8,9}$/, 'El teléfono solo puede contener números y debe tener entre 8 y 9 dígitos')
        .trim(),
      fechaNacimiento: z.string()
        .nullable()
        .optional()
        .refine(val => !val || !isNaN(Date.parse(val)), {
          message: 'Formato de fecha inválido'
        }),
      genero: z.enum(['masculino', 'femenino', 'otro', 'prefiero no decir', 'no_especificado'])
    })
  }),

  // Esquema para actualizar cliente
  actualizarCliente: z.object({
    usuario: z.object({
      nombre: z.string()
        .min(2, 'El nombre debe tener al menos 2 caracteres')
        .max(100, 'El nombre no puede tener más de 100 caracteres')
        .trim(),
      apellidos: z.string()
        .min(2, 'Los apellidos deben tener al menos 2 caracteres')
        .max(100, 'Los apellidos no pueden tener más de 100 caracteres')
        .trim(),
      email: z.string()
        .email('Email inválido')
        .trim()
        .toLowerCase(),
      telefono: z.string()
        .min(8, 'El teléfono debe tener al menos 8 dígitos')
        .max(9, 'El teléfono no puede tener más de 9 dígitos')
        .regex(/^[0-9]{8,9}$/, 'El teléfono solo puede contener números y debe tener entre 8 y 9 dígitos')
        .trim(),
      fechaNacimiento: z.string()
        .nullable()
        .optional()
        .refine(val => !val || !isNaN(Date.parse(val)), {
          message: 'Formato de fecha inválido'
        }),
      genero: z.enum(['masculino', 'femenino', 'otro', 'prefiero no decir', 'no_especificado'])
    }),
    direccion: z.string().nullable().optional(),
    ciudad: z.string().nullable().optional(),
    codigoPostal: z.string().nullable().optional(),
    ocupacion: z.string().nullable().optional(),
    estadoCivil: z.string().nullable().optional(),
    contactoEmergencia: z.object({
      nombre: z.string(),
      telefono: z.string()
        .min(8, 'El teléfono del contacto debe tener al menos 8 dígitos')
        .max(9, 'El teléfono del contacto no puede tener más de 9 dígitos')
        .regex(/^[0-9]{8,9}$/, 'El teléfono del contacto solo puede contener números y debe tener entre 8 y 9 dígitos'),
      relacion: z.string()
    }).nullable().optional(),
    historialMedico: z.object({
      alergias: z.string().nullable().optional(),
      enfermedadesCronicas: z.string().nullable().optional(),
      medicamentosActuales: z.string().nullable().optional(),
      cirugiasPrevias: z.string().nullable().optional()
    }).nullable().optional()
  })
};

/**
 * Esquemas de validación para Dentistas
 */
const dentistaSchemas = {
  // Esquema para crear/actualizar dentista
  crearDentista: z.object({
    userId: z.union([z.string(), z.number()]).transform(val => parseInt(val, 10)), // Acepta string o número y lo convierte a entero
    especialidad: z.string().optional(),
    horarioTrabajo: z.union([
      z.string(), // Acepta string para JSON serializado
      z.record(z.array(z.object({
        inicio: z.string(),
        fin: z.string()
      })))
    ]).optional(),
    status: z.enum(['activo', 'inactivo', 'vacaciones']).optional(),
    titulo: z.string().optional(),
    numeroColegiado: z.string().optional(),
    añosExperiencia: z.union([z.number().int().min(0), z.string().transform(val => val ? parseInt(val, 10) : undefined)]).optional(),
    biografia: z.string().optional()
  })
};

/**
 * Esquemas de validación para Citas
 */
const citaSchemas = {
  // Esquema para crear cita
  crearCita: z.object({
    clienteId: z.number().int().positive(),
    dentistaId: z.number().int().positive(),
    servicioId: z.number().int().positive(),
    fechaHora: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: 'Formato de fecha y hora inválido'
    }),
    notas: z.string().optional()
  }),

  // Esquema para actualizar estado de cita
  actualizarEstado: z.object({
    estado: z.enum(['pendiente', 'confirmada', 'completada', 'cancelada', 'no asistió']),
    motivoCancelacion: z.string().optional()
  })
};

/**
 * Esquemas de validación para Tareas
 */
const tareaSchemas = {
  // Esquema para crear/actualizar tarea
  crearTarea: z.object({
    titulo: z.string().min(1, 'El título es obligatorio'),
    descripcion: z.string().optional(),
    asignadoA: z.number().int().positive(),
    fechaLimite: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
      message: 'Formato de fecha inválido'
    }),
    prioridad: z.enum(['baja', 'media', 'alta', 'urgente']).optional(),
    estado: z.enum(['pendiente', 'en progreso', 'completada', 'cancelada']).optional()
  }),

  // Esquema para actualizar estado
  actualizarEstado: z.object({
    estado: z.enum(['pendiente', 'en progreso', 'completada', 'cancelada'])
  })
};

/**
 * Esquemas de validación para Servicios
 */
const servicioSchemas = {
  // Esquema para crear servicio
  crearServicio: z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    descripcion: z.string().optional(),
    precio: z.union([
      z.number(),
      z.string().regex(/^\d+\.?\d*$/, 'El precio debe ser un número válido')
    ]).transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num <= 0) {
        throw new Error('El precio debe ser mayor que 0');
      }
      return num;
    }),
    duracion: z.union([
      z.number(),
      z.string().regex(/^\d+$/, 'La duración debe ser un número entero')
    ]).transform((val) => {
      const num = typeof val === 'string' ? parseInt(val) : val;
      if (isNaN(num) || num < 1) {
        throw new Error('La duración debe ser mayor que 0');
      }
      return num;
    }),
    imagen: z.string().optional(),
    categoria: z.string().optional(),
    codigoServicio: z.string().optional(),
    activo: z.union([
      z.boolean(),
      z.string()
    ]).transform((val) => {
      if (typeof val === 'string') {
        return val === 'true' || val === '1';
      }
      return val;
    }).optional()
  }),

  // Esquema para actualizar servicio
  actualizarServicio: z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio').optional(),
    descripcion: z.string().optional(),
    precio: z.union([
      z.number(),
      z.string().regex(/^\d+\.?\d*$/, 'El precio debe ser un número válido')
    ]).transform((val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      if (isNaN(num) || num <= 0) {
        throw new Error('El precio debe ser mayor que 0');
      }
      return num;
    }).optional(),
    duracion: z.union([
      z.number(),
      z.string().regex(/^\d+$/, 'La duración debe ser un número entero')
    ]).transform((val) => {
      const num = typeof val === 'string' ? parseInt(val) : val;
      if (isNaN(num) || num < 1) {
        throw new Error('La duración debe ser mayor que 0');
      }
      return num;
    }).optional(),
    imagen: z.string().optional(),
    categoria: z.string().optional(),
    codigoServicio: z.string().optional(),
    activo: z.union([
      z.boolean(),
      z.string()
    ]).transform((val) => {
      if (typeof val === 'string') {
        return val === 'true' || val === '1';
      }
      return val;
    }).optional()
  })
};

/**
 * Esquemas de validación para Settings de Usuario
 */
const userSettingsSchemas = {
  actualizarSettings: z.object({
    theme: z.enum(['light', 'dark']).optional(),
    language: z.string().min(2).max(5).optional(),
    notificationEmail: z.boolean().optional(),
    notificationApp: z.boolean().optional(),
    notificationSMS: z.boolean().optional(),
    avatar: z.string().optional().nullable()
  })
};

/**
 * Esquemas de validación para Tratamientos
 */
const tratamientoSchemas = {
  crearTratamiento: z.object({
    nombre: z.string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(100, 'El nombre no puede tener más de 100 caracteres'),
    descripcion: z.string()
      .max(500, 'La descripción no puede tener más de 500 caracteres')
      .optional(),
    fechaInicio: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD'),
    dentistaId: z.number()
      .int('El ID del dentista debe ser un número entero')
      .positive('El ID del dentista debe ser positivo'),
    sesionesTotales: z.number()
      .int('El número de sesiones debe ser un número entero')
      .min(1, 'Debe haber al menos una sesión')
      .max(100, 'No puede haber más de 100 sesiones'),
    notas: z.string()
      .max(1000, 'Las notas no pueden tener más de 1000 caracteres')
      .optional()
  }),

  actualizarTratamiento: z.object({
    progreso: z.number()
      .int('El progreso debe ser un número entero')
      .min(0, 'El progreso no puede ser menor a 0')
      .max(100, 'El progreso no puede ser mayor a 100')
      .optional(),
    sesionesCompletadas: z.number()
      .int('El número de sesiones completadas debe ser un número entero')
      .min(0, 'El número de sesiones completadas no puede ser menor a 0')
      .optional(),
    estado: z.enum(['activo', 'completado', 'cancelado'])
      .optional(),
    notas: z.string()
      .max(1000, 'Las notas no pueden tener más de 1000 caracteres')
      .optional(),
    fechaFin: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato YYYY-MM-DD')
      .optional()
  })
};

module.exports = {
  authSchemas,
  clienteSchemas,
  dentistaSchemas,
  citaSchemas,
  tareaSchemas,
  servicioSchemas,
  userSettingsSchemas,
  tratamientoSchemas
};
