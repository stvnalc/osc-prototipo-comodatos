# Prototipo · Módulo de Comodatos (OSC)

Prototipo navegable del **Módulo de Comodatos y Consulta de Instrumentos** de la Fundación Orquesta Sinfónica de
Carabobo. Solo frontend, con **datos ficticios** guardados en el navegador (localStorage). No es el sistema final:
sirve para validar la idea antes de implementarla en el repo Laravel `osc-inventario-laravel`.

## Qué se puede probar
- **Panel:** totales por estado, comodatos vencidos o por vencer, distribución por familia.
- **Consulta por código** (ej. `VLN-001`): instrumento + estudiante asignado + ubicación + ficha técnica.
- **Instrumentos:** filtros por estado, familia y ubicación; alta con código `OSC-<PREFIJO>-<NNN>`; reparación.
- **Comodatos:** registrar, descargar contrato PDF, finalizar (elimina el registro, según la propuesta).
- **Estudiantes** (representante obligatorio si es menor) y **Ubicaciones** de resguardo.
- "Restablecer datos de prueba" en el menú lateral devuelve la demo a su estado inicial.

## Preguntas abiertas para la orquesta
1. Borrar el comodato al finalizarlo elimina la trazabilidad. ¿Guardar la fecha de cierre en su lugar?
2. ¿Un estudiante puede tener más de un instrumento en comodato?
3. ¿Dónde figura un instrumento que está en un taller externo de reparación?
4. RIF real y texto legal del contrato (el del prototipo es un borrador).
5. Formato real de los códigos de inventario. ¿Etiquetas QR o código de barras?
6. Roles de usuario (administración, coordinación de núcleo, luthier).
7. Duración estándar del comodato y renovaciones.

## Desarrollo
```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```
Stack: Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui (Base UI) + jsPDF.
