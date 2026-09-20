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

/** Sede de la fundación: Hesperia, UJAP o Av. Bolívar. */
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

export interface Representante {
  nombre: string
  cedula: string
  /** RIF del representante, requerido para el contrato. */
  rif: string
  telefono: string
  parentesco: string
}

/** Integrante de la orquesta (antes "estudiante"). */
export interface Integrante {
  id: string
  cedula: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  telefono: string
  email: string
  /** Sede a la que pertenece el integrante. */
  sedeId: string
  catedra: string
  direccionFiscal: string
  representante?: Representante
}

export interface Comodato {
  id: string
  numero: string
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
}

export interface Db {
  sedes: Sede[]
  instrumentos: Instrumento[]
  integrantes: Integrante[]
  comodatos: Comodato[]
}
