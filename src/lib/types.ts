// Modelo de datos del prototipo. Pensado para mapear 1:1 a tablas/migraciones
// del backend Laravel (ver CLAUDE.md → "Modelo de datos propuesto").

export type EstadoInstrumento = "disponible" | "comodato" | "reparacion"

export type Familia = "Cuerdas" | "Maderas" | "Metales" | "Percusión"

export type CondicionFisica = "Excelente" | "Buena" | "Regular" | "Deteriorada"

/** Nodo físico de resguardo. Ruta: "Sede - Dirección - Espacio". */
export interface Ubicacion {
  id: string
  sede: string
  direccion: string
  espacio: string
  detalle?: string
}

export interface Instrumento {
  id: string
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
  /** Ubicación estática de resguardo. Se conserva durante el comodato pero queda "suspendida". */
  ubicacionId: string | null
  accesorios: string[]
  observaciones?: string
}

export interface Representante {
  nombre: string
  cedula: string
  telefono: string
  parentesco: string
}

export interface Estudiante {
  id: string
  cedula: string
  nombres: string
  apellidos: string
  fechaNacimiento: string
  telefono: string
  email: string
  nucleo: string
  catedra: string
  direccion: string
  representante?: Representante
}

export interface Comodato {
  id: string
  numero: string
  instrumentoId: string
  estudianteId: string
  fechaInicio: string
  fechaFin: string
  condicionEntrega: CondicionFisica
  observaciones?: string
  creadoEn: string
}

export interface Db {
  ubicaciones: Ubicacion[]
  instrumentos: Instrumento[]
  estudiantes: Estudiante[]
  comodatos: Comodato[]
}
