# Prototipo · Módulo de Comodatos (OSC)

Prototipo navegable del **Módulo de Comodatos y Consulta de Instrumentos** de la Fundación Orquesta Sinfónica de
Carabobo. Solo frontend, con **datos ficticios** guardados en el navegador (localStorage). No es el sistema final:
sirve para validar la idea antes de implementarla en el repo Laravel `osc-inventario-laravel`.

## Qué se puede probar
- **Panel:** totales por estado, comodatos vencidos o por vencer, distribución por familia.
- **Consulta por código** (ej. `Pi001` o `Pi001-FOSC`): instrumento + integrante asignado + sede + ficha técnica + foto.
- **Instrumentos:** filtros por estado, familia y sede; registrar y **editar** (incluida la foto).
- **Comodatos:** registrar, editar, descargar contrato PDF y finalizar (elimina el registro, según la propuesta).
- **Integrantes:** alta y edición, con dirección fiscal y representante (RIF obligatorio si es menor de edad).
- **Sedes:** Hesperia, UJAP y Av. Bolívar, con sus instrumentos agrupados por familia.
- "Restablecer datos de prueba" en el menú lateral devuelve la demo a su estado inicial.

## Convenciones acordadas
- **Integrante** (no "estudiante") y **sede** (no "núcleo").
- Código de inventario: `Pi004-FOSC` → abreviatura + correlativo + FOSC.
- Familias: Cuerdas frotadas, Cuerdas pulsadas, Viento madera, Viento metal, Percusión, Piano/Teclados.
- Al entrar en comodato, el instrumento muestra **en qué sede** quedó y su resguardo original queda suspendido.

## Preguntas abiertas para la fundación
1. Borrar el comodato al finalizarlo elimina la trazabilidad. ¿Guardar la fecha de cierre en su lugar?
2. ¿Un integrante puede tener más de un instrumento en comodato?
3. ¿Dónde figura un instrumento que está en un taller externo de reparación?
4. RIF real y texto legal del contrato (el del prototipo es un borrador).
5. Direcciones exactas de cada sede. ¿Hacen falta subdivisiones (depósito, salón, estante)?
6. Roles de usuario: hoy todo asume permisos de administrador.
7. Duración estándar del comodato y renovaciones.
8. ¿Se crean y editan sedes desde el sistema o son fijas?
9. ¿Faltan familias (coro, accesorios como atriles)?

## Desarrollo
```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```
Stack: Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui (Base UI) + jsPDF.
