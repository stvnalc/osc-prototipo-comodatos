// Modelo de datos del prototipo. Pensado para mapear 1:1 a tablas/migraciones
// del backend Laravel (ver CLAUDE.md → "Modelo de datos propuesto").

export type EstadoInstrumento = "disponible" | "comodato" | "reparacion"

export const FAMILIAS = [
  "Cuerdas frotadas",
  "Cuerdas pulsadas",
  "Viento madera",
  "Viento metal",
  "Percusión",
  "Piano/Teclados",
] as const

export type Familia = (typeof FAMILIAS)[number]

export const CONDICIONES = ["Excelente", "Buena", "Regular", "Deteriorada"] as const

export type CondicionFisica = (typeof CONDICIONES)[number]

/** Sede de la fundación: Hesperia, UJAP o Av. Bolívar (CC Profesional). */
export interface Sede {
  id: string
  nombre: string
  direccion: string
  detalle?: string
}

export interface Instrumento {
  id: string
  /** Formato acordado: Pi004-FOSC (abreviatura + correlativo + FOSC). */
  codigo: string
  nombre: string
  familia: Familia
  marca: string
  modelo: string
  serial: string
  medida?: string
  material?: string
  anioAdquisicion: number
  condicion: CondicionFisica
  estado: EstadoInstrumento
  /** Sede de resguardo. Se conserva durante el comodato pero queda "suspendida". */
  sedeId: string | null
  accesorios: string[]
  observaciones?: string
  /** Foto del instrumento (data URL redimensionada, guardada en el navegador). */
  foto?: string
}

/**
 * Representante del integrante. Los mayores de edad también pueden tener uno
 * (acuerdo del 2026-10-03); solo el nombre es indispensable.
 */
export interface Representante {
  nombre: string
  cedula?: string
  rif?: string
  telefono?: string
  parentesco: string
}

/** Integrante de la orquesta (antes "estudiante"). */
export interface Integrante {
  id: string
  /** Nombre completo en un solo campo. */
  nombre: string
  /** No es obligatoria: hay integrantes sin cédula todavía. */
  cedula?: string
  /** Opcional, no limitante. */
  rif?: string
  fechaNacimiento: string
  telefono: string
  email: string
  /** Sede recurrente a la que va el integrante. */
  sedeId: string
  catedra: string
  direccionFiscal: string
  representante?: Representante
}

export interface Comodato {
  id: string
  /** Código del comodato (antes "número"): CMD-2026-0001. */
  codigo: string
  instrumentoId: string
  integranteId: string
  /** Sede donde queda el instrumento mientras dura el comodato. */
  sedeId: string
  /** Fecha en que se asignó el instrumento. */
  fechaInicio: string
  fechaFin: string
  condicionEntrega: CondicionFisica
  observaciones?: string
  creadoEn: string
  /** Fecha en que se archivó. Si está presente, el comodato ya no está activo. */
  archivadoEn?: string
  /** Por qué se archivó: "Creció y se le dio otro", "Se retiró del programa"… */
  motivoArchivo?: string
}

/** Un comodato está activo mientras no se haya archivado. */
export function esActivo(c: Comodato): boolean {
  return !c.archivadoEn
}

export interface Db {
  sedes: Sede[]
  instrumentos: Instrumento[]
  integrantes: Integrante[]
  comodatos: Comodato[]
}
