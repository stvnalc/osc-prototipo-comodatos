import { createContext, useContext, useMemo, useState, type ReactNode } from "react"
import { ComodatoDialog } from "./comodato-dialog"
import { ArchivarComodatoDialog } from "./archivar-comodato-dialog"
import { InstrumentoDialog } from "./instrumento-dialog"
import { IntegranteDialog } from "./integrante-dialog"
import { ReparacionDialog } from "./reparacion-dialog"
import { useStore } from "@/lib/store"

// Diálogos globales: se pueden abrir desde cualquier pantalla (panel,
// consulta, tablas) sin duplicar el formulario en cada una.

interface Dialogs {
  nuevoComodato: (preset?: { instrumentoId?: string; integranteId?: string }) => void
  editarComodato: (comodatoId: string) => void
  archivarComodato: (comodatoId: string) => void
  enviarAReparacion: (instrumentoId: string) => void
  nuevoInstrumento: () => void
  editarInstrumento: (instrumentoId: string) => void
  nuevoIntegrante: () => void
  editarIntegrante: (integranteId: string) => void
}

const DialogsContext = createContext<Dialogs | null>(null)

/** Estado de un diálogo con formulario: `key` fuerza a reiniciarlo al reabrirlo. */
type FormState = { open: boolean; id?: string; instrumentoId?: string; integranteId?: string; key: number }
const cerrado: FormState = { open: false, key: 0 }

export function DialogsProvider({ children }: { children: ReactNode }) {
  const store = useStore()
  const [comodato, setComodato] = useState<FormState>(cerrado)
  const [instrumento, setInstrumento] = useState<FormState>(cerrado)
  const [integrante, setIntegrante] = useState<FormState>(cerrado)
  const [archivar, setArchivar] = useState<string | null>(null)
  const [reparacion, setReparacion] = useState<string | null>(null)

  const abrir = (set: (f: (s: FormState) => FormState) => void, datos: Omit<FormState, "open" | "key"> = {}) =>
    set((s) => ({ open: true, key: s.key + 1, ...datos }))

  const value = useMemo<Dialogs>(
    () => ({
      nuevoComodato: (preset) => abrir(setComodato, preset ?? {}),
      editarComodato: (id) => abrir(setComodato, { id }),
      archivarComodato: setArchivar,
      enviarAReparacion: setReparacion,
      nuevoInstrumento: () => abrir(setInstrumento),
      editarInstrumento: (id) => abrir(setInstrumento, { id }),
      nuevoIntegrante: () => abrir(setIntegrante),
      editarIntegrante: (id) => abrir(setIntegrante, { id }),
    }),
    []
  )

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <ComodatoDialog
        key={`c${comodato.key}`}
        open={comodato.open}
        onOpenChange={(open) => setComodato((s) => ({ ...s, open }))}
        presetInstrumentoId={comodato.instrumentoId}
        presetIntegranteId={comodato.integranteId}
        comodato={comodato.id ? store.db.comodatos.find((c) => c.id === comodato.id) : undefined}
      />
      <InstrumentoDialog
        key={`i${instrumento.key}`}
        open={instrumento.open}
        onOpenChange={(open) => setInstrumento((s) => ({ ...s, open }))}
        instrumento={instrumento.id ? store.instrumento(instrumento.id) : undefined}
      />
      <IntegranteDialog
        key={`e${integrante.key}`}
        open={integrante.open}
        onOpenChange={(open) => setIntegrante((s) => ({ ...s, open }))}
        integrante={integrante.id ? store.integrante(integrante.id) : undefined}
      />
      <ArchivarComodatoDialog comodatoId={archivar} onClose={() => setArchivar(null)} />
      <ReparacionDialog instrumentoId={reparacion} onClose={() => setReparacion(null)} />
    </DialogsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useDialogs(): Dialogs {
  const ctx = useContext(DialogsContext)
  if (!ctx) throw new Error("useDialogs debe usarse dentro de <DialogsProvider>")
  return ctx
}
