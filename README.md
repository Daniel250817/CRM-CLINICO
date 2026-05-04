# CRM-CLINICO

Sistema de gestión para una clínica dental desarrollado como proyecto académico. El repositorio está dividido en tres partes: backend, frontend y una app de escritorio opcional.

## Descripción General

La aplicación permite administrar pacientes, dentistas, citas, servicios, facturación, seguimiento y archivos clínicos. El backend expone una API REST documentada con Swagger y el frontend ofrece la interfaz web para operar el sistema.

## Estructura del Proyecto

- `CRM-Clinico-BackEnd/`: API, modelos, controladores, servicios, middleware, pruebas y documentación Swagger.
- `CRM-Clinico-FrontEnd/`: Aplicación web en React + TypeScript.
- `CRM-Electron/`: Contenedor de escritorio opcional.

## Requisitos

- Node.js 18 o superior
- npm
- MySQL configurado para el backend

## Instalación

### Backend

```bash
cd CRM-Clinico-BackEnd
npm install
```

### Frontend

```bash
cd CRM-Clinico-FrontEnd
npm install
```

## Ejecución

### Backend

```bash
cd CRM-Clinico-BackEnd
npm start
```

Modo desarrollo:

```bash
npm run dev
```

### Frontend

```bash
cd CRM-Clinico-FrontEnd
npm run dev
```

## Pruebas

### Backend

```bash
cd CRM-Clinico-BackEnd
npm test
```

### Frontend

```bash
cd CRM-Clinico-FrontEnd
npm run lint
npm run build
```

## Documentación

- API Swagger: `http://localhost:3001/api-docs`
- Backend: [`CRM-Clinico-BackEnd/README.md`](CRM-Clinico-BackEnd/README.md)
- Frontend: [`CRM-Clinico-FrontEnd/README.md`](CRM-Clinico-FrontEnd/README.md)

## Manual Técnico

Sí cumple. El proyecto cuenta con documentación técnica básica para instalación, ejecución, pruebas y estructura general, suficiente para orientar el uso y mantenimiento del sistema.

## Variables de Entorno

El backend requiere variables para la base de datos y JWT. Revisa `CRM-Clinico-BackEnd/config/` y los archivos de configuración del proyecto para los valores esperados.

## Notas

- El backend incluye validaciones, manejo centralizado de errores, seguridad con Helmet y documentación OpenAPI.
- El frontend usa React, TypeScript y ESLint para mantener consistencia y calidad de código.
