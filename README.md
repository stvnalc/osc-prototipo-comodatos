# Prototipo · Módulo de Comodatos (OSC)

Prototipo navegable del **Módulo de Comodatos y Consulta de Instrumentos** de la Fundación Orquesta Sinfónica de
Carabobo. Solo frontend, con **datos ficticios** guardados en el navegador (localStorage). No es el sistema final:
sirve para validar la idea antes de implementarla en el repo Laravel `osc-inventario-laravel`.

## Qué se puede probar
- **Panel:** totales por estado, comodatos que requieren atención, distribución por familia.
- **Consulta por código** (ej. `Pi001` o `Pi001-FOSC`): instrumento + integrante asignado + ficha técnica con su sede + botón "Ver foto".
- **Instrumentos:** filtros por estado, familia y sede; registrar y **editar** (incluida la foto).
- **Comodatos:** pestañas **Activos** e **Historial**; registrar (se puede crear el integrante ahí mismo), editar, descargar el contrato PDF y **recibir y archivar** con la fecha y una nota del porqué.
- **Integrantes:** alta y edición con nombre completo, cédula y RIF opcionales y representante opcional (también para mayores de edad).
- **Sedes:** Hesperia, UJAP y Av. Bolívar (CC Profesional), con sus instrumentos agrupados por familia.
- **Novedades:** historial de cambios del prototipo, por fecha.
- "Restablecer datos de prueba" en el menú lateral devuelve la demo a su estado inicial.

## Convenciones acordadas
- **Integrante** (no "estudiante") y **sede** (no "núcleo").
- Código de inventario: `Pi004-FOSC` → abreviatura + correlativo + FOSC.
- Familias: Cuerdas frotadas, Cuerdas pulsadas, Viento madera, Viento metal, Percusión, Piano/Teclados.
- Al entrar en comodato, el instrumento muestra **en qué sede** quedó y su resguardo original queda suspendido.
- Los instrumentos se **recogen en diciembre** y se entregan de nuevo en enero.
- Al recibir un instrumento el comodato **se archiva** (fecha + motivo), no se borra.
- El contrato se emite a nombre del **representante** si el integrante es menor de edad; si no, del integrante.

## Preguntas abiertas para la fundación
1. ~~Borrar el comodato al finalizarlo elimina la trazabilidad.~~ Resuelto: ahora se archiva con fecha y motivo.
2. ¿Un integrante puede tener más de un instrumento en comodato?
3. ¿Dónde figura un instrumento que está en un taller externo de reparación?
4. RIF real y texto legal del contrato (el del prototipo es un borrador).
5. Direcciones exactas de Hesperia y UJAP. ¿Hacen falta subdivisiones (depósito, salón, estante)?
6. Roles de usuario: hoy todo asume permisos de administrador.
7. ¿La fecha de devolución se autocompleta siempre al 15 de diciembre?
8. ¿Se crean y editan sedes desde el sistema o son fijas?
9. ¿Faltan familias (coro, accesorios como atriles)?
10. Si la cédula es opcional, ¿cómo se evita registrar dos veces al mismo integrante?

## Desarrollo
```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```
Stack: Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui (Base UI) + jsPDF.

## Paso al sistema real
El plan para implementar el backend en `osc-inventario-laravel` está en
[`docs/PLAN-BACKEND-LARAVEL.md`](docs/PLAN-BACKEND-LARAVEL.md). Sirve también de guía para la IA:
se le pasa el archivo y la fase que toca.
