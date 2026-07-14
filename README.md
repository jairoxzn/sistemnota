# SistemaNota — Punto de Venta con Nota de Venta en PDF

Sistema web completo (**un solo proyecto**) para administrar **productos, clientes y ventas**,
con generación de **nota de venta imprimible y descargable en PDF**. Listo para producción,
escalable y comercializable para pequeños y medianos negocios.

> **Proyecto unificado:** el frontend (React) y el backend (Express) viven en el mismo
> repositorio, con **un único `package.json`** y **una sola instalación**. En desarrollo
> Vite y Express corren juntos con un solo comando; en producción Express sirve también el
> React ya compilado.

## Stack

| Capa        | Tecnología                                        |
|-------------|---------------------------------------------------|
| Frontend    | React 18 (JavaScript) + Vite + Tailwind CSS       |
| Estado      | Zustand (carrito) + Context (autenticación)       |
| Backend     | Node.js + Express                                 |
| ORM         | Prisma                                            |
| Base datos  | PostgreSQL (Neon)                                 |
| Auth        | JWT (roles ADMIN / SELLER)                        |
| Validación  | Zod (backend y frontend)                          |
| PDF         | jsPDF + jspdf-autotable                           |
| Excel       | SheetJS (xlsx)                                    |
| Gráficos    | Recharts                                          |

## Estructura del proyecto (una sola raíz)

```
sistemnota/
├── package.json          # ÚNICO package.json (front + back)
├── .env                  # variables de entorno (BD, JWT, tienda)
├── vite.config.js        # Vite + proxy /api → Express
├── tailwind.config.js
├── index.html            # entrada del SPA
├── prisma/
│   ├── schema.prisma     # modelos: User, Category, Product, Customer, Sale, SaleDetail
│   └── seed.js           # datos de ejemplo
├── server/               # ── BACKEND (Express) ──
│   ├── config/           # env + cliente Prisma (singleton)
│   ├── controllers/      # handlers HTTP
│   ├── middleware/       # auth, roles, validación (Zod), errores
│   ├── routes/           # endpoints REST
│   ├── services/         # lógica de negocio (transacción de venta)
│   ├── validators/       # esquemas Zod
│   ├── utils/            # jwt, hash, ApiError, cálculo de venta
│   ├── __tests__/        # pruebas de operaciones críticas
│   ├── app.js            # instancia Express (API + SPA)
│   └── index.js          # arranque del servidor
└── src/                  # ── FRONTEND (React) ──
    ├── components/        # UI reutilizable (layout, modales, nota de venta)
    ├── pages/            # Login, Dashboard, POS, Productos, Inventario,
    │                     #   Clientes, Ventas, Reportes, Configuración
    ├── services/         # cliente API (axios)
    ├── context/          # AuthContext
    ├── store/            # carrito (Zustand)
    ├── hooks/            # useDebounce
    ├── utils/            # generación de PDF, exportar Excel, formato
    ├── App.jsx           # rutas + protección por rol
    └── main.jsx          # punto de entrada React
```

## Requisitos

- Node.js 18+ (probado con 22)
- Una base de datos PostgreSQL (Neon ya viene configurada en `.env`)

## Puesta en marcha (3 pasos)

```bash
# 1. Instalar todo (una sola vez, un solo package.json)
npm install

# 2. Preparar la base de datos
npm run prisma:generate     # genera el cliente Prisma
npm run prisma:push         # crea las tablas en Neon
npm run seed                # carga datos de ejemplo

# 3. Levantar el sistema completo (API :4000 + Web :5173)
npm run dev
```

Abre **http://localhost:5173** en el navegador.

## Scripts disponibles

| Script                    | Descripción                                          |
|---------------------------|------------------------------------------------------|
| `npm run dev`             | Levanta API (:4000) y frontend (:5173) juntos        |
| `npm run dev:server`      | Solo el backend (con recarga)                        |
| `npm run dev:client`      | Solo el frontend (Vite)                              |
| `npm run build`           | Compila el React a `dist/`                            |
| `npm start`               | Producción: Express sirve API **y** el SPA de `dist/`|
| `npm run seed`            | Carga datos de ejemplo                               |
| `npm test`                | Pruebas de operaciones críticas                      |
| `npm run prisma:studio`   | Explorador visual de la base de datos                |

## Credenciales de ejemplo (tras `npm run seed`)

| Rol      | Email                    | Contraseña   |
|----------|--------------------------|--------------|
| Admin    | admin@sistemnota.com     | Admin123!    |
| Vendedor | vendedor@sistemnota.com  | Vendedor123! |

- **Administrador**: acceso completo (productos, categorías, reportes, usuarios).
- **Vendedor/Cajero**: punto de venta, clientes, historial y notas de venta.

## Endpoints REST

Base URL: `http://localhost:4000/api`

### Auth
| Método | Ruta            | Rol      | Descripción                   |
|--------|-----------------|----------|-------------------------------|
| POST   | /auth/login     | público  | Iniciar sesión (devuelve JWT) |
| POST   | /auth/register  | ADMIN    | Crear usuario                 |
| GET    | /auth/me        | auth     | Perfil del usuario actual     |

### Productos
| Método | Ruta            | Rol   | Descripción                        |
|--------|-----------------|-------|------------------------------------|
| GET    | /products       | auth  | Listar (search, categoryId, page)  |
| GET    | /products/:id   | auth  | Detalle                            |
| POST   | /products       | ADMIN | Crear                              |
| PUT    | /products/:id   | ADMIN | Editar                             |
| DELETE | /products/:id   | ADMIN | Eliminar (lógico si tiene ventas)  |

### Categorías
| Método | Ruta              | Rol   |
|--------|-------------------|-------|
| GET    | /categories       | auth  |
| POST   | /categories       | ADMIN |
| PUT    | /categories/:id   | ADMIN |
| DELETE | /categories/:id   | ADMIN |

### Clientes
| Método | Ruta            | Rol   |
|--------|-----------------|-------|
| GET    | /customers      | auth  |
| GET    | /customers/:id  | auth  |
| POST   | /customers      | auth  |
| PUT    | /customers/:id  | auth  |
| DELETE | /customers/:id  | ADMIN |

### Ventas / Notas de venta
| Método | Ruta          | Rol   | Descripción                        |
|--------|---------------|-------|------------------------------------|
| GET    | /sales        | auth  | Historial (page, from, to)         |
| GET    | /sales/:id    | auth  | Detalle de nota + datos de tienda  |
| POST   | /sales        | auth  | Crear venta (transacción atómica)  |

### Ventas — anulación
| Método | Ruta               | Rol   | Descripción                              |
|--------|--------------------|-------|------------------------------------------|
| POST   | /sales/:id/cancel  | ADMIN | Anula la venta y repone stock (con motivo)|

### Cotizaciones / Proformas
| Método | Ruta                | Rol   | Descripción                                    |
|--------|---------------------|-------|------------------------------------------------|
| GET    | /quotes             | auth  | Listar (filtro status, page)                   |
| GET    | /quotes/:id         | auth  | Detalle + datos de tienda                      |
| POST   | /quotes             | auth  | Crear cotización (NO afecta stock)             |
| POST   | /quotes/:id/convert | auth  | Convertir en venta (valida y descuenta stock)  |
| POST   | /quotes/:id/cancel  | auth  | Anular cotización                              |

### Catálogo público (sin autenticación)
| Método | Ruta                    | Rol      | Descripción                                 |
|--------|-------------------------|----------|---------------------------------------------|
| GET    | /public/catalog         | público  | Productos activos (nombre, precio, imagen)  |

### Usuarios (gestión desde la UI)
| Método | Ruta                  | Rol   | Descripción                          |
|--------|-----------------------|-------|--------------------------------------|
| GET    | /users                | ADMIN | Listar (search, page)                |
| POST   | /users                | ADMIN | Crear usuario                        |
| PUT    | /users/:id            | ADMIN | Editar (nombre, correo, rol, activo) |
| PATCH  | /users/:id/password   | ADMIN | Resetear contraseña                  |

### Caja diaria / Arqueo
| Método | Ruta          | Rol   | Descripción                                        |
|--------|---------------|-------|----------------------------------------------------|
| GET    | /cash/current | auth  | Caja abierta + arqueo en vivo por método de pago   |
| POST   | /cash/open    | auth  | Abrir caja (monto inicial)                         |
| POST   | /cash/close   | auth  | Cerrar caja (contado vs. esperado = diferencia)    |
| GET    | /cash         | auth  | Historial de sesiones                              |
| GET    | /cash/:id     | auth  | Detalle de una sesión                              |

> El catálogo se comparte con clientes vía enlace `/catalog` o **código QR** (menú Catálogo QR).
> Los productos aceptan **imagen** (base64) editable desde el módulo de Productos.

### Inventario (kardex)
| Método | Ruta               | Rol   | Descripción                                    |
|--------|--------------------|-------|------------------------------------------------|
| GET    | /stock-movements   | auth  | Historial de movimientos (filtro type, productId)|
| POST   | /stock-movements   | ADMIN | Registrar ENTRY (entrada), ADJUSTMENT o LOSS   |

### Configuración de la tienda
| Método | Ruta       | Rol   | Descripción                                  |
|--------|------------|-------|----------------------------------------------|
| GET    | /settings  | auth  | Datos de la tienda (nombre, RUC, logo…)      |
| PUT    | /settings  | ADMIN | Editar datos + logo (base64) + umbral stock  |

### Reportes
| Método | Ruta                       | Rol   | Descripción                     |
|--------|----------------------------|-------|---------------------------------|
| GET    | /reports/summary           | auth  | Métricas del dashboard          |
| GET    | /reports/sales?period=day  | auth  | Ventas por día/semana/mes       |
| GET    | /reports/top-products      | auth  | Productos más vendidos          |
| GET    | /reports/stock             | auth  | Stock actual                    |
| GET    | /reports/low-stock         | auth  | Productos por reabastecer       |

> Las métricas y reportes **excluyen las ventas anuladas**.

## Características clave de calidad

- **Transacción atómica de venta** (`prisma.$transaction`): valida stock, calcula totales en
  el servidor y descuenta inventario; si algo falla, se revierte todo.
- **Prevención de errores comunes**: stock negativo, cantidades ≤ 0, descuento mayor al
  subtotal y productos inexistentes se rechazan con mensajes claros.
- **Validación doble** (frontend + backend con Zod).
- **Manejo centralizado de errores** y traducción de errores de Prisma.
- **Seguridad**: contraseñas con bcrypt, JWT, Helmet, CORS y rate-limiting.
- **Correlativo automático** de nota de venta (`NV-000001`).
- Código modular por capas (rutas → controllers → services → utils) siguiendo SOLID.

## Variables de entorno (`.env`)

```
DATABASE_URL=...        # URL pooled de Neon
DIRECT_URL=...          # URL directa (migraciones)
PORT=4000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=...          # cámbialo en producción
JWT_EXPIRES_IN=8h
STORE_NAME=Mi Tienda    # aparece en la nota de venta
STORE_RUC=...
STORE_ADDRESS=...
STORE_PHONE=...
STORE_EMAIL=...
CURRENCY=S/
VITE_API_URL=/api
```

## Migraciones (despliegues versionados)

El proyecto usa **migraciones reales de Prisma** (carpeta `prisma/migrations/`), no `db push`.

```bash
# Aplicar migraciones pendientes (producción / al desplegar)
npm run prisma:deploy      # = prisma migrate deploy

# Ver estado de migraciones
npx prisma migrate status
```

Para crear una nueva migración tras cambiar `schema.prisma` (sin necesidad de shadow DB,
compatible con Neon):

```bash
TS=$(date +%Y%m%d%H%M%S)
mkdir -p prisma/migrations/${TS}_mi_cambio
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/${TS}_mi_cambio/migration.sql
npm run prisma:deploy
```

> La primera migración `0_init` es el *baseline* del esquema completo; las siguientes
> son incrementales. En un entorno nuevo, `prisma migrate deploy` crea toda la base.

## Despliegue

Al ser un solo proyecto, la forma más simple es desplegar todo junto:

- **Todo-en-uno (Railway / Render / Fly.io)**: build `npm install && npm run build`,
  start `npm start`. Express sirve la API y el SPA. Ejecuta `npx prisma migrate deploy`
  (o `prisma db push`) en el release. Configura las variables de entorno del `.env`.
- **Separado (opcional)**: frontend en **Vercel** (build `npm run build`, output `dist`,
  variable `VITE_API_URL` apuntando al backend público) y backend en Railway/Render.

## Pruebas

```bash
npm test
```

Cubre las operaciones críticas: hashing de contraseñas, cálculo de subtotal/total,
aplicación de descuento y validación de stock insuficiente.
