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
    passwordConfirm: z.string(),
    rol: z.enum(['admin', 'dentista', 'cliente']).default('cliente'),
    telefono: z.string().optional()
  }).refine(data => data.password === data.passwordConfirm, {
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
  // Esquema para crear/actualizar cliente
  crearCliente: z.object({
    usuario: z.object({
      nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
      apellidos: z.string().min(2, 'Los apellidos deben tener al menos 2 caracteres'),
      email: z.string().email('Email inválido'),
      telefono: z.string().min(6, 'El teléfono debe tener al menos 6 caracteres'),
      fechaNacimiento: z.string().nullable().optional(),
      genero: z.enum(['masculino', 'femenino', 'otro', 'prefiero no decir', 'no_especificado']).nullable().optional()
    }),
    direccion: z.string().nullable().optional(),
    ciudad: z.string().nullable().optional(),
    codigoPostal: z.string().nullable().optional(),
    ocupacion: z.string().nullable().optional(),
    estadoCivil: z.enum(['soltero', 'casado', 'divorciado', 'viudo']).nullable().optional(),
    contactoEmergencia: z.object({
      nombre: z.string(),
      telefono: z.string(),
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
    userId: z.string(),
    especialidad: z.string().optional(),
    horarioTrabajo: z.record(z.array(z.object({
      inicio: z.string(),
      fin: z.string()
    }))).optional(),
    status: z.enum(['activo', 'inactivo', 'vacaciones']).optional(),
    titulo: z.string().optional(),
    numeroColegiado: z.string().optional(),
    añosExperiencia: z.number().int().min(0).optional(),
    biografia: z.string().optional(),
    fotoPerfil: z.string().optional()
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
    precio: z.number().positive('El precio debe ser mayor que 0'),
    duracion: z.number().int().min(1, 'La duración debe ser mayor que 0'),
    imagen: z.string().optional(),
    categoria: z.string().optional(),
    codigoServicio: z.string().optional(),
    activo: z.boolean().optional()
  }),

  // Esquema para actualizar servicio
  actualizarServicio: z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio').optional(),
    descripcion: z.string().optional(),
    precio: z.number().positive('El precio debe ser mayor que 0').optional(),
    duracion: z.number().int().min(1, 'La duración debe ser mayor que 0').optional(),
    imagen: z.string().optional(),
    categoria: z.string().optional(),
    codigoServicio: z.string().optional(),
    activo: z.boolean().optional()
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
    avatar: z.string().url('URL inválida').optional().nullable()
  })
};

module.exports = {
  authSchemas,
  clienteSchemas,
  dentistaSchemas,
  citaSchemas,
  tareaSchemas,
  servicioSchemas,
  userSettingsSchemas
};
