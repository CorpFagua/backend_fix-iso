# Backend Fix-ISO

Este repositorio contiene el **backend** para la aplicación **Fix-ISO**, una herramienta diseñada para facilitar la implementación de la norma **ISO 27001**.

El servidor está desarrollado con **Express** y **TypeScript**, y provee los endpoints necesarios para gestionar configuraciones, usuarios, auditorías y otros recursos relacionados con la normalización de la seguridad de la información.

## Estructura de carpetas

```bash
backend_fix-iso/
├── package.json           # dependencias y scripts
├── tsconfig.json          # configuración de TypeScript
└── src/                   # código fuente
    ├── config/            # variables de entorno y configuración general
    │   └── index.ts
    ├── controllers/       # lógica de los endpoints
    │   └── exampleController.ts
    ├── middleware/        # middlewares de Express (logs, errores, etc.)
    │   └── logger.ts
    ├── models/            # definiciones de tipos/entidades
    │   └── exampleModel.ts
    ├── routes/            # ruteadores de la API
    │   └── index.ts
    └── index.ts           # archivo principal para iniciar la aplicación
```

## Inicio rápido

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```

---

Este README proporciona una visión general del backend y ayuda a entender la organización del proyecto.