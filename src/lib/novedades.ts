// Historial de cambios del prototipo. Se muestra en /novedades para que la
// fundación vea qué se fue ajustando y en qué fecha.

export type TipoCambio = "nuevo" | "cambio" | "correccion"

export interface Cambio {
  tipo: TipoCambio
  texto: string
  /** De dónde salió el ajuste (nota de una reunión, mensaje del equipo…). */
  origen?: string
}

export interface Version {
  fecha: string
  titulo: string
  resumen?: string
  cambios: Cambio[]
}

export const TIPO_LABEL: Record<TipoCambio, string> = {
  nuevo: "Nuevo",
  cambio: "Cambio",
  correccion: "Corrección",
}

export const NOVEDADES: Version[] = [
  {
    fecha: "2026-10-16",
    titulo: "Notas del 3 y 11 de octubre",
    resumen: "Ajustes pedidos por Jonathan y Emilio tras revisar el prototipo.",
    cambios: [
      { tipo: "nuevo", texto: "Historial de comodatos: al recibir el instrumento el comodato ya no se borra, se archiva con la fecha y una nota del porqué (“Creció y se le dio otro…”).", origen: "Jonathan" },
      { tipo: "cambio", texto: "En Comodatos quedan dos pestañas: Activos e Historial. Se quitaron “Por vencer” y “Vencidos”.", origen: "Jonathan" },
      { tipo: "cambio", texto: "El comodato se identifica por código, no por número.", origen: "Jonathan" },
      { tipo: "nuevo", texto: "Se puede registrar un integrante nuevo sin salir del formulario de nuevo comodato.", origen: "Jonathan" },
      { tipo: "nuevo", texto: "Botón “Ver foto” en la ficha del instrumento, con la foto en grande.", origen: "Jonathan" },
      { tipo: "cambio", texto: "Se quitó el icono de música de la tabla de instrumentos y la miniatura de la foto en los listados.", origen: "Jonathan y Emilio" },
      { tipo: "cambio", texto: "El integrante se registra con un solo campo de nombre completo.", origen: "Emilio" },
      { tipo: "cambio", texto: "La cédula y el RIF dejaron de ser obligatorios, tanto del integrante como del representante.", origen: "Emilio" },
      { tipo: "cambio", texto: "El representante ya no es obligatorio para los menores de edad, y los mayores también pueden tener uno.", origen: "Emilio" },
      { tipo: "cambio", texto: "El contrato se emite a nombre del representante si el integrante es menor de edad; si no, a nombre del integrante.", origen: "Jonathan" },
      { tipo: "cambio", texto: "La sede del integrante ahora se llama “sede recurrente a la que va el integrante”.", origen: "Jonathan" },
      { tipo: "cambio", texto: "Se quitó la tarjeta de “Ubicación” de la consulta: la sede se ve en la ficha técnica.", origen: "Emilio" },
      { tipo: "correccion", texto: "La sede Av. Bolívar ahora aparece como “Av. Bolívar — CC Profesional”.", origen: "Jonathan" },
      { tipo: "nuevo", texto: "Atajo “Recolección de diciembre” al poner la fecha de devolución: los instrumentos se recogen en diciembre y se reparten en enero.", origen: "Jonathan" },
      { tipo: "nuevo", texto: "Esta página de Novedades, con el historial de cambios del prototipo." },
    ],
  },
  {
    fecha: "2026-09-22",
    titulo: "Modo oscuro y sedes plegables",
    cambios: [
      { tipo: "nuevo", texto: "Modo claro / oscuro / automático desde el encabezado." },
      { tipo: "cambio", texto: "En Sedes, los instrumentos se agrupan por familia y tipo en secciones plegables." },
    ],
  },
  {
    fecha: "2026-09-20",
    titulo: "Ajustes de la charla con la fundación",
    cambios: [
      { tipo: "cambio", texto: "“Estudiante” pasó a ser integrante y “núcleo” pasó a ser sede (Hesperia, UJAP y Av. Bolívar)." },
      { tipo: "cambio", texto: "Seis familias de instrumentos y código de inventario con el formato Pi004-FOSC." },
      { tipo: "nuevo", texto: "Foto del instrumento, edición de instrumentos, integrantes y comodatos." },
      { tipo: "nuevo", texto: "Dirección fiscal del integrante y datos del representante en el contrato." },
    ],
  },
  {
    fecha: "2026-09-19",
    titulo: "Primera versión navegable",
    resumen: "Prototipo con datos ficticios para validar la idea con la orquesta.",
    cambios: [
      { tipo: "nuevo", texto: "Panel, consulta por código, instrumentos, comodatos, integrantes y sedes." },
      { tipo: "nuevo", texto: "Contrato de comodato en PDF generado desde el navegador." },
    ],
  },
]
