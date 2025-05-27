-- Crear base de datos
CREATE DATABASE IF NOT EXISTS crm_clinico;
USE crm_clinico;

-- Crear tablas

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'dentista', 'cliente') NOT NULL DEFAULT 'cliente',
  telefono VARCHAR(20),
  resetPasswordToken VARCHAR(255),
  resetPasswordExpires DATETIME,
  activo BOOLEAN DEFAULT TRUE,
  ultimoLogin DATETIME,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  historialMedico TEXT,
  alergias TEXT,
  fechaRegistro DATETIME NOT NULL,
  fechaNacimiento DATE,
  genero ENUM('masculino', 'femenino', 'otro', 'prefiero no decir'),
  direccion VARCHAR(200),
  ocupacion VARCHAR(100),
  contactoEmergencia VARCHAR(100),
  telefonoEmergencia VARCHAR(20),
  ultimaVisita DATETIME,
  notas TEXT,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de dentistas
CREATE TABLE IF NOT EXISTS dentistas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  especialidad VARCHAR(100),
  horarioTrabajo JSON,
  status ENUM('activo', 'inactivo', 'vacaciones') DEFAULT 'activo',
  titulo VARCHAR(100),
  numeroColegiado VARCHAR(50) UNIQUE,
  añosExperiencia INT,
  biografia TEXT,
  fotoPerfil VARCHAR(255),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla de servicios
CREATE TABLE IF NOT EXISTS servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2) NOT NULL,
  duracion INT NOT NULL COMMENT 'Duración en minutos',
  imagen VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  categoria VARCHAR(100),
  codigoServicio VARCHAR(20) UNIQUE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

-- Tabla de citas
CREATE TABLE IF NOT EXISTS citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clienteId INT NOT NULL,
  dentistaId INT NOT NULL,
  servicioId INT NOT NULL,
  fechaHora DATETIME NOT NULL,
  estado ENUM('pendiente', 'confirmada', 'completada', 'cancelada', 'no asistió') DEFAULT 'pendiente',
  notas TEXT,
  duracion INT COMMENT 'Duración en minutos',
  motivoCancelacion VARCHAR(255),
  recordatorioEnviado BOOLEAN DEFAULT FALSE,
  confirmada BOOLEAN DEFAULT FALSE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (clienteId) REFERENCES clientes(id),
  FOREIGN KEY (dentistaId) REFERENCES dentistas(id),
  FOREIGN KEY (servicioId) REFERENCES servicios(id),
  INDEX idx_cita_fecha (fechaHora),
  INDEX idx_cita_dentista_fecha (dentistaId, fechaHora),
  INDEX idx_cita_cliente_fecha (clienteId, fechaHora)
);

-- Tabla de tareas
CREATE TABLE IF NOT EXISTS tareas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(100) NOT NULL,
  descripcion TEXT,
  asignadoA INT NOT NULL,
  creadoPor INT NOT NULL,
  fechaLimite DATETIME,
  estado ENUM('pendiente', 'en progreso', 'completada', 'cancelada') DEFAULT 'pendiente',
  prioridad ENUM('baja', 'media', 'alta', 'urgente') DEFAULT 'media',
  completadoEn DATETIME,
  recordatorioEnviado BOOLEAN DEFAULT FALSE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (asignadoA) REFERENCES usuarios(id),
  FOREIGN KEY (creadoPor) REFERENCES usuarios(id),
  INDEX idx_tarea_asignado (asignadoA),
  INDEX idx_tarea_estado (estado),
  INDEX idx_tarea_fecha_limite (fechaLimite)
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuarioId INT NOT NULL,
  mensaje VARCHAR(255) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leida BOOLEAN DEFAULT FALSE,
  tipo ENUM('info', 'alerta', 'recordatorio', 'error') DEFAULT 'info',
  entidadTipo VARCHAR(50) COMMENT 'Tipo de entidad relacionada (cita, tarea, etc.)',
  entidadId INT COMMENT 'ID de la entidad relacionada',
  accion VARCHAR(50) COMMENT 'Acción relacionada (crear, actualizar, cancelar, etc.)',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (usuarioId) REFERENCES usuarios(id),
  INDEX idx_notificacion_usuario (usuarioId),
  INDEX idx_notificacion_leida (leida)
);

-- Tabla de configuraciones de usuario
CREATE TABLE IF NOT EXISTS user_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  theme ENUM('light', 'dark') DEFAULT 'light',
  language VARCHAR(5) DEFAULT 'es',
  notificationEmail BOOLEAN DEFAULT TRUE,
  notificationApp BOOLEAN DEFAULT TRUE,
  notificationSMS BOOLEAN DEFAULT FALSE,
  avatar VARCHAR(255),
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_user_settings_user (userId)
);

-- Insertar datos iniciales para pruebas

-- Usuario administrador por defecto
INSERT INTO usuarios (nombre, email, password, rol, telefono, activo, createdAt, updatedAt)
VALUES ('Administrador', 'admin@crmclinico.com', '$2a$10$l.Xxd8jJr0wYdQoN97eJY.PaWxBm3JC5a0yQUpKQLMqjLFiKW8nia', 'admin', '5555555555', TRUE, NOW(), NOW());

-- Configuración por defecto para el administrador
INSERT INTO user_settings (userId, createdAt, updatedAt)
SELECT id, NOW(), NOW() FROM usuarios WHERE email = 'admin@crmclinico.com';

-- Servicios básicos de muestra
INSERT INTO servicios (nombre, descripcion, precio, duracion, categoria, activo, createdAt, updatedAt) VALUES
('Limpieza dental', 'Limpieza profesional para remover placa y sarro', 50.00, 60, 'Higiene', TRUE, NOW(), NOW()),
('Extracción dental simple', 'Extracción de dientes con anestesia local', 70.00, 45, 'Extracción', TRUE, NOW(), NOW()),
('Ortodoncia - Consulta inicial', 'Evaluación para tratamiento de ortodoncia', 80.00, 60, 'Ortodoncia', TRUE, NOW(), NOW()),
('Blanqueamiento dental', 'Tratamiento para aclarar el color de los dientes', 150.00, 90, 'Estética', TRUE, NOW(), NOW()),
('Empaste dental', 'Relleno de cavidades con material compuesto', 60.00, 45, 'Restauración', TRUE, NOW(), NOW());
