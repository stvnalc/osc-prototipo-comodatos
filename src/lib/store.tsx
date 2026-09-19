import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { todayIso } from "./format"
import { buildSeed } from "./seed"
import type { Comodato, Db, EstadoInstrumento, Estudiante, Instrumento, Ubicacion } from "./types"

// Store en memoria + localStorage que simula la API REST. Cada acción equivale
// a un endpoint del backend (ver CLAUDE.md → "Endpoints sugeridos").

const STORAGE_KEY = "osc-comodatos-demo-v1"

function load(): Db {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch {
    // almacenamiento no disponible: usamos los datos de prueba
  }
  return buildSeed()
}

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export type NuevoComodato = Omit<Comodato, "id" | "numero" | "creadoEn">
export type NuevoInstrumento = Omit<Instrumento, "id" | "estado">
export type NuevoEstudiante = Omit<Estudiante, "id">

interface Store {
  db: Db
  instrumento: (id: string) => Instrumento | undefined
  estudiante: (id: string) => Estudiante | undefined
  ubicacion: (id: string | null) => Ubicacion | undefined
  comodatoDeInstrumento: (instrumentoId: string) => Comodato | undefined
  comodatosDeEstudiante: (estudianteId: string) => Comodato[]
  buscarPorCodigo: (codigo: string) => Instrumento | undefined
  crearComodato: (data: NuevoComodato) => Comodato
  finalizarComodato: (comodatoId: string, ubicacionId: string | null) => void
  cambiarEstado: (instrumentoId: string, estado: Exclude<EstadoInstrumento, "comodato">, observaciones?: string) => void
  crearInstrumento: (data: NuevoInstrumento) => Instrumento
  crearEstudiante: (data: NuevoEstudiante) => Estudiante
  reset: () => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db>(load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    } catch {
      // sin persistencia; la demo sigue funcionando en memoria
    }
  }, [db])

  const instrumento = useCallback((id: string) => db.instrumentos.find((i) => i.id === id), [db])
  const estudiante = useCallback((id: string) => db.estudiantes.find((e) => e.id === id), [db])
  const ubicacion = useCallback((id: string | null) => db.ubicaciones.find((u) => u.id === id), [db])
  const comodatoDeInstrumento = useCallback(
    (instrumentoId: string) => db.comodatos.find((c) => c.instrumentoId === instrumentoId),
    [db]
  )
  const comodatosDeEstudiante = useCallback(
    (estudianteId: string) => db.comodatos.filter((c) => c.estudianteId === estudianteId),
    [db]
  )
  const buscarPorCodigo = useCallback(
    (codigo: string) => {
      const q = codigo.trim().toUpperCase()
      if (!q) return undefined
      return (
        db.instrumentos.find((i) => i.codigo === q) ??
        db.instrumentos.find((i) => i.codigo.endsWith(q) || i.codigo.replace(/-/g, "").endsWith(q.replace(/-/g, "")))
      )
    },
    [db]
  )

  const crearComodato = useCallback(
    (data: NuevoComodato) => {
      const anio = todayIso().slice(0, 4)
      // Consecutivo por año. Como se eliminan los comodatos finalizados, en el
      // backend conviene una secuencia propia para no reutilizar números.
      const max = db.comodatos
        .filter((c) => c.numero.startsWith(`CMD-${anio}-`))
        .reduce((m, c) => Math.max(m, Number(c.numero.split("-")[2])), 0)
      const creado: Comodato = {
        ...data,
        id: uid("c"),
        numero: `CMD-${anio}-${String(max + 1).padStart(4, "0")}`,
        creadoEn: todayIso(),
      }
      setDb((prev) => ({
        ...prev,
        comodatos: [...prev.comodatos, creado],
        instrumentos: prev.instrumentos.map((i) => (i.id === data.instrumentoId ? { ...i, estado: "comodato" } : i)),
      }))
      return creado
    },
    [db]
  )

  // Regla de negocio de la propuesta: al finalizar, el instrumento vuelve a
  // "Disponible" y el registro del comodato se ELIMINA (no queda historial).
  const finalizarComodato = useCallback((comodatoId: string, ubicacionId: string | null) => {
    setDb((prev) => {
      const c = prev.comodatos.find((x) => x.id === comodatoId)
      if (!c) return prev
      return {
        ...prev,
        comodatos: prev.comodatos.filter((x) => x.id !== comodatoId),
        instrumentos: prev.instrumentos.map((i) =>
          i.id === c.instrumentoId ? { ...i, estado: "disponible", ubicacionId: ubicacionId ?? i.ubicacionId } : i
        ),
      }
    })
  }, [])

  const cambiarEstado = useCallback(
    (instrumentoId: string, estado: Exclude<EstadoInstrumento, "comodato">, observaciones?: string) => {
      setDb((prev) => ({
        ...prev,
        instrumentos: prev.instrumentos.map((i) =>
          i.id === instrumentoId ? { ...i, estado, observaciones: observaciones ?? (estado === "disponible" ? undefined : i.observaciones) } : i
        ),
      }))
    },
    []
  )

  const crearInstrumento = useCallback((data: NuevoInstrumento) => {
    const nuevo: Instrumento = { ...data, id: uid("i"), estado: "disponible" }
    setDb((prev) => ({ ...prev, instrumentos: [...prev.instrumentos, nuevo] }))
    return nuevo
  }, [])

  const crearEstudiante = useCallback((data: NuevoEstudiante) => {
    const nuevo: Estudiante = { ...data, id: uid("e") }
    setDb((prev) => ({ ...prev, estudiantes: [...prev.estudiantes, nuevo] }))
    return nuevo
  }, [])

  const reset = useCallback(() => setDb(buildSeed()), [])

  const value = useMemo<Store>(
    () => ({
      db,
      instrumento,
      estudiante,
      ubicacion,
      comodatoDeInstrumento,
      comodatosDeEstudiante,
      buscarPorCodigo,
      crearComodato,
      finalizarComodato,
      cambiarEstado,
      crearInstrumento,
      crearEstudiante,
      reset,
    }),
    [db, instrumento, estudiante, ubicacion, comodatoDeInstrumento, comodatosDeEstudiante, buscarPorCodigo, crearComodato, finalizarComodato, cambiarEstado, crearInstrumento, crearEstudiante, reset]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>")
  return ctx
}
