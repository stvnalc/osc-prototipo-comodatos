# Plan para añadir el backend Laravel al prototipo de Comodatos

**Repositorio del prototipo:** `stvnalc/osc-prototipo-comodatos`  
**Repositorio destino:** `RichardAgain/osc-inventario-laravel`  
**Módulo:** Comodatos, instrumentos, integrantes, sedes y consulta por código  
**Stack del backend:** Laravel 12, PHP 8.2 (ver nota), MariaDB 10.11, Sanctum, DomPDF  
**Fecha del plan:** 2026-10-22 (Emilio) · **Revisado:** 2026-10-23 (Steven)

---

## 0. Cómo usar este plan con la IA

Este documento es la guía que debe seguir el asistente de IA (Claude Code u otro) al trabajar en
`osc-inventario-laravel`. Al iniciar una sesión, pásale este archivo y dile qué fase toca. Reglas:

1. **Una fase = una rama = un PR.** No mezclar fases. Ramas `feat/comodatos-fase-N-<tema>`.
2. **Partir de `main`**, no de `dev` (ver 0.1). Los PR van contra la rama que acuerde el equipo.
3. **Compatibilidad con PHP 8.2.** El equipo bajó el proyecto a 8.2 a propósito (commit `ba1c903`,
   `composer.json` fija `"php": "8.2.0"` como plataforma). Prohibido usar sintaxis exclusiva de 8.3
   (constantes de clase tipadas, `json_validate()`, `#[\Override]`, etc.).
4. **Seguir el README del repo Laravel** al pie de la letra: Form Requests → Services con
   `DB::transaction` → controladores delgados en `Controllers/Api`, DTOs, Enums y `AppException`.
   Si este plan y el README chocan, manda el README.
5. **Nombres del dominio en español** y la terminología acordada: *integrante* (nunca "estudiante"),
   *sede* (nunca "núcleo"), *comodato archivado* / *Historial* (nunca "eliminar comodato").
6. **Nada se borra físicamente** si tiene historial (ver 7.9).
7. Cada PR incluye migraciones, tests (`php artisan test` en verde), `vendor/bin/pint --test` en verde
   y una nota breve en el README.
8. Ante una decisión pendiente de la sección 14, **usar el supuesto indicado y dejarlo anotado**
   en el PR; no inventar reglas nuevas.
9. El prototipo (`stvnalc/osc-prototipo-comodatos`, demo en
   https://osc-prototipo-comodatos.vercel.app) es la **referencia funcional y visual**: tipos en
   `src/lib/types.ts`, reglas en `src/lib/store.tsx`, contrato en `src/lib/pdf.ts`.

### 0.1 Correcciones aplicadas al plan original

| # | El plan original decía | Realidad / decisión |
| --- | --- | --- |
| 1 | PHP 8.3 | El proyecto es **compatible con 8.2** (commit `ba1c903`). El README aún dice 8.3: hay que corregirlo. |
| 2 | No existe `docker-compose.yml` | Existe `docker-compose.yaml` (servicio `mariadb_service`, contenedor `mariadb_mirror`), commit `4848600`. |
| 3 | `dev` está más actualizada que `main` | Al 2026-10-23 es al revés: **`main` va 1 commit por delante** (el del Docker). Partir de `main` o sincronizar `dev` primero. |
| 4 | — (no se menciona) | `.env.example` trae `DB_USERNAME=root` y el contenedor muere con `ERROR 1396 ... CREATE USER failed for 'root'@'%'`. Usar un usuario no-root (p. ej. `osc`). Corregirlo en la Fase 0. |
| 5 | Fase 7: conectar el prototipo a la API | **Fuera del alcance.** Lo acordado el 2026-10-03 es trabajar sobre PHP; el prototipo queda como referencia. La UI se construye directo en `resources/js/src/features/comodatos` (JS + Bootstrap, como el resto del repo). Ver Fase 7 revisada. |
| 6 | Roles completos en la Fase 2 | Los roles siguen sin definir (pregunta abierta). Fase 2 = **login con un solo rol `admin`** y la columna `rol` preparada; policies por rol cuando la fundación responda. |
| 7 | — | **`User.php` usa `#[Fillable]` y `#[Hidden]`, que son de Laravel 13.** En Laravel 12 PHP los ignora sin avisar: `User::create()` falla y el hash de la contraseña sale en el JSON. Usar `$fillable` / `$hidden`. Ojo con copiar ejemplos de Laravel 13. |
| 8 | — | Otros problemas del repo base a tener en cuenta: `utils/zodValidations.js` usa `error.errors` (en Zod 4 es `error.issues`), `Confirm.jsx` importa `prop-types` sin declararlo en `package.json`, y `app.blade.php` apunta a un `/favicon.svg` que no existe. |

---

## 1. Objetivo

Convertir el prototipo navegable (React + localStorage) en un sistema con persistencia real, implementando primero la **API REST en Laravel** dentro de `osc-inventario-laravel`, siguiendo la arquitectura definida en su README:

- Controladores delgados.
- Form Requests para validación.
- Services para reglas de negocio y transacciones.
- DTOs y Enums para el dominio.
- Excepciones de dominio y manejador global de errores.
- Modelos Eloquent y migraciones.
- Frontend React consumiendo la API mediante la instancia compartida de Axios.

El prototipo seguirá siendo la referencia funcional y visual. La primera entrega será el backend; después se construye la UI dentro del repo Laravel (no se conecta el prototipo a la API, ver 0.1).

---

## 2. Diagnóstico de ambos repositorios

### 2.1 Prototipo actual

| Aspecto | Estado actual |
| --- | --- |
| Frontend | Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui |
| Persistencia | `localStorage` con la clave `osc-comodatos-demo-v3` |
| Datos | Semilla ficticia: 3 sedes, 36 instrumentos, 16 integrantes, 14 comodatos activos y 4 archivados |
| API | No existe; se simula con `src/lib/store.tsx` |
| Validación | En el cliente, dentro de los diálogos |
| Autenticación | No existe; todo asume permisos de administrador |
| PDF | Generado en el navegador con jsPDF |
| Fotos | Data URL guardada en `localStorage` |
| Entidades | `Sede`, `Instrumento`, `Integrante`, `Representante`, `Comodato` |
| Rutas | Panel, Consulta, Instrumentos, Comodatos, Integrantes, Sedes, Novedades |

Lógica que hoy vive en el cliente y debe pasar al servidor:

- Generación del código de instrumento (`Pi004-FOSC`).
- Generación del código de comodato (`CMD-2026-0001`).
- Cambio de estado del instrumento al crear/archivar un comodato.
- Regla de un solo comodato activo por instrumento.
- Archivado del comodato con fecha y motivo.
- Búsqueda tolerante por código (`Pi001`, `Pi001-FOSC`, etc.).
- Validaciones de unicidad de serial, cédula y códigos.
- Regla del contrato a nombre del representante cuando el integrante es menor de edad.

### 2.2 Repositorio Laravel actual

| Aspecto | Estado actual |
| --- | --- |
| Backend | Laravel 12, esqueleto base sin modelos de negocio |
| Rutas API | No existe `routes/api.php` |
| Base de datos | MariaDB configurada en `.env.example`, sin migraciones del dominio |
| Frontend | React 19 integrado con Vite, Bootstrap, Tailwind, Axios y Zod |
| Autenticación | Axios ya espera sesión por cookies (`withCredentials`) y redirección en `401` |
| Convención de login | La instancia Axios detecta `/usuarios/login` |
| Arquitectura | Documentada en el README: Requests, Services, DTOs, Enums, Exceptions |
| Docker | `docker-compose.yaml` con MariaDB 10.11 (solo en `main`); `.env.example` trae `DB_USERNAME=root`, que impide arrancar el contenedor |
| PHP | `composer.json` fija la plataforma en 8.2 (el README todavía dice 8.3) |
| PDF | No implementado; se recomienda `barryvdh/laravel-dompdf` |
| Pruebas | Solo los ejemplos por defecto de Laravel |

### 2.3 Brechas principales

1. No hay base de datos del dominio.
2. No hay API REST.
3. No hay validación del lado servidor.
4. No hay autenticación ni roles.
5. El PDF se genera en el cliente.
6. Las fotos no tienen almacenamiento real.
7. No hay tests de las reglas de negocio.
8. No existe contrato formal de request/response entre prototipo y backend.
9. El entorno de base de datos existe pero no arranca con el `.env.example` tal cual (`DB_USERNAME=root`).

---

## 3. Decisión de arquitectura

### Opción recomendada

Implementar la API dentro de `osc-inventario-laravel`, una rama por fase (`feat/comodatos-fase-N-<tema>`), partiendo de `main` (hoy va por delante de `dev`; si el equipo sincroniza `dev`, se puede partir de ahí).

```text
SPA React del repo Laravel (resources/js/src/features/comodatos)
        |
        | Axios compartido, mismo origen, cookies (/api)
        v
Laravel 12 (localhost:8000)  --->  MariaDB 10.11 (Docker)
```

No se recomienda crear un segundo Laravel dentro del repo del prototipo: duplicaría la arquitectura y dificultaría el despliegue.

### Implicaciones para el prototipo

- **No se conecta a la API.** Sigue con `localStorage` y desplegado en Vercel como demo para la fundación.
- Sirve de referencia: los nombres de campos del backend se alinean con `src/lib/types.ts`
  (pasando de camelCase a snake_case: `fechaNacimiento` → `fecha_nacimiento`, `archivadoEn` → `archivado_en`).
- Al ser mismo origen, no hace falta configurar CORS.

---

## 4. Estructura backend propuesta

```text
app/
├── DTOs/
│   ├── Comodato/ActualizarComodatoDTO.php
│   ├── Comodato/CrearComodatoDTO.php
│   ├── Instrumento/ActualizarInstrumentoDTO.php
│   └── Instrumento/CrearInstrumentoDTO.php
├── Enums/
│   ├── CondicionFisica.php
│   ├── EstadoInstrumento.php
│   ├── FamiliaInstrumento.php
│   └── RolUsuario.php
├── Exceptions/
│   ├── AppException.php
│   ├── ComodatoNoDisponibleException.php
│   ├── InstrumentoNoDisponibleException.php
│   └── ReglaDeNegocioException.php
├── Http/
│   ├── Controllers/Api/
│   │   ├── AuthController.php
│   │   ├── ComodatoController.php
│   │   ├── ConsultaController.php
│   │   ├── InstrumentoController.php
│   │   ├── IntegranteController.php
│   │   ├── PanelController.php
│   │   └── SedeController.php
│   ├── Middleware/
│   │   └── EnsureUserHasRole.php
│   ├── Requests/
│   │   ├── Comodato/
│   │   ├── Instrumento/
│   │   ├── Integrante/
│   │   └── Sede/
│   └── Resources/
│       ├── ComodatoResource.php
│       ├── InstrumentoResource.php
│       ├── IntegranteResource.php
│       └── SedeResource.php
├── Models/
│   ├── Comodato.php
│   ├── Instrumento.php
│   ├── Integrante.php
│   ├── Representante.php
│   ├── Sede.php
│   └── User.php
├── Policies/
│   ├── ComodatoPolicy.php
│   └── InstrumentoPolicy.php
└── Services/
    ├── CodigoService.php
    ├── ComodatoService.php
    ├── ContratoPdfService.php
    ├── InstrumentoService.php
    ├── IntegranteService.php
    ├── PanelService.php
    └── SedeService.php
bootstrap/app.php
routes/api.php
routes/web.php
database/
├── factories/
├── migrations/
└── seeders/
tests/
├── Feature/Api/
└── Unit/Services/
```

---

## 5. Modelo de datos

Se usan nombres de tabla en español, alineados con el dominio y con el prototipo.

### 5.1 `sedes`

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | bigint unsigned | PK |
| nombre | varchar(120) | único, requerido |
| direccion | varchar(255) | requerido |
| detalle | varchar(255) | nullable |
| timestamps | datetime | |

Relaciones:

- `hasMany` Instrumento.
- `hasMany` Integrante.
- `hasMany` Comodato.

### 5.2 `integrantes`

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | bigint unsigned | PK |
| nombre | varchar(255) | requerido, indexado |
| cedula | varchar(30) | nullable, único cuando no es null |
| rif | varchar(30) | nullable |
| fecha_nacimiento | date | requerida |
| telefono | varchar(30) | requerido |
| email | varchar(255) | requerido |
| sede_id | bigint unsigned | FK `sedes`, `restrictOnDelete` |
| catedra | varchar(120) | requerido |
| direccion_fiscal | text | requerido |
| timestamps | datetime | |

Relaciones:

- `belongsTo` Sede.
- `hasOne` Representante.
- `hasMany` Comodato.

### 5.3 `representantes`

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | bigint unsigned | PK |
| integrante_id | bigint unsigned | FK `integrantes`, único, `cascadeOnDelete` |
| nombre | varchar(255) | requerido |
| cedula | varchar(30) | nullable |
| rif | varchar(30) | nullable |
| telefono | varchar(30) | nullable |
| parentesco | varchar(80) | requerido, default `Representante` |
| timestamps | datetime | |

Se modela como tabla separada para mantener una entidad por tabla y permitir que sea opcional.

### 5.4 `instrumentos`

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | bigint unsigned | PK |
| codigo | varchar(30) | único, generado en servidor |
| abreviatura | varchar(4) | requerido, 2 a 4 letras |
| nombre | varchar(160) | requerido |
| familia | varchar(40) | requerido, indexado, validado por enum |
| marca | varchar(120) | requerido |
| modelo | varchar(120) | requerido |
| serial | varchar(120) | único, requerido |
| medida | varchar(60) | nullable |
| material | varchar(120) | nullable |
| anio_adquisicion | smallint unsigned | requerido |
| condicion | varchar(30) | requerido, enum |
| estado | varchar(30) | requerido, enum, default `disponible` |
| sede_id | bigint unsigned | FK `sedes`, nullable, `restrictOnDelete` |
| accesorios | json | default `[]` |
| observaciones | text | nullable |
| foto_path | varchar(255) | nullable |
| timestamps | datetime | |

Índices recomendados: `codigo`, `serial`, `estado`, `familia`, `sede_id`.

Relaciones:

- `belongsTo` Sede.
- `hasMany` Comodato.
- `hasOne` Comodato activo (filtrado por `archivado_en IS NULL`).

### 5.5 `comodatos`

| Columna | Tipo | Restricciones |
| --- | --- | --- |
| id | bigint unsigned | PK |
| codigo | varchar(20) | único, generado en servidor |
| instrumento_id | bigint unsigned | FK `instrumentos`, `restrictOnDelete` |
| integrante_id | bigint unsigned | FK `integrantes`, `restrictOnDelete` |
| sede_id | bigint unsigned | FK `sedes`, `restrictOnDelete` |
| fecha_inicio | date | requerida |
| fecha_fin | date | requerida, posterior a `fecha_inicio` |
| condicion_entrega | varchar(30) | requerido, enum |
| observaciones | text | nullable |
| archivado_en | timestamp | nullable |
| motivo_archivo | text | nullable |
| creado_por | bigint unsigned | FK `users`, nullable, `nullOnDelete` |
| archivado_por | bigint unsigned | FK `users`, nullable, `nullOnDelete` |
| timestamps | datetime | |

Índices recomendados: `codigo`, `instrumento_id`, `integrante_id`, `fecha_fin`, `archivado_en`.

Relaciones:

- `belongsTo` Instrumento.
- `belongsTo` Integrante.
- `belongsTo` Sede.
- `belongsTo` User como creador y como archivador.

### 5.6 Regla de unicidad del comodato activo

Un instrumento no puede tener dos comodatos activos. Se implementará con:

1. Transacción + `lockForUpdate()` sobre el instrumento.
2. Verificación explícita en `ComodatoService`.
3. Índice compuesto para consultas rápidas.
4. Prueba de integración que intente crear dos comodatos activos para el mismo instrumento.

Opcional para reforzar en MariaDB: columna generada `activo` y único `(instrumento_id, activo)`. No se recomienda como única defensa porque complica la portabilidad de los tests.

### 5.7 `novedades`

No forma parte del backend inicial. El historial de cambios del prototipo es contenido estático y puede quedar en el frontend o moverse después a una tabla administrable.

---

## 6. Enums del dominio

```text
EstadoInstrumento: disponible | comodato | reparacion
FamiliaInstrumento: Cuerdas frotadas | Cuerdas pulsadas | Viento madera |
                    Viento metal | Percusión | Piano/Teclados
CondicionFisica: Excelente | Buena | Regular | Deteriorada
RolUsuario: admin | operador | consulta   (por ahora solo se usa admin)
```

Los valores deben coincidir exactamente con `FAMILIAS` y `CONDICIONES` de `src/lib/types.ts` del prototipo.

Los enums de PHP se usan para tipar Services y Requests. En base de datos se guardan como `string` validado con `Rule::enum`, para permitir agregar valores sin migraciones destructivas.

---

## 7. Reglas de negocio que deben vivir en el backend

### 7.1 Código de instrumento

- Formato: `{Abreviatura}{Correlativo:3}-FOSC`.
- Abreviatura normalizada: primera letra mayúscula, resto minúscula.
- Longitud: 2 a 4 letras.
- Correlativo calculado por abreviatura, tomando el máximo existente.
- Generación dentro de una transacción para evitar duplicados concurrentes.
- El cliente no envía el código; el servidor lo genera y lo devuelve.
- Si se edita la abreviatura, el código se regenera solo si no existen comodatos históricos asociados; en caso contrario se rechaza el cambio o se conserva el código. Decisión a confirmar.

### 7.2 Código de comodato

- Formato: `CMD-{Año}-{Correlativo:4}`.
- Correlativo por año, incluyendo comodatos archivados.
- Nunca se reutiliza un código.
- Generación transaccional con índice único y reintento ante colisión.

### 7.3 Creación de comodato

- El instrumento debe existir y estar en estado `disponible`.
- El instrumento no puede tener otro comodato activo.
- El integrante y la sede deben existir.
- `fecha_fin` debe ser posterior a `fecha_inicio`. Ciclo acordado: se recoge en diciembre y se
  reentrega en enero; el frontend ofrece el atajo "Recolección de diciembre" (15 de diciembre).
- Al crear el comodato, en la misma transacción:
  - Se crea el comodato.
  - El instrumento pasa a `comodato`.
  - Se registra `creado_por`.
- La condición de entrega por defecto es la condición actual del instrumento.

### 7.4 Actualización de comodato

- Solo se permite editar comodatos activos.
- No se puede cambiar el instrumento por uno que esté en comodato.
- Si cambia la sede, se actualiza la sede del comodato.
- No se permite modificar `codigo`, `archivado_en` ni `motivo_archivo` desde este endpoint.

### 7.5 Archivado (recibir instrumento)

- El comodato debe estar activo.
- `motivo_archivo` es obligatorio y debe tener al menos 3 caracteres.
- Se registra `archivado_en` con la fecha y hora actual.
- Se registra `archivado_por`.
- El instrumento vuelve a `disponible`.
- El instrumento queda en la sede indicada al recibir; si no se indica, vuelve a su sede de resguardo original.
- El comodato no se elimina; queda en el historial.

### 7.6 Reparación

- Solo un instrumento `disponible` puede pasar a `reparacion`.
- No se puede enviar a reparación un instrumento con comodato activo.
- Un instrumento en `reparacion` puede marcarse como reparado y volver a `disponible`.
- Se puede guardar una observación del taller.
- Estado futuro pendiente: si el instrumento está en un taller externo, definir si `sede_id` puede ser null o si se crea una sede/taller.

### 7.7 Consulta por código

- Normalizar la entrada: mayúsculas, quitar espacios y guiones, quitar sufijo `-FOSC`.
- Buscar primero coincidencia exacta y luego coincidencia parcial.
- Devolver:
  - Instrumento.
  - Comodato activo, si existe.
  - Integrante asignado.
  - Sede de resguardo.
  - Sede durante el comodato.
  - Ficha técnica completa.

### 7.8 Contrato

- Si el integrante es menor de 18 años y tiene representante, el contrato se emite a nombre del representante.
- Si es menor y no tiene representante, se emite a nombre del integrante y se registra una advertencia.
- Si es mayor de edad, se emite a nombre del integrante, aunque tenga representante.
- La edad se calcula en el servidor con la fecha de nacimiento y la zona horaria `America/Caracas`.
- El RIF de la fundación y el texto legal se externalizan en `config/contrato.php` para no recompilar el código cuando cambien.

### 7.9 Auditoría y borrado

- Instrumentos, integrantes y comodatos no se eliminan físicamente si tienen historial.
- Sedes: decidir si se permite eliminar solo cuando no tengan registros asociados.
- Añadir `creado_por` y `archivado_por` en comodatos desde el inicio.
- Un historial de actividad global puede quedar para una fase posterior.

---

## 8. Contrato de la API

Prefijo: `/api`. Sin versión en la URL para mantener compatibilidad con `VITE_API_BASE_URL=/api`.

### 8.1 Autenticación

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/api/usuarios/login` | Iniciar sesión (cookie de sesión Sanctum) |
| POST | `/api/usuarios/logout` | Cerrar sesión |
| GET | `/api/usuarios/me` | Usuario actual y rol |

La ruta de login debe ser `/usuarios/login` porque el interceptor de Axios del repo destino ya la reconoce.

### 8.2 Catálogos y sedes

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/catalogos` | Familias, condiciones, estados y roles |
| GET | `/api/sedes` | Listar sedes |
| POST | `/api/sedes` | Crear sede (admin) |
| PUT | `/api/sedes/{sede}` | Editar sede (admin) |
| DELETE | `/api/sedes/{sede}` | Eliminar sede sin registros (admin) |

### 8.3 Instrumentos

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/instrumentos` | Listar con filtros y paginación |
| POST | `/api/instrumentos` | Crear instrumento (multipart, foto opcional) |
| GET | `/api/instrumentos/{instrumento}` | Ver ficha |
| PUT/PATCH | `/api/instrumentos/{instrumento}` | Editar ficha |
| GET | `/api/instrumentos/buscar?codigo=` | Consulta tolerante por código |
| POST | `/api/instrumentos/{instrumento}/reparacion` | Enviar a reparación |
| POST | `/api/instrumentos/{instrumento}/reparado` | Marcar como reparado |

Parámetros de listado:

```text
q, estado, familia, sede_id, page, limit, sort, direction
```

### 8.4 Integrantes

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/integrantes` | Listar con búsqueda y paginación |
| POST | `/api/integrantes` | Crear integrante con representante opcional |
| GET | `/api/integrantes/{integrante}` | Ver ficha |
| PUT/PATCH | `/api/integrantes/{integrante}` | Editar integrante y representante |
| GET | `/api/integrantes/{integrante}/comodatos` | Historial del integrante |

### 8.5 Comodatos

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/comodatos` | Listar activos o archivados |
| POST | `/api/comodatos` | Crear comodato |
| GET | `/api/comodatos/{comodato}` | Ver comodato |
| PUT/PATCH | `/api/comodatos/{comodato}` | Editar comodato activo |
| POST | `/api/comodatos/{comodato}/archivar` | Recibir instrumento y archivar |
| GET | `/api/comodatos/{comodato}/contrato` | Descargar contrato PDF |

Parámetros de listado:

```text
estado=activos|archivados, q, page, limit, sort, direction
```

### 8.6 Panel y consulta

| Método | Ruta | Uso |
| --- | --- | --- |
| GET | `/api/panel` | Totales, comodatos que requieren atención (vencidos o ≤15 días para la devolución), distribución por familia y recientes |

> El aviso de "requieren atención" vive **solo en el panel**. La lista de comodatos tiene únicamente
> las pestañas *Activos* e *Historial*: las de "Por vencer" y "Vencidos" se quitaron el 2026-10-03.
| GET | `/api/consulta?codigo=` | Ficha integrada: instrumento, comodato, integrante y sedes |

### 8.7 Formato de paginación

Usar el formato estándar de Laravel API Resources:

```json
{
  "data": [],
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": null
  },
  "meta": {
    "current_page": 1,
    "from": 1,
    "last_page": 3,
    "per_page": 15,
    "to": 15,
    "total": 36
  }
}
```

### 8.8 Formato de errores

Alineado con el README del repo destino:

| Excepción | HTTP | Código |
| --- | --- | --- |
| `AppException` de dominio | definido por la excepción | nombre del error |
| `ModelNotFoundException` | 404 | `RECURSO_NO_ENCONTRADO` |
| `ValidationException` | 422 | `VALIDACION_FALLIDA` + `details` |
| `QueryException` por FK | 409 | `RESTRICCION_DE_DATOS` |
| `Throwable` no controlado | 500 | `ERROR_INTERNO` |

Ejemplo:

```json
{
  "error": "VALIDACION_FALLIDA",
  "message": "Los datos enviados no son válidos.",
  "details": {
    "serial": ["Ya existe un instrumento con este serial."]
  }
}
```

---

## 9. Ejemplos de payload

### 9.1 Crear instrumento

`POST /api/instrumentos` con `multipart/form-data`:

```json
{
  "abreviatura": "Pi",
  "nombre": "Piano vertical",
  "familia": "Piano/Teclados",
  "marca": "Yamaha",
  "modelo": "U1",
  "serial": "YA123456",
  "medida": null,
  "material": "Madera",
  "anio_adquisicion": 2022,
  "condicion": "Excelente",
  "sede_id": 1,
  "accesorios": ["Banqueta", "Cubierta"],
  "observaciones": null,
  "foto": "archivo.jpg"
}
```

El servidor devuelve el `codigo` generado.

### 9.2 Crear comodato

`POST /api/comodatos`:

```json
{
  "instrumento_id": 12,
  "integrante_id": 3,
  "sede_id": 2,
  "fecha_inicio": "2026-10-22",
  "fecha_fin": "2027-04-22",
  "condicion_entrega": "Buena",
  "observaciones": "Se entrega con estuche nuevo."
}
```

### 9.3 Archivar comodato

`POST /api/comodatos/25/archivar`:

```json
{
  "sede_id": 1,
  "motivo_archivo": "Creció y se le dio otro instrumento."
}
```

### 9.4 Consulta por código

`GET /api/consulta?codigo=Pi001-FOSC`

```json
{
  "data": {
    "instrumento": {},
    "comodato_activo": {},
    "integrante": {},
    "sede_resguardo": {},
    "sede_comodato": {}
  }
}
```

---

## 10. Fases de implementación

### Fase 0 — Preparación del repo y entorno

- [ ] Crear rama `feat/comodatos-fase-0-entorno` desde `main` (o desde `dev` si ya se sincronizó con `main`).
- [ ] Verificar PHP 8.2+, Composer 2, Node 18+ y Docker. Corregir en el README "PHP 8.3" → "PHP 8.2".
- [ ] Cambiar `DB_USERNAME=root` por un usuario no-root (p. ej. `osc`) en `.env.example`. Si ya se
      levantó el contenedor con `root`, borrar el volumen con `docker compose down -v`.
- [ ] Copiar `.env.example` a `.env` y configurar credenciales.
- [ ] Levantar MariaDB con `docker compose up -d mariadb_service` (el `docker-compose.yaml` ya existe).
- [ ] Ejecutar `php artisan key:generate`.
- [ ] Ejecutar `composer install` y `npm install`.
- [ ] Instalar Sanctum y crear `routes/api.php` con `php artisan install:api`.
- [ ] Instalar DomPDF con `composer require barryvdh/laravel-dompdf`.
- [ ] Configurar `bootstrap/app.php` para cargar `routes/api.php`.
- [ ] Configurar `SANCTUM_STATEFUL_DOMAINS` para `localhost:8000` (la SPA se sirve desde el mismo Laravel; no hace falta CORS).
- [ ] De paso, arreglar los fallos del repo base que afectan a los formularios: `error.errors` →
      `error.issues` en `utils/zodValidations.js` (Zod 4) y declarar `prop-types` en `package.json`.
- [ ] Configurar `storage:link` para las fotos.
- [ ] Configurar zona horaria `America/Caracas` y locale `es`.

**Entregable:** proyecto levanta, migra y responde en `/api` con el manejador JSON activo.

### Fase 1 — Dominio y persistencia

- [ ] Crear migraciones de `sedes`, `integrantes`, `representantes`, `instrumentos` y `comodatos`.
- [ ] Crear enums del dominio.
- [ ] Crear modelos con relaciones, casts y atributos fillable.
- [ ] Crear factories para todas las entidades.
- [ ] Crear seeders equivalentes a la semilla del prototipo.
- [ ] Crear usuario administrador de prueba.
- [ ] Verificar `php artisan migrate:fresh --seed`.

**Entregable:** base de datos reproducible con los mismos datos de la demo.

### Fase 2 — Autenticación y autorización

- [ ] Configurar Sanctum para SPA con cookies.
- [ ] Implementar `AuthController` con login, logout y usuario actual.
- [ ] Añadir columna `rol` a `users` (string validado con el enum `RolUsuario`, default `admin`).
- [ ] Proteger todas las rutas de `/api` (salvo login) con `auth:sanctum`.
- [ ] Implementar manejador global de errores.
- [ ] Probar `401`, `404`, `409`, `422` y `500`.
- [ ] **Pospuesto hasta que la fundación defina los roles** (pregunta abierta): middleware de rol,
      policies y permisos por rol. Propuesta de partida:
  - `consulta`: solo lectura.
  - `operador`: CRUD de instrumentos, integrantes y comodatos.
  - `admin`: además sedes y usuarios.

**Entregable:** login funcionando, endpoints protegidos y contrato de errores consistente.

### Fase 3 — Sedes, catálogos e instrumentos

- [ ] Implementar `SedeController` y `SedeService`.
- [ ] Implementar `GET /api/catalogos`.
- [ ] Implementar listado de instrumentos con filtros, búsqueda y paginación.
- [ ] Implementar creación con generación de código y carga de foto.
- [ ] Implementar edición.
- [ ] Implementar búsqueda por código.
- [ ] Implementar transiciones de reparación.
- [ ] Validar serial único, familia, condición, año y sede.
- [ ] Añadir tests de cada operación.

**Entregable:** módulo de instrumentos funcional por API, incluyendo foto y reparación.

### Fase 4 — Integrantes y representantes

- [ ] Implementar CRUD de integrantes.
- [ ] Permitir crear/editar representante anidado.
- [ ] Validar cédula opcional y única cuando existe.
- [ ] Validar edad y datos obligatorios.
- [ ] Implementar búsqueda por nombre, cédula, cátedra y sede.
- [ ] Añadir tests.

**Entregable:** módulo de integrantes completo.

### Fase 5 — Comodatos y reglas críticas

- [ ] Implementar `CodigoService` para códigos de instrumento y comodato.
- [ ] Implementar `ComodatoService` con transacciones y bloqueo.
- [ ] Implementar creación, edición y archivado.
- [ ] Implementar historial activo/archivado con filtros.
- [ ] Implementar consulta integrada.
- [ ] Implementar panel general.
- [ ] Validar un solo comodato activo por instrumento.
- [ ] Validar que el instrumento esté disponible.
- [ ] Validar que no se edite un comodato archivado.
- [ ] Probar concurrencia y códigos duplicados.

**Entregable:** flujo completo de comodatos, desde la asignación hasta el archivo.

### Fase 6 — Contrato PDF

- [ ] Crear vista Blade del contrato con los datos actuales del prototipo.
- [ ] Parametrizar fundación, RIF y textos legales en `config/contrato.php`.
- [ ] Implementar `ContratoPdfService`.
- [ ] Exponer `GET /api/comodatos/{comodato}/contrato`.
- [ ] Incluir logo, ficha del instrumento, foto y firmas.
- [ ] Aplicar la regla del representante para menores de edad.
- [ ] Añadir test que verifique el `Content-Type` y la generación del archivo.

**Entregable:** contrato generado y firmado por el servidor.

### Fase 7 — Interfaz en el repo Laravel (revisada)

> Sustituye a la "integración con el prototipo" del plan original. El prototipo no se toca: se
> reconstruyen sus pantallas en `resources/js/src/features/comodatos`, siguiendo la estructura
> *feature-based* del README (`pages`, `components`, `hooks`, `services`, `schemas`) y reutilizando
> los componentes compartidos (`Table`, `SearchBar`, `Form`, `Confirm`…).

- [ ] Pantalla de login en `/usuarios/login` (el interceptor de Axios ya redirige ahí en `401`).
- [ ] `services/` por entidad usando la instancia Axios compartida (`config/axios.js`).
- [ ] Esquemas Zod alineados con los Form Requests.
- [ ] Pantallas, en este orden de prioridad: Consulta por código → Comodatos (Activos / Historial,
      nuevo, editar, recibir y archivar, contrato PDF) → Instrumentos → Integrantes → Panel → Sedes.
- [ ] Mostrar los errores `422` en los campos del formulario y el resto como aviso.
- [ ] Recorrer los flujos del prototipo y comprobar que se comportan igual.

**Entregable:** el módulo usable desde el propio Laravel, sin depender del prototipo.

### Fase 8 — Calidad, pruebas y despliegue

- [ ] Completar tests de feature por endpoint.
- [ ] Añadir tests unitarios de Services y reglas de negocio.
- [ ] Ejecutar Laravel Pint.
- [ ] Documentar endpoints y ejemplos en el README.
- [ ] Añadir colección de Bruno/Postman o especificación OpenAPI.
- [ ] Configurar CI: migraciones, tests y Pint.
- [ ] Preparar `.env` de staging y respaldo de base de datos.
- [ ] Verificar almacenamiento de fotos y permisos.

**Entregable:** backend listo para staging y frontend conectado.

---

## 11. Orden sugerido de Pull Requests

1. **PR 1:** entorno, Docker, rutas API, manejador de errores y migraciones base.
2. **PR 2:** enums, modelos, factories, seeders y tests de persistencia.
3. **PR 3:** autenticación (login admin) y protección de rutas. Roles y policies, cuando se definan.
4. **PR 4:** sedes, catálogos e instrumentos.
5. **PR 5:** integrantes y representantes.
6. **PR 6:** comodatos, archivado, consulta y panel.
7. **PR 7:** contrato PDF y almacenamiento de fotos.
8. **PR 8 en adelante:** interfaz en `features/comodatos`, una pantalla por PR.

Cada PR debe incluir migraciones, tests y actualización mínima de documentación.

---

## 12. Criterios de aceptación del backend

El backend se considera entregado cuando:

- [ ] `php artisan migrate:fresh --seed` funciona desde cero.
- [ ] La API responde en `/api` con errores JSON consistentes.
- [ ] Se pueden crear, listar, editar y consultar instrumentos.
- [ ] Se pueden crear, listar y editar integrantes con representante.
- [ ] Se pueden crear, editar y archivar comodatos.
- [ ] Un instrumento no puede tener dos comodatos activos.
- [ ] El código de instrumento y el de comodato se generan en el servidor.
- [ ] El archivado conserva el historial y devuelve el instrumento a disponible.
- [ ] La consulta por código devuelve la ficha integrada.
- [ ] El panel devuelve los totales y alertas del prototipo.
- [ ] El contrato PDF se descarga desde el servidor.
- [ ] Las fotos se almacenan en disco y se sirven por URL.
- [ ] Los endpoints están protegidos por autenticación (y por rol, cuando se definan los roles).
- [ ] `php artisan test` pasa.
- [ ] `vendor/bin/pint --test` pasa.
- [ ] El proyecto corre con PHP 8.2.

---

## 13. Pruebas mínimas obligatorias

### Instrumentos

- Crear instrumento y verificar código correlativo por abreviatura.
- Rechazar serial duplicado.
- Rechazar abreviatura inválida.
- Filtrar por estado, familia y sede.
- Buscar por código exacto y parcial.
- Enviar a reparación y marcar como reparado.
- Rechazar reparación si tiene comodato activo.

### Integrantes

- Crear integrante sin cédula.
- Rechazar cédula duplicada.
- Crear representante anidado.
- Editar representante.
- Rechazar fecha de nacimiento futura.

### Comodatos

- Crear comodato con instrumento disponible.
- Rechazar instrumento no disponible.
- Rechazar segundo comodato activo para el mismo instrumento.
- Generar códigos consecutivos por año.
- Archivar con motivo obligatorio.
- Verificar que el instrumento vuelve a disponible.
- Rechazar edición de comodato archivado.
- Verificar historial activo/archivado.

### Seguridad

- `401` sin sesión.
- `403` con rol insuficiente (cuando se definan los roles).
- `404` con recurso inexistente.
- `422` con payload inválido.
- `409` al eliminar una sede con registros.

### PDF

- Generar contrato para integrante mayor de edad.
- Generar contrato para menor con representante.
- Generar contrato para menor sin representante.
- Verificar que el PDF contiene el código del comodato y del instrumento.

---

## 14. Riesgos y decisiones pendientes

Estas decisiones deben resolverse con la fundación antes o durante la Fase 1:

| Tema | Supuesto del plan | Acción |
| --- | --- | --- |
| Varios instrumentos por integrante | Se permite más de uno | Confirmar; si no, añadir validación |
| Sedes editables | Solo admin puede crearlas/editar | Confirmar |
| Instrumento en taller externo | `sede_id` nullable y observación | Definir si se crea una sede “Taller” |
| Roles | Por ahora solo `admin`; propuesta: admin, operador y consulta | Preguntar quién usa el sistema (administración, coordinación de sede, luthier) |
| RIF y texto legal | Parametrizados en configuración | Esperar datos reales |
| Cédula opcional | Única cuando existe | Definir detección de duplicados por nombre y fecha |
| Fecha de devolución | Se mantiene el atajo al 15 de diciembre en el frontend | Confirmar si se autocompleta siempre |
| Código al editar abreviatura | Se conserva si hay historial | Confirmar |
| Borrado de instrumentos | No se borran si tienen comodatos | Confirmar política |
| Fotos | JPG/PNG/WebP, máximo 5 MB, disco público | Definir retención |
| Zona horaria | `America/Caracas` | Confirmar |
| Autenticación | Sanctum con cookies | Confirmar si se requiere token para móvil |
| Instrumento perdido o dañado al recibirlo | Se archiva y vuelve a `disponible` | ¿Hace falta otro estado (p. ej. `baja`) al recibirlo? |

---

## 15. Primer sprint recomendado

Objetivo: tener una API mínima funcional para instrumentos y comodatos, con datos de prueba.

### Semana 1

- Día 1: Fase 0 completa.
- Día 2: migraciones, modelos, enums y seeders.
- Día 3: autenticación (login admin) y manejador de errores.
- Día 4: sedes, catálogos e instrumentos (listado y creación).
- Día 5: instrumentos (edición, búsqueda, reparación y foto).

### Semana 2

- Día 6: integrantes y representantes.
- Día 7: comodatos (creación y reglas).
- Día 8: comodatos (edición, archivado y consulta).
- Día 9: panel y contrato PDF.
- Día 10: tests, Pint, documentación y demo.

Al final del sprint debe poder hacerse esta demo (contra la API, con Bruno/Postman; la interfaz llega en la Fase 7):

1. Iniciar sesión.
2. Consultar `Pi001-FOSC`.
3. Crear un instrumento con foto.
4. Registrar un integrante.
5. Asignarle un instrumento en comodato.
6. Descargar el contrato PDF.
7. Recibir el instrumento y verlo en el historial.
8. Verificar que el instrumento vuelve a estar disponible.

---

## 16. Comandos de referencia

### Backend Laravel

```bash
composer install
cp .env.example .env
php artisan key:generate
npm install
docker compose up -d mariadb_service
php artisan migrate:fresh --seed
composer run dev
```

En PowerShell, el copiado del entorno es:

```powershell
Copy-Item .env.example .env
```

### Pruebas y estilo

```bash
php artisan test
vendor/bin/pint
vendor/bin/pint --test
```

### Prototipo (solo como referencia)

```bash
npm install
npm run dev          # http://localhost:5173
```

---

## 17. Resultado esperado

Al completar este plan, `osc-inventario-laravel` tendrá un backend Laravel real para el módulo de Comodatos, con persistencia, validación, reglas de negocio, autenticación, PDF y pruebas, y la interfaz del módulo construida en `resources/js/src/features/comodatos`. El prototipo se mantiene como demo con datos ficticios para seguir validando ideas con la fundación.
