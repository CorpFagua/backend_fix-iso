# Backend Fix-ISO — API REST

**Stack:** Express 5 + TypeScript + Prisma 6 + PostgreSQL
**Propósito:** API REST para Fix-ISO, herramienta interna de una empresa consultora de seguridad informática que gestiona proyectos de implementación, auditoría y capacitación ISO 27001:2022 en empresas cliente.

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
- [Guía para desarrolladores](#guía-para-desarrolladores)
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
│   ├── schema.prisma                    # Esquema BD: 24 modelos (auth + negocio)
│   ├── seed.ts                          # Datos iniciales: usuarios, 93 controles ISO, empresas, activos
│   └── migrations/                      # Migraciones: init_auth + add_business_tables
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
│   ├── models/                          # Capa de dominio: interfaces TypeScript (DTOs)
│   │   ├── company.model.ts             # CompanyModel, CompanyUserModel, CompanyServiceModel
│   │   ├── control.model.ts             # IsoThemeModel, IsoControlModel, CompanyControlModel, SoAEntryModel
│   │   ├── asset.model.ts               # AssetModel, AssetWithRisksModel, AssetRiskModel
│   │   ├── user.model.ts                # UserModel, RoleModel, PermissionModel
│   │   ├── dashboard.model.ts           # DashboardStatsModel, ComplianceByThemeModel, etc.
│   │   └── index.ts                     # Barrel export de todos los modelos
│   │
│   ├── modules/
│   │   ├── auth/                        # Login, refresh, logout, /me
│   │   ├── companies/                   # CRUD empresas + usuarios de empresa
│   │   ├── controls/                    # Catálogo ISO 27001 + asignación a empresas + SoA
│   │   ├── assets/                      # CRUD activos + evaluaciones de riesgo
│   │   ├── dashboard/                   # Estadísticas, compliance, resumen global
│   │   ├── users/                       # CRUD usuarios del sistema
│   │   ├── admin/                       # Gestión roles y permisos
│   │   └── catalogs/                    # Catálogos auxiliares (sectores, tamaños)
│   │
│   ├── routes/
│   │   └── index.ts                     # Router principal: monta todos los módulos bajo /api
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

### Empresas (`/api/companies`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/companies` | Listar todas las empresas cliente |
| `POST` | `/api/companies` | Crear empresa |
| `GET` | `/api/companies/:id` | Detalle de empresa |
| `PUT` | `/api/companies/:id` | Actualizar empresa |
| `DELETE` | `/api/companies/:id` | Eliminar empresa |
| `GET` | `/api/companies/:id/users` | Listar usuarios asignados a empresa |
| `POST` | `/api/companies/:id/users` | Asignar usuario a empresa |
| `DELETE` | `/api/companies/:id/users/:userId` | Remover usuario de empresa |

### Controles ISO 27001 (`/api/controls`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/controls` | Listar catálogo completo (93 controles, paginado, filtros) |
| `GET` | `/api/controls/:id` | Detalle de un control del catálogo |
| `PUT` | `/api/controls/:id` | Editar control del catálogo (admin) |
| `GET` | `/api/controls/themes` | Listar 14 temáticas ISO 27001:2022 |
| `GET` | `/api/companies/:id/controls` | Controles asignados a empresa |
| `POST` | `/api/companies/:id/controls` | Asignar control a empresa (con madurez/estado) |
| `PUT` | `/api/companies/:id/controls/:controlId` | Actualizar estado/madurez de control asignado |
| `DELETE` | `/api/companies/:id/controls/:controlId` | Remover asignación de control |
| `GET` | `/api/companies/:id/soa` | Statement of Applicability por empresa |
| `PUT` | `/api/companies/:id/soa/:controlId` | Actualizar entrada del SoA |

**Campos de control asignado (`POST /companies/:id/controls`):**
```json
{
  "controlId": 12,
  "status": "pending | in_progress | implemented | not_applicable",
  "maturityLevel": "initial | managed | defined | quantified | optimizing",
  "assignedUser": 3,
  "notes": "Texto libre"
}
```

### Activos (`/api/companies/:id/assets`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/companies/:id/assets` | Listar activos de empresa (paginado, filtros) |
| `POST` | `/api/companies/:id/assets` | Crear activo |
| `GET` | `/api/companies/:id/assets/:assetId` | Detalle con evaluaciones de riesgo |
| `PUT` | `/api/companies/:id/assets/:assetId` | Actualizar activo |
| `DELETE` | `/api/companies/:id/assets/:assetId` | Eliminar activo |
| `POST` | `/api/companies/:id/assets/:assetId/risks` | Crear evaluación de riesgo |

### Dashboard (`/api/dashboard`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/dashboard/stats` | KPIs: controles, activos, auditorías, compliance% |
| `GET` | `/api/dashboard/compliance` | Progreso de compliance por temática ISO |
| `GET` | `/api/dashboard/risks` | Distribución de riesgos (low/medium/high/critical) |
| `GET` | `/api/dashboard/activity` | Últimas 20 acciones del sistema |
| `GET` | `/api/dashboard/summary` | Resumen global de todas las empresas |

Todos aceptan `?companyId=N` para filtrar por empresa.

### Usuarios (`/api/users`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/users` | Listar usuarios (paginado, búsqueda) |
| `POST` | `/api/users` | Crear usuario |
| `GET` | `/api/users/:id` | Detalle de usuario |
| `PUT` | `/api/users/:id` | Actualizar usuario |
| `DELETE` | `/api/users/:id` | Desactivar usuario |

### Admin — Roles y Permisos (`/api/roles`, `/api/permissions`, `/api/modules`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/roles` | Listar roles |
| `POST` | `/api/roles` | Crear rol |
| `PUT` | `/api/roles/:id` | Actualizar rol |
| `GET` | `/api/roles/:id/permissions` | Ver permisos de un rol |
| `PUT` | `/api/roles/:id/permissions` | Reemplazar permisos de un rol |
| `GET` | `/api/permissions` | Permisos agrupados por módulo |
| `GET` | `/api/permissions/all` | Todos los permisos (lista plana) |
| `GET` | `/api/modules` | Listar módulos del sistema |

### Catálogos auxiliares (`/api/catalogs`)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/catalogs/sectors` | Sectores de actividad |
| `GET` | `/api/catalogs/sizes` | Tamaños de empresa |

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

## Guía para desarrolladores

Esta sección explica cómo trabajar sobre el proyecto sin romper nada: modificar la BD, agregar módulos, convenciones de código y errores frecuentes.

---

### Modificar la base de datos

#### Flujo estándar para cualquier cambio en el schema

```
Editar schema.prisma  →  migrate dev  →  (prisma generate automático)  →  actualizar seed si aplica
```

**Paso a paso:**

```bash
# 1. Editar prisma/schema.prisma con el cambio deseado

# 2. Crear y aplicar la migración (genera SQL + actualiza el cliente Prisma)
npx prisma migrate dev --name descripcion-corta-del-cambio

# El nombre debe ser descriptivo: add-audit-results, add-evidence-files, etc.
# Si hay datos existentes que se deben migrar, editar el SQL generado en
# prisma/migrations/<timestamp>_descripcion/migration.sql ANTES de aplicar

# 3. Si solo quieres regenerar el cliente sin migrar (ej: después de un git pull)
npx prisma generate

# 4. Si el nuevo modelo necesita datos iniciales, actualizar prisma/seed.ts
# y ejecutar SOLO EL SEED sin resetear la BD:
npx prisma db seed

# PRECAUCIÓN: el siguiente comando BORRA TODOS LOS DATOS y re-crea desde cero
npx prisma migrate reset   # usar solo en desarrollo local, nunca en producción
```

> **Importante:** después de `migrate dev`, el cliente Prisma se regenera automáticamente. Si ves errores del tipo `La propiedad 'X' no existe en PrismaClient` en el IDE, ejecuta `npx prisma generate` manualmente y reinicia el TS Server del editor (`Ctrl+Shift+P → TypeScript: Restart TS Server`).

---

#### Agregar un nuevo campo a un modelo existente

```prisma
// prisma/schema.prisma — ejemplo: agregar campo a Company
model Company {
  // campos existentes...
  website   String?   // campo nuevo (nullable para no romper datos existentes)
}
```

```bash
npx prisma migrate dev --name add-website-to-company
```

Regla: si el campo es **NOT NULL** sin default y la tabla ya tiene datos, la migración fallará. Opciones:
- Hacerlo nullable (`String?`)
- Darle un default (`@default("")`)
- Editar el SQL generado para hacer un `UPDATE` previo a `ALTER COLUMN`

---

#### Agregar una tabla nueva

1. Definir el modelo en `prisma/schema.prisma` siguiendo las convenciones del proyecto:

```prisma
model Evidence {
  id          Int      @id @default(autoincrement())
  controlId   Int
  companyId   Int
  fileName    String
  fileUrl     String
  uploadedBy  Int
  createdAt   DateTime @default(now())

  control     IsoControl @relation(fields: [controlId], references: [id])
  company     Company    @relation(fields: [companyId], references: [id])
  uploader    User       @relation("EvidenceUploader", fields: [uploadedBy], references: [id])

  @@map("evidences")
}
```

2. Agregar la relación inversa en los modelos relacionados (`IsoControl`, `Company`, `User`).

3. Migrar:
```bash
npx prisma migrate dev --name add-evidences-table
```

4. Crear la interfaz del modelo en `src/models/`:
```typescript
// src/models/evidence.model.ts
export interface EvidenceModel {
  id: number;
  controlId: number;
  companyId: number;
  fileName: string;
  fileUrl: string;
  uploadedBy: number;
  createdAt: Date;
}
```

5. Exportarla desde `src/models/index.ts`.

---

#### Convenciones del schema Prisma

| Convención | Ejemplo |
|---|---|
| Nombres de modelos en PascalCase | `CompanyControl`, `IsoTheme` |
| Nombres de tablas en snake_case con `@@map` | `@@map("company_controls")` |
| Campos de FK con sufijo `Id` | `companyId`, `controlId` |
| Timestamps en todos los modelos | `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt` |
| Campos opcionales con `?` | `description String?` |
| Enums como strings con validación en capa de servicio | No usar Prisma enums — usar `String` + validar en el service |

---

### Agregar un nuevo módulo/endpoint

Todos los módulos siguen exactamente este patrón. Crear los tres archivos:

```
src/modules/<nombre>/
  <nombre>.routes.ts      ← define rutas, aplica authMiddleware
  <nombre>.controller.ts  ← extrae params del request, llama al service
  <nombre>.service.ts     ← toda la lógica + queries Prisma
```

**1. `<nombre>.service.ts`** — importar tipos Prisma para evitar `any` implícito:

```typescript
import type { Prisma } from '@prisma/client';
import prisma from '../../config/database';

type EvidenceRow = Prisma.EvidenceGetPayload<{
  include: { uploader: { select: { name: true } } };
}>;

export async function getEvidences(controlId: number) {
  const rows = await prisma.evidence.findMany({
    where: { controlId },
    include: { uploader: { select: { name: true } } },
  });
  return rows.map((e: EvidenceRow) => ({ ...e }));
}
```

**2. `<nombre>.controller.ts`** — siempre usar `String()` con `req.params`:

```typescript
import type { Request, Response } from 'express';
import * as evidencesService from './evidences.service';

export async function listEvidences(req: Request, res: Response) {
  const controlId = parseInt(String(req.params.controlId));
  const data = await evidencesService.getEvidences(controlId);
  res.json({ data });
}
```

> **Por qué `String(req.params.x)`:** Express 5 tipifica `req.params` como `string | string[]`. Pasar directamente a `parseInt()` genera error TS. Siempre envolver con `String()`.

**3. `<nombre>.routes.ts`:**

```typescript
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import * as ctrl from './evidences.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', ctrl.listEvidences);
router.post('/', ctrl.createEvidence);

export default router;
```

**4. Registrar en `src/routes/index.ts`:**

```typescript
import evidencesRoutes from '../modules/evidences/evidences.routes';

// dentro de la función de rutas:
router.use('/evidences', evidencesRoutes);
```

**5. Si aplica, crear la interfaz en `src/models/evidence.model.ts`** y exportarla desde `src/models/index.ts`.

---

### Convenciones de código

| Aspecto | Regla |
|---|---|
| `req.params` | Siempre `parseInt(String(req.params.id))` — nunca directo |
| `req.query` | Cast explícito: `req.query.page as string` |
| Lambdas en `.map()` / `.filter()` | Tipar el parámetro con `Prisma.XGetPayload<>` o un tipo inline |
| Null safety en relaciones opcionales | Usar `?.` y `?? fallback` (ej: `user?.name ?? 'Sistema'`) |
| Rutas HTTP | Siempre bajo `/api/*`. No exponer rutas sin prefijo |
| Responses de éxito | `res.json({ data: ... })` para items, paginados devuelven `{ data, meta }` |
| Responses de error | `res.status(N).json({ error: 'mensaje' })` |
| Creación exitosa | `res.status(201).json({ data })` |
| Borrado exitoso | `res.status(204).end()` |
| Modelos de dominio | Definir interfaces en `src/models/` — no retornar objetos Prisma directamente |

**Estructura de response paginada:**
```json
{
  "data": [ ...items ],
  "meta": { "page": 1, "limit": 20, "total": 93, "totalPages": 5 }
}
```

---

### Manejo de errores

El error handler global (`src/middleware/errorHandler.ts`) ya captura y transforma:

| Error | HTTP | Cuándo ocurre |
|---|---|---|
| `ZodError` | 400 | Validación de body fallida |
| `PrismaClientKnownRequestError P2002` | 409 | Violación de unique constraint |
| `PrismaClientKnownRequestError P2025` | 404 | Record not found en update/delete |
| Cualquier otro `Error` | 500 | Sin leak de stack trace en producción |

En los servicios **no hace falta try/catch** — dejar que los errores suban al handler. Solo capturar cuando se quiere transformar específicamente el error.

---

### Errores frecuentes y cómo resolverlos

**`La propiedad 'X' no existe en el tipo 'PrismaClient'`**
```bash
# El cliente Prisma del IDE está desactualizado
npx prisma generate
# Luego en VS Code: Ctrl+Shift+P → TypeScript: Restart TS Server
```

**`No se puede asignar un argumento de tipo 'string | string[]'`**
```typescript
// Error: parseInt(req.params.id)
// Fix:
const id = parseInt(String(req.params.id));
```

**`El parámetro 'x' tiene un tipo 'any' implícitamente`**
```typescript
// En callbacks de .map() o .filter() sobre resultados de Prisma:
type MyRow = Prisma.ModelGetPayload<{ include: { ... } }>;
const results = rows.map((row: MyRow) => ({ ... }));
```

**La migración falla por datos existentes**
```bash
# Opción A: hacer el campo nullable
# Opción B: editar prisma/migrations/.../migration.sql para añadir UPDATE antes del ALTER
# Opción C: en dev, resetear todo:
npx prisma migrate reset
```

**El seed falla con "Unique constraint violated"**
```bash
# El seed usa upsert/createMany con skipDuplicates en la mayoría de entidades.x
# Si falla, probablemente los IDs hardcodeados ya existen. Resetear la BD:
npx prisma migrate reset
```

**Error CORS en el frontend**
```bash
# Verificar que CORS_ORIGIN en .env coincide con la URL del frontend
# Por defecto: CORS_ORIGIN=http://localhost:5173
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

- [x] **Módulo Auth** — login, refresh, logout, /me con JWT + rotación de tokens + bloqueo por intentos
- [x] **Middleware de seguridad** — helmet, CORS, rate limiting, auth JWT, RBAC, error handler
- [x] **Prisma Schema** — 24 modelos: auth/RBAC + negocio completo (empresas, controles, activos, riesgos, auditorías, capacitaciones, notificaciones)
- [x] **Seed data** — 35 permisos, 5 roles, 8 módulos, 6 usuarios, 7 sectores, 4 tamaños, 3 empresas, 93 controles ISO 27001:2022, 15 activos, evaluaciones de riesgo, SoA completo
- [x] **Módulo Companies** — CRUD empresas + asignación de usuarios a empresa
- [x] **Módulo Controls** — Catálogo ISO (93 controles, CRUD), asignación a empresas con nivel de madurez, Statement of Applicability
- [x] **Módulo Assets** — CRUD activos de información + evaluaciones de riesgo por activo
- [x] **Módulo Dashboard** — KPIs, compliance por temática, distribución de riesgos, actividad reciente, resumen global
- [x] **Módulo Users** — CRUD usuarios del sistema
- [x] **Módulo Admin** — Gestión de roles, permisos y módulos del sistema
- [x] **Módulo Catalogs** — Catálogos auxiliares (sectores, tamaños de empresa)
- [x] **Capa de modelos (DTOs)** — Interfaces TypeScript en `src/models/` desacopladas de Prisma: `CompanyModel`, `IsoControlModel`, `CompanyControlModel`, `AssetModel`, `UserModel`, `DashboardStatsModel`, etc.
- [x] **Tipos explícitos en servicios** — Todos los callbacks de map/filter tipados con `Prisma.XGetPayload<>` o tipos inline
- [x] **Validación** — Zod para payloads de entrada
- [x] **Protección anti-DDoS** — rate limiting por IP (global + auth)
- [x] **Bloqueo de cuentas** — tras 5 intentos fallidos de login
- [x] **Rotación de refresh tokens** — detección de robo incluida
- [x] **Health check** — `/health`

### Pendiente

- [ ] Audit Trail middleware — registro automático en `audit_log` para mutaciones clave
- [ ] Subida de evidencias de controles (S3 o almacenamiento local)
- [ ] Módulo Auditorías — CRUD auditorías con resultados por control
- [ ] Módulo Capacitaciones — gestión de trainings e asistentes
- [ ] Notificaciones en tiempo real (WebSocket)
- [ ] Exportación reportes PDF (SoA, compliance)

### Planificado (futuro)

- [ ] Integración con pipeline Big Data (datos OpenPhish → riesgo latente)
- [ ] Despliegue AWS (EC2/ECS + RDS + S3)
- [ ] Rate limiter con Redis (producción)

---

## Base de datos — Tablas actuales

### Tablas Auth/RBAC

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

### Tablas de Negocio

| Tabla | Registros seed | Propósito |
|---|---|---|
| `sectors` | 7 | Sectores de actividad económica |
| `company_sizes` | 4 | Tamaños de empresa (micro, pyme, mediana, enterprise) |
| `companies` | 3 | Empresas cliente (TechCorp, RetailGroup, HealthCare) |
| `company_users` | 9 | Asignación consultores↔empresa |
| `company_services` | 5 | Servicios contratados por empresa |
| `iso_themes` | 14 | Temáticas ISO 27001:2022 (A.5 → A.8 + organizacional) |
| `iso_controls` | 93 | Catálogo completo ISO 27001:2022 |
| `statements_of_applicability` | 93 | SoA de TechCorp (todos los controles) |
| `company_controls` | 30 | Controles asignados a empresas con estado y madurez |
| `control_evidences` | 0 | Evidencias de implementación de controles |
| `assets` | 15 | Activos de información de TechCorp |
| `asset_risk_assessments` | 5 | Evaluaciones de riesgo por activo |
| `audits` | 1 | Auditorías internas |
| `audit_results` | 0 | Resultados por control auditado |
| `risk_assessments` | 2 | Evaluaciones globales de riesgo |
| `trainings` | 2 | Capacitaciones programadas |
| `training_attendees` | 0 | Asistentes a capacitaciones |
| `notifications` | 5 | Notificaciones del sistema |