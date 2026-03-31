# Backend Fix-ISO — API REST

**Stack:** Express 5 + TypeScript + Prisma 6 + PostgreSQL
**Propósito:** API REST para la plataforma Fix-ISO de implementación ISO 27001:2022 multi-tenant.

---

## Tabla de contenidos

- [Prerrequisitos](#prerrequisitos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura de carpetas](#estructura-de-carpetas)
- [Arquitectura](#arquitectura)
- [Endpoints implementados](#endpoints-implementados)
- [Autenticación JWT](#autenticación-jwt)
- [Middleware de seguridad](#middleware-de-seguridad)
- [Credenciales de seed](#credenciales-de-seed)
- [Comandos útiles de Prisma](#comandos-útiles-de-prisma)
- [Integración con Frontend](#integración-con-frontend)
- [Estado de implementación](#estado-de-implementación)

---

## Prerrequisitos

- **Node.js** 18+
- **PostgreSQL** 15+
- **npm** (incluido con Node.js)

---

## Instalación

```bash
# 1. Ir al directorio del backend
cd backend_fix-iso

# 2. Instalar dependencias
npm install

# 3. Crear la base de datos en PostgreSQL
psql -U postgres -c "CREATE DATABASE fixiso;"

# 4. Copiar el template de variables de entorno
cp .env.example .env

# 5. Editar .env con tus valores (ver sección Variables de entorno)
#    Importante: generar secretos JWT únicos:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
#    Copiar la salida como valor de JWT_ACCESS_SECRET y repetir para JWT_REFRESH_SECRET

# 6. Ejecutar migraciones (crea las tablas en PostgreSQL)
npx prisma migrate dev

# 7. Ejecutar seed (inserta datos iniciales: roles, permisos, usuarios, módulos)
npx prisma db seed

# 8. Iniciar en modo desarrollo (hot reload)
npm run dev
```

El servidor arranca en `http://localhost:3000`.

---

## Variables de entorno

Crear archivo `.env` en la raíz del backend (NO commitear, está en `.gitignore`):

| Variable | Tipo | Ejemplo | Descripción |
|---|---|---|---|
| `DATABASE_URL` | string | `postgresql://postgres:123456@localhost:5432/fixiso?schema=public` | URL de conexión a PostgreSQL |
| `JWT_ACCESS_SECRET` | string | (128 chars hex) | Secreto para firmar access tokens JWT. Generar con crypto. |
| `JWT_REFRESH_SECRET` | string | (128 chars hex) | Secreto para validación adicional. Generar con crypto. |
| `PORT` | number | `3000` | Puerto del servidor |
| `CORS_ORIGIN` | string | `http://localhost:5173` | Origen(es) permitidos para CORS (separar con coma si son varios) |
| `NODE_ENV` | string | `development` | Entorno: `development`, `production` o `test` |

---

## Scripts disponibles

| Script | Comando | Descripción |
|---|---|---|
| `npm run dev` | `tsx watch src/index.ts` | Servidor con hot reload (desarrollo) |
| `npm run build` | `tsc` | Compilar TypeScript a JavaScript en `dist/` |
| `npm start` | `node dist/index.js` | Iniciar servidor compilado (producción) |
| `npm run db:migrate` | `prisma migrate dev` | Ejecutar migraciones pendientes |
| `npm run db:seed` | `prisma db seed` | Insertar datos iniciales |
| `npm run db:reset` | `prisma migrate reset` | Resetear BD completa (borra datos + re-migra + re-seed) |
| `npm run db:studio` | `prisma studio` | Abrir interfaz visual de la BD en el navegador |

---

## Estructura de carpetas

```
backend_fix-iso/
├── prisma/
│   ├── schema.prisma                    # Esquema de la BD (modelos, relaciones, índices)
│   ├── seed.ts                          # Script de datos iniciales
│   └── migrations/                      # Migraciones auto-generadas
│
├── src/
│   ├── index.ts                         # Entry point: Express + middleware global + rutas
│   │
│   ├── config/
│   │   ├── env.ts                       # Validación de variables de entorno con Zod
│   │   ├── database.ts                  # Singleton PrismaClient + graceful shutdown
│   │   └── cors.ts                      # Configuración CORS
│   │
│   ├── middleware/
│   │   ├── auth.ts                      # Verificación JWT → inyecta req.user
│   │   ├── rbac.ts                      # Verificación de permisos (RBAC)
│   │   ├── rateLimiter.ts               # Rate limiting: global + auth
│   │   ├── errorHandler.ts              # Manejo centralizado de errores
│   │   └── logger.ts                    # Log de requests (method, url, status, duration)
│   │
│   ├── modules/
│   │   └── auth/
│   │       ├── auth.routes.ts           # Rutas: /login, /refresh, /logout, /me
│   │       ├── auth.controller.ts       # Handlers HTTP
│   │       ├── auth.service.ts          # Lógica de negocio (login, refresh, logout, getMe)
│   │       └── auth.validator.ts        # Schemas Zod (loginSchema, refreshSchema)
│   │
│   ├── routes/
│   │   └── index.ts                     # Router principal: monta módulos bajo /api
│   │
│   ├── utils/
│   │   ├── jwt.ts                       # signAccessToken, verifyAccessToken, generateRefreshToken
│   │   ├── password.ts                  # hashPassword, comparePassword (bcrypt 12 rounds)
│   │   └── pagination.ts               # Utilidades de paginación
│   │
│   └── types/
│       └── index.ts                     # Extensión de Request de Express (req.user)
│
├── .env                                 # Variables de entorno (NO en git)
├── .env.example                         # Template de variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Arquitectura

Cada módulo sigue el patrón **Routes → Controller → Service → Prisma**:

```
Request HTTP
  │
  ▼
Routes (.routes.ts)          Define rutas + aplica middleware (auth, rbac, validación)
  │
  ▼
Controller (.controller.ts)  Extrae datos del request, llama al service, envía response
  │
  ▼
Service (.service.ts)        Toda la lógica de negocio + acceso a BD vía Prisma
  │
  ▼
Prisma (database.ts)         ORM type-safe → PostgreSQL
```

**Flujo de middleware global** (orden de ejecución):
1. `helmet()` — Headers de seguridad
2. `cors()` — Solo permite el origen del frontend
3. `express.json({ limit: '10kb' })` — Parse body con límite de tamaño
4. `globalLimiter` — 100 req/15min/IP (anti-DDoS)
5. `logger` — Log de cada request
6. **Rutas** (`/api/*`)
7. Catch-all 404
8. `errorHandler` — Manejo centralizado de errores

---

## Endpoints implementados

### Auth (`/api/auth`)

| Método | Ruta | Middleware | Body | Descripción |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | `authLimiter` (10 req/15min) | `{ email, password }` | Login → devuelve accessToken + refreshToken + user |
| `POST` | `/api/auth/refresh` | — | `{ refreshToken }` | Rota tokens (revoca viejo, emite nuevos) |
| `POST` | `/api/auth/logout` | `authMiddleware` | `{ refreshToken }` | Revoca el refresh token |
| `GET` | `/api/auth/me` | `authMiddleware` | — | Devuelve datos del usuario autenticado |
| `GET` | `/health` | — | — | Health check del servidor |

### Responses

**Login exitoso** (`POST /api/auth/login`):
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "e89c27b9...",
  "user": {
    "id": 1,
    "name": "Carlos Mendoza",
    "email": "admin@fixiso.com",
    "avatarUrl": null,
    "roles": ["super_admin"],
    "permissions": ["dashboard:read", "companies:read", ...],
    "modules": [
      { "id": 1, "name": "Dashboard", "route": "/dashboard", "icon": "DashboardOutlined", "parentId": null, "displayOrder": 1 },
      ...
    ],
    "assignedCompanyIds": []
  }
}
```

**`GET /api/auth/me`:**
```json
{
  "data": { ...same AuthUser object... }
}
```

**Errores:**
```json
{ "error": "Credenciales inválidas" }           // 401
{ "error": "Cuenta desactivada" }                // 401
{ "error": "Token de acceso requerido" }         // 401
{ "error": "Token inválido o expirado" }         // 401
{ "error": "No tiene permisos para esta acción" } // 403
{ "error": "Ruta no encontrada" }                // 404
{ "error": "Demasiados intentos..." }            // 429
{ "error": "Datos de entrada inválidos", "details": [...] } // 400
```

---

## Autenticación JWT

### Flujo

```
1. POST /api/auth/login
   → Valida email + password (bcrypt)
   → Genera accessToken (JWT, 15 min) + refreshToken (opaco, 7 días, guardado en BD)
   → Devuelve ambos tokens + AuthUser

2. Frontend almacena:
   - accessToken en memoria (variable JS)
   - refreshToken en sessionStorage

3. Cada petición autenticada:
   → Header: Authorization: Bearer {accessToken}
   → Middleware auth.ts verifica JWT, carga usuario de BD, inyecta req.user

4. Cuando accessToken expira (15 min):
   → Frontend intercepta 401
   → POST /api/auth/refresh con refreshToken
   → Se revoca el refresh viejo, se emiten tokens nuevos (rotación)

5. POST /api/auth/logout
   → Revoca el refreshToken en BD
```

### Seguridad implementada

- **Bloqueo por intentos fallidos**: 5 intentos incorrectos → cuenta se desactiva automáticamente (requiere desbloqueo admin)
- **Rotación de refresh tokens**: cada uso revoca el anterior y emite uno nuevo
- **Detección de robo**: si se intenta usar un refresh token ya revocado, se revocan TODOS los tokens del usuario
- **Access token corto** (15 min) — limita ventana de exposición si se filtra
- **Refresh token opaco** — no es JWT, no decodificable; almacenado en BD para revocación individual
- **bcrypt 12 rounds** — hashing de contraseñas resistente a fuerza bruta

---

## Middleware de seguridad

| Middleware | Archivo | Función |
|---|---|---|
| **Helmet** | (express) | Headers de seguridad: X-Content-Type-Options, X-Frame-Options, CSP, etc. |
| **CORS** | `config/cors.ts` | Solo permite requests desde `CORS_ORIGIN` (default: `localhost:5173`) |
| **Rate Limiter Global** | `middleware/rateLimiter.ts` | 100 requests / 15 min por IP |
| **Rate Limiter Auth** | `middleware/rateLimiter.ts` | 10 intentos / 15 min por IP (solo en `/login`) |
| **Body Size Limit** | (express.json) | Máximo 10kb por request (protección contra payload abuse) |
| **Auth JWT** | `middleware/auth.ts` | Verifica token → carga usuario + roles + permisos → inyecta `req.user` |
| **RBAC** | `middleware/rbac.ts` | Verifica que `req.user.permissions` incluya el permiso requerido |
| **Error Handler** | `middleware/errorHandler.ts` | Zod→400, Prisma unique→409, Prisma not found→404, genérico→500 (sin leak) |
| **Logger** | `middleware/logger.ts` | Loguea method, URL, status code, duración en ms |

---

## Credenciales de seed

Todos los usuarios usan la misma contraseña para pruebas: **`Admin123!`**

| # | Nombre | Email | Rol | Estado |
|---|---|---|---|---|
| 1 | Carlos Mendoza | `admin@fixiso.com` | `super_admin` | Activo |
| 2 | Laura García | `laura.garcia@empresa.com` | `admin` | Activo |
| 3 | Andrés Rojas | `andres.rojas@empresa.com` | `auditor` | Activo |
| 4 | Diana Torres | `diana.torres@empresa.com` | `consultant` | Activo |
| 5 | Miguel Sánchez | `miguel.sanchez@empresa.com` | `employee` | Activo |
| 6 | Paola Ramírez | `paola.ramirez@empresa.com` | `employee` | **Inactiva** |

### Roles y permisos

| Rol | Permisos | Descripción |
|---|---|---|
| `super_admin` | 35/35 (todos) | Acceso total al sistema |
| `admin` | 34/35 (todos menos `audit_log:read`) | Administrador de empresa |
| `auditor` | 12/35 | Lectura amplia + CRUD auditorías |
| `consultant` | 16/35 | Gestión controles, SoA, activos, riesgos |
| `employee` | 6/35 | Lectura básica + subir evidencias |

---

## Comandos útiles de Prisma

```bash
# Ver las tablas en interfaz web (abre navegador)
npx prisma studio

# Crear nueva migración después de cambiar schema.prisma
npx prisma migrate dev --name nombre-del-cambio

# Resetear BD completa (borra todo, re-migra, re-ejecuta seed)
npx prisma migrate reset

# Regenerar el Prisma Client (después de cambiar schema)
npx prisma generate

# Ver estado de migraciones
npx prisma migrate status
```

---

## Integración con Frontend

El backend está diseñado para ser 100% compatible con el contrato API que el frontend (`fix-iso/`) ya usa con MSW (Mock Service Worker).

### Para conectar el frontend al backend real:

1. Asegurarse de que el backend esté corriendo (`npm run dev` en `backend_fix-iso/`)
2. En `fix-iso/.env.development`, cambiar:
   ```
   VITE_ENABLE_MOCKS=false
   ```
3. Reiniciar el dev server del frontend (`npm run dev` en `fix-iso/`)
4. El login y toda la autenticación ahora van contra el backend real

### Para volver a usar mocks:
```
VITE_ENABLE_MOCKS=true
```

---

## Estado de implementación

### Implementado

- [x] **Módulo Auth** — login, refresh, logout, /me con JWT
- [x] **Middleware de seguridad** — helmet, CORS, rate limiting, auth JWT, RBAC, error handler
- [x] **Prisma Schema** — tablas de auth/RBAC: users, roles, permissions, modules, refresh_tokens, audit_log + tablas pivote
- [x] **Seed data** — 35 permisos, 5 roles, 8 módulos, 6 usuarios (idénticos al mock del frontend)
- [x] **Validación** — Zod para payloads de entrada
- [x] **Protección anti-DDoS** — rate limiting por IP (global + auth)
- [x] **Bloqueo de cuentas** — tras 5 intentos fallidos de login
- [x] **Rotación de refresh tokens** — detección de robo incluida
- [x] **Health check** — `/health`

### Pendiente (próximas fases)

- [ ] **Módulo Users** — CRUD usuarios, asignación de roles, activar/desactivar
- [ ] **Módulo Companies** — CRUD empresas, asignación de usuarios, multi-tenant
- [ ] **Módulo Controls** — Catálogo ISO 27001:2022 (93 controles), implementación por empresa
- [ ] **Módulo SoA** — Declaración de Aplicabilidad por empresa
- [ ] **Módulo Assets** — CRUD activos de información, clasificación
- [ ] **Módulo Risk** — Evaluación de riesgos por activo
- [ ] **Módulo Audits** — Auditorías internas con resultados por control
- [ ] **Módulo Dashboard** — Estadísticas agregadas, métricas de cumplimiento
- [ ] **Audit Trail middleware** — Registro automático de acciones en audit_log

### Planificado (futuro)

- [ ] Integración con pipeline Big Data (datos de amenazas → riesgo latente)
- [ ] Despliegue AWS (EC2/ECS + RDS + S3)
- [ ] Rate limiter con Redis (producción)
- [ ] Notificaciones en tiempo real (WebSocket)
- [ ] Exportación de reportes PDF

---

## Base de datos — Tablas actuales

| Tabla | Registros seed | Propósito |
|---|---|---|
| `users` | 6 | Usuarios del sistema |
| `roles` | 5 | Roles (super_admin, admin, auditor, consultant, employee) |
| `user_roles` | 6 | Asignación usuario↔rol (muchos a muchos) |
| `permissions` | 35 | Permisos atómicos (`módulo:acción`) |
| `role_permissions` | 103 | Asignación rol↔permisos |
| `modules` | 8 | Módulos del sidebar (con jerarquía padre/hijo) |
| `module_permissions` | 9 | Permisos requeridos para ver cada módulo |
| `refresh_tokens` | dinámico | Tokens de refresco activos/revocados |
| `audit_log` | 1 | Registro de acciones (inmutable) |