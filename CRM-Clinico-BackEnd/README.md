# CRM-Clínico - Sistema Backend para Clínica Dental

Backend desarrollado en Node.js con MySQL para la gestión integral de una clínica dental.

## Características principales

- Autenticación y autorización JWT
- Gestión de usuarios con roles (Admin, Dentista, Cliente)
- Gestión de citas con verificación de disponibilidad
- Servicios dentales configurables
- Sistema de tareas y notificaciones
- Subida y gestión de archivos (historiales médicos, radiografías)
- Dashboard con estadísticas y reportes
- Sistema de seguimiento de pacientes recurrentes
- Documentación API con Swagger/OpenAPI
- API RESTful completa
- Logging centralizado
- Seguridad OWASP

## Requisitos previos

- Node.js (v14+)
- MySQL (v8+)
- npm o yarn

## Tecnologías utilizadas

- Express.js - Framework web
- Sequelize - ORM para MySQL
- JSON Web Tokens - Autenticación
- Bcryptjs - Cifrado de contraseñas
- Zod - Validación de datos
- Winston - Logging
- Helmet - Seguridad HTTP
- Jest - Testing

## Instalación

1. Clonar el repositorio:
```
git clone <url-repositorio>
cd crm-clinico
```

2. Instalar dependencias:
```
npm install
```

3. Configurar variables de entorno:
   - Crear archivo `.env` basado en `.env.example`
   - Configurar conexión a base de datos y demás variables

4. Crear la base de datos:
```
mysql -u root -p < db_schema.sql
```

5. Ejecutar migraciones (opcional si ya ejecutó el script SQL):
```
npm run db:migrate
```

6. Iniciar aplicación en modo desarrollo:
```
npm run dev
```

## Estructura del proyecto

```
crm-clinico/
├── src/                     # Código fuente
│   ├── config/              # Configuraciones
│   ├── controllers/         # Controladores
│   ├── middlewares/         # Middlewares personalizados
│   ├── models/              # Modelos de datos (Sequelize)
│   ├── routes/              # Rutas de la API
│   ├── services/            # Servicios
│   ├── tests/               # Tests
│   ├── utils/               # Utilidades
│   └── server.js            # Punto de entrada
├── .env                     # Variables de entorno
├── .sequelizerc             # Configuración para Sequelize CLI
├── db_schema.sql            # Script SQL para crear la base de datos
└── package.json
```

## Endpoints API

### Auth

- POST `/api/auth/register` - Registro de usuario
- POST `/api/auth/login` - Login de usuario
- POST `/api/auth/forgot-password` - Solicitud recuperación contraseña
- POST `/api/auth/reset-password/:token` - Restablecimiento de contraseña
- GET `/api/auth/verify` - Verificar token JWT
- POST `/api/auth/change-password` - Cambiar contraseña

### Usuarios

- GET `/api/users` - Obtener todos los usuarios (admin)
- GET `/api/users/me` - Perfil del usuario autenticado
- GET `/api/users/:id` - Obtener usuario por ID
- PATCH `/api/users/:id` - Actualizar usuario
- PATCH `/api/users/:id/estado` - Activar/desactivar usuario (admin)
- DELETE `/api/users/:id` - Eliminar usuario (admin)

### Clientes

- GET `/api/clientes` - Obtener todos los clientes
- GET `/api/clientes/perfil` - Perfil del cliente autenticado
- GET `/api/clientes/mis-citas` - Citas del cliente autenticado
- GET `/api/clientes/:id` - Obtener cliente por ID
- PATCH `/api/clientes/:id` - Actualizar datos de cliente
- GET `/api/clientes/:id/citas` - Obtener citas de un cliente

### Dentistas

- GET `/api/dentistas` - Obtener todos los dentistas
- GET `/api/dentistas/especialidades` - Obtener todas las especialidades
- GET `/api/dentistas/perfil` - Perfil del dentista autenticado
- GET `/api/dentistas/:id` - Obtener dentista por ID
- GET `/api/dentistas/:id/disponibilidad` - Verificar disponibilidad por fecha
- PATCH `/api/dentistas/:id` - Actualizar datos de dentista

### Citas

- GET `/api/citas` - Obtener todas las citas (con filtros)
- POST `/api/citas` - Crear nueva cita
- GET `/api/citas/:id` - Obtener cita por ID
- PATCH `/api/citas/:id/estado` - Actualizar estado de cita
- GET `/api/citas/dentista/:id/disponibilidad` - Verificar disponibilidad de dentista

### Servicios

- GET `/api/servicios` - Obtener todos los servicios
- GET `/api/servicios/categorias` - Obtener categorías de servicios
- GET `/api/servicios/:id` - Obtener servicio por ID
- POST `/api/servicios` - Crear nuevo servicio (admin)
- PATCH `/api/servicios/:id` - Actualizar servicio (admin)
- DELETE `/api/servicios/:id` - Eliminar servicio (admin)

### Tareas

- GET `/api/tareas` - Obtener todas las tareas (con filtros)
- GET `/api/tareas/resumen` - Resumen estadístico de tareas
- POST `/api/tareas` - Crear nueva tarea
- GET `/api/tareas/:id` - Obtener tarea por ID
- PATCH `/api/tareas/:id` - Actualizar tarea
- DELETE `/api/tareas/:id` - Eliminar tarea

### Notificaciones

- GET `/api/notificaciones` - Obtener notificaciones del usuario
- GET `/api/notificaciones/no-leidas` - Contar notificaciones no leídas
- PATCH `/api/notificaciones/:id/marcar-leida` - Marcar notificación como leída
- PATCH `/api/notificaciones/marcar-todas-leidas` - Marcar todas como leídas
- DELETE `/api/notificaciones/:id` - Eliminar notificación

### Archivos

- POST `/api/archivos/medical-records/:clienteId` - Subir historial médico de un cliente
- GET `/api/archivos/medical-records/:clienteId` - Obtener historial médico de un cliente
- POST `/api/archivos/xrays/:citaId` - Subir radiografía de una cita
- GET `/api/archivos/xrays/:citaId` - Obtener radiografía de una cita

### Dashboard

- GET `/api/dashboard/estadisticas` - Obtener estadísticas generales
- GET `/api/dashboard/dentista/:id` - Obtener estadísticas de un dentista
- GET `/api/dashboard/cliente/:id` - Obtener estadísticas de un cliente
- GET `/api/dashboard/prevision-ingresos` - Obtener previsión de ingresos

### Seguimiento de Pacientes

- GET `/api/seguimiento/pacientes-recurrentes` - Obtener pacientes recurrentes
- GET `/api/seguimiento/pacientes-inactivos` - Obtener pacientes inactivos
- GET `/api/seguimiento/cliente/:id/patron-visitas` - Analizar patrón de visitas de un cliente
- GET `/api/seguimiento/cliente/:id/recomendaciones` - Generar recomendaciones para un cliente

## Scripts disponibles

- `npm start` - Iniciar en producción
- `npm run dev` - Iniciar en modo desarrollo
- `npm run test` - Ejecutar pruebas
- `npm run db:migrate` - Ejecutar migraciones
- `npm run db:seed` - Poblar base de datos con datos iniciales

## Documentación API

La documentación completa de la API está disponible en:

- Swagger UI: `/api-docs`
- Swagger JSON: `/api-docs.json`

Esta documentación incluye todos los endpoints, parámetros, modelos de datos y ejemplos de respuestas.

## Seguridad

Este sistema implementa varias capas de seguridad:

- Autenticación JWT
- Cifrado de contraseñas con bcrypt
- Limitación de intentos de acceso
- Cabeceras de seguridad con Helmet
- Validación estricta de datos con Zod
- Manejo centralizado de errores
- Protección contra inyecciones SQL

## Licencia

Este proyecto es propiedad privada y no está disponible para uso público sin autorización.
