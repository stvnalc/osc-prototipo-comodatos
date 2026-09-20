import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { todayIso } from "./format"
import { buildSeed } from "./seed"
import type { Comodato, Db, EstadoInstrumento, Instrumento, Integrante, Sede } from "./types"

// Store en memoria + localStorage que simula la API REST. Cada acción equivale
// a un endpoint del backend (ver CLAUDE.md → "Endpoints sugeridos").

const STORAGE_KEY = "osc-comodatos-demo-v2"

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
export type NuevoIntegrante = Omit<Integrante, "id">

interface Store {
  db: Db
  instrumento: (id: string) => Instrumento | undefined
  integrante: (id: string) => Integrante | undefined
  sede: (id: string | null) => Sede | undefined
  comodatoDeInstrumento: (instrumentoId: string) => Comodato | undefined
  comodatosDeIntegrante: (integranteId: string) => Comodato[]
  buscarPorCodigo: (codigo: string) => Instrumento | undefined
  /** Sede donde está físicamente: la del comodato si está prestado, si no la de resguardo. */
  sedeActual: (instrumento: Instrumento) => Sede | undefined
  crearComodato: (data: NuevoComodato) => Comodato
  actualizarComodato: (id: string, data: Partial<NuevoComodato>) => void
  finalizarComodato: (comodatoId: string, sedeId: string | null) => void
  cambiarEstado: (instrumentoId: string, estado: Exclude<EstadoInstrumento, "comodato">, observaciones?: string) => void
  crearInstrumento: (data: NuevoInstrumento) => Instrumento
  actualizarInstrumento: (id: string, data: Partial<NuevoInstrumento>) => void
  crearIntegrante: (data: NuevoIntegrante) => Integrante
  actualizarIntegrante: (id: string, data: Partial<NuevoIntegrante>) => void
  reset: () => void
  /** true si el navegador rechazó guardar (cuota llena, normalmente por las fotos). */
  sinEspacio: boolean
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db>(load)
  const [sinEspacio, setSinEspacio] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
      setSinEspacio(false)
    } catch {
      // Cuota llena (las fotos pesan): la demo sigue en memoria hasta recargar.
      setSinEspacio(true)
    }
  }, [db])

  const instrumento = useCallback((id: string) => db.instrumentos.find((i) => i.id === id), [db])
  const integrante = useCallback((id: string) => db.integrantes.find((e) => e.id === id), [db])
  const sede = useCallback((id: string | null) => db.sedes.find((s) => s.id === id), [db])
  const comodatoDeInstrumento = useCallback(
    (instrumentoId: string) => db.comodatos.find((c) => c.instrumentoId === instrumentoId),
    [db]
  )
  const comodatosDeIntegrante = useCallback(
    (integranteId: string) => db.comodatos.filter((c) => c.integranteId === integranteId),
    [db]
  )
  const buscarPorCodigo = useCallback(
    (codigo: string) => {
      const norm = (s: string) => s.trim().toUpperCase().replace(/-FOSC$/, "").replace(/[\s-]/g, "")
      const q = norm(codigo)
      if (!q) return undefined
      return (
        db.instrumentos.find((i) => norm(i.codigo) === q) ??
        db.instrumentos.find((i) => norm(i.codigo).includes(q))
      )
    },
    [db]
  )
  const sedeActual = useCallback(
    (i: Instrumento) => {
      const c = db.comodatos.find((x) => x.instrumentoId === i.id)
      return db.sedes.find((s) => s.id === (c ? c.sedeId : i.sedeId))
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

  const actualizarComodato = useCallback((id: string, data: Partial<NuevoComodato>) => {
    setDb((prev) => ({ ...prev, comodatos: prev.comodatos.map((c) => (c.id === id ? { ...c, ...data } : c)) }))
  }, [])

  // Regla de negocio de la propuesta: al finalizar, el instrumento vuelve a
  // "Disponible" y el registro del comodato se ELIMINA (no queda historial).
  const finalizarComodato = useCallback((comodatoId: string, sedeId: string | null) => {
    setDb((prev) => {
      const c = prev.comodatos.find((x) => x.id === comodatoId)
      if (!c) return prev
      return {
        ...prev,
        comodatos: prev.comodatos.filter((x) => x.id !== comodatoId),
        instrumentos: prev.instrumentos.map((i) =>
          i.id === c.instrumentoId ? { ...i, estado: "disponible", sedeId: sedeId ?? i.sedeId } : i
        ),
      }
    })
  }, [])

  const cambiarEstado = useCallback(
    (instrumentoId: string, estado: Exclude<EstadoInstrumento, "comodato">, observaciones?: string) => {
      setDb((prev) => ({
        ...prev,
        instrumentos: prev.instrumentos.map((i) =>
          i.id === instrumentoId
            ? { ...i, estado, observaciones: observaciones ?? (estado === "disponible" ? undefined : i.observaciones) }
            : i
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

  const actualizarInstrumento = useCallback((id: string, data: Partial<NuevoInstrumento>) => {
    setDb((prev) => ({ ...prev, instrumentos: prev.instrumentos.map((i) => (i.id === id ? { ...i, ...data } : i)) }))
  }, [])

  const crearIntegrante = useCallback((data: NuevoIntegrante) => {
    const nuevo: Integrante = { ...data, id: uid("e") }
    setDb((prev) => ({ ...prev, integrantes: [...prev.integrantes, nuevo] }))
    return nuevo
  }, [])

  const actualizarIntegrante = useCallback((id: string, data: Partial<NuevoIntegrante>) => {
    setDb((prev) => ({ ...prev, integrantes: prev.integrantes.map((e) => (e.id === id ? { ...e, ...data } : e)) }))
  }, [])

  const reset = useCallback(() => setDb(buildSeed()), [])

  const value = useMemo<Store>(
    () => ({
      db,
      instrumento,
      integrante,
      sede,
      comodatoDeInstrumento,
      comodatosDeIntegrante,
      buscarPorCodigo,
      sedeActual,
      crearComodato,
      actualizarComodato,
      finalizarComodato,
      cambiarEstado,
      crearInstrumento,
      actualizarInstrumento,
      crearIntegrante,
      actualizarIntegrante,
      reset,
      sinEspacio,
    }),
    [db, instrumento, integrante, sede, comodatoDeInstrumento, comodatosDeIntegrante, buscarPorCodigo, sedeActual, crearComodato, actualizarComodato, finalizarComodato, cambiarEstado, crearInstrumento, actualizarInstrumento, crearIntegrante, actualizarIntegrante, reset, sinEspacio]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): Store {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>")
  return ctx
}
