-- Desactivar restricciones de clave foránea temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar cualquier restricción única existente
DROP INDEX IF EXISTS clientes_email_unique ON clientes;
DROP INDEX IF EXISTS email ON clientes;

-- Primero hacemos backup de la tabla existente y sus datos
CREATE TABLE clientes_backup AS SELECT * FROM clientes;

-- Eliminamos la tabla existente
DROP TABLE IF EXISTS clientes;

-- Creamos la nueva tabla con la estructura deseada
CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  telefono VARCHAR(20) NOT NULL,
  historialMedico JSON,
  alergias TEXT,
  fechaRegistro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaNacimiento DATE,
  genero ENUM('masculino','femenino','otro','prefiero no decir','no_especificado'),
  direccion VARCHAR(200),
  ciudad VARCHAR(100),
  codigoPostal VARCHAR(10),
  ocupacion VARCHAR(100),
  estadoCivil ENUM('soltero','casado','divorciado','viudo'),
  contactoEmergencia JSON,
  telefonoEmergencia VARCHAR(20),
  ultimaVisita DATETIME,
  notas TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cliente_usuario FOREIGN KEY (userId) REFERENCES usuarios(id)
);

-- Agregar las columnas que faltan
ALTER TABLE clientes
  ADD COLUMN createdAt DATETIME AFTER notas,
  ADD COLUMN updatedAt DATETIME AFTER createdAt;

-- Agregar los índices (sin índice único para email)
ALTER TABLE clientes
  ADD INDEX idx_cliente_user (userId),
  ADD INDEX idx_cliente_fecha_registro (fechaRegistro);

-- Restaurar los datos del backup
INSERT INTO clientes (
  id,
  userId,
  nombre,
  apellidos,
  email,
  telefono,
  historialMedico,
  alergias,
  fechaRegistro,
  fechaNacimiento,
  genero,
  direccion,
  ciudad,
  codigoPostal,
  ocupacion,
  estadoCivil,
  contactoEmergencia,
  telefonoEmergencia,
  ultimaVisita,
  notas,
  createdAt,
  updatedAt
)
SELECT 
  id,
  userId,
  nombre,
  apellidos,
  email,
  telefono,
  historialMedico,
  alergias,
  fechaRegistro,
  fechaNacimiento,
  genero,
  direccion,
  ciudad,
  codigoPostal,
  ocupacion,
  estadoCivil,
  contactoEmergencia,
  telefonoEmergencia,
  ultimaVisita,
  notas,
  createdAt,
  updatedAt
FROM clientes_backup;

-- Reactivar restricciones de clave foránea
SET FOREIGN_KEY_CHECKS = 1; 