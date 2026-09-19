import type { Comodato, EstadoInstrumento, Estudiante, Ubicacion } from "./types"

export function todayIso(): string {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function diffDays(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T12:00:00`).getTime()
  const b = new Date(`${toIso}T12:00:00`).getTime()
  return Math.round((b - a) / 86_400_000)
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function formatDateLong(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export const ESTADO_LABEL: Record<EstadoInstrumento, string> = {
  disponible: "Disponible",
  comodato: "En comodato",
  reparacion: "En reparación",
}

export function rutaUbicacion(u: Ubicacion | undefined | null): string {
  if (!u) return "Sin ubicación asignada"
  return `${u.sede} - ${u.direccion} - ${u.espacio}`
}

export function nombreCompleto(e: Estudiante): string {
  return `${e.nombres} ${e.apellidos}`
}

export function iniciales(e: Estudiante): string {
  return `${e.nombres[0] ?? ""}${e.apellidos[0] ?? ""}`.toUpperCase()
}

export function edad(fechaNacimiento: string): number {
  return Math.floor(diffDays(fechaNacimiento, todayIso()) / 365.25)
}

export type Vencimiento = { tipo: "vencido" | "por-vencer" | "vigente"; dias: number }

/** "por-vencer" = 15 días o menos para la fecha de devolución. */
export function vencimiento(c: Comodato): Vencimiento {
  const dias = diffDays(todayIso(), c.fechaFin)
  if (dias < 0) return { tipo: "vencido", dias }
  if (dias <= 15) return { tipo: "por-vencer", dias }
  return { tipo: "vigente", dias }
}

export function textoVencimiento(v: Vencimiento): string {
  if (v.tipo === "vencido") return `Vencido hace ${Math.abs(v.dias)} ${Math.abs(v.dias) === 1 ? "día" : "días"}`
  if (v.dias === 0) return "Vence hoy"
  return `${v.dias} ${v.dias === 1 ? "día" : "días"} restantes`
}
