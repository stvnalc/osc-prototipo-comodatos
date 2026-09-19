import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { NuevoComodatoDialog } from "./nuevo-comodato-dialog"
import { FinalizarComodatoDialog } from "./finalizar-comodato-dialog"
import { ReparacionDialog } from "./reparacion-dialog"

// Diálogos globales: se pueden abrir desde cualquier pantalla (panel,
// consulta, tablas) sin duplicar el formulario en cada una.

interface Dialogs {
  nuevoComodato: (preset?: { instrumentoId?: string; estudianteId?: string }) => void
  finalizarComodato: (comodatoId: string) => void
  enviarAReparacion: (instrumentoId: string) => void
}

const DialogsContext = createContext<Dialogs | null>(null)

export function DialogsProvider({ children }: { children: ReactNode }) {
  const [nuevo, setNuevo] = useState<{ open: boolean; instrumentoId?: string; estudianteId?: string; key: number }>({
    open: false,
    key: 0,
  })
  const [finalizar, setFinalizar] = useState<string | null>(null)
  const [reparacion, setReparacion] = useState<string | null>(null)

  const nuevoComodato = useCallback(
    (preset?: { instrumentoId?: string; estudianteId?: string }) =>
      setNuevo((s) => ({ open: true, key: s.key + 1, ...preset })),
    []
  )
  const value = useMemo<Dialogs>(
    () => ({ nuevoComodato, finalizarComodato: setFinalizar, enviarAReparacion: setReparacion }),
    [nuevoComodato]
  )

  return (
    <DialogsContext.Provider value={value}>
      {children}
      <NuevoComodatoDialog
        key={nuevo.key}
        open={nuevo.open}
        onOpenChange={(open) => setNuevo((s) => ({ ...s, open }))}
        presetInstrumentoId={nuevo.instrumentoId}
        presetEstudianteId={nuevo.estudianteId}
      />
      <FinalizarComodatoDialog comodatoId={finalizar} onClose={() => setFinalizar(null)} />
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
