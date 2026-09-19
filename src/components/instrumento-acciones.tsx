import { useNavigate } from "react-router-dom"
import { CircleCheck, Eye, FileDown, Handshake, MoreHorizontal, Trash2, Wrench } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { descargarContrato } from "@/lib/pdf"
import { useStore } from "@/lib/store"
import type { Instrumento } from "@/lib/types"

export function useAccionesInstrumento() {
  const store = useStore()
  const dialogs = useDialogs()

  const descargar = (instrumentoId: string) => {
    const c = store.comodatoDeInstrumento(instrumentoId)
    const i = store.instrumento(instrumentoId)
    const e = c && store.estudiante(c.estudianteId)
    if (!c || !i || !e) return
    toast.promise(descargarContrato({ comodato: c, instrumento: i, estudiante: e, ubicacion: store.ubicacion(i.ubicacionId) }), {
      loading: "Generando contrato…",
      success: `Contrato ${c.numero} descargado`,
      error: "No se pudo generar el PDF",
    })
  }

  const marcarReparado = (i: Instrumento) => {
    store.cambiarEstado(i.id, "disponible")
    toast.success(`${i.codigo} marcado como disponible`)
  }

  return { store, dialogs, descargar, marcarReparado }
}

export function InstrumentoAcciones({ instrumento: i, verFicha = true }: { instrumento: Instrumento; verFicha?: boolean }) {
  const navigate = useNavigate()
  const { store, dialogs, descargar, marcarReparado } = useAccionesInstrumento()
  const comodato = store.comodatoDeInstrumento(i.id)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label={`Acciones de ${i.codigo}`} />}
        onClick={(e) => e.stopPropagation()}
      >
        <MoreHorizontal />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {verFicha && (
          <DropdownMenuItem onClick={() => navigate(`/consulta?codigo=${i.codigo}`)}>
            <Eye />
            Ver ficha completa
          </DropdownMenuItem>
        )}
        {i.estado === "disponible" && (
          <>
            <DropdownMenuItem onClick={() => dialogs.nuevoComodato({ instrumentoId: i.id })}>
              <Handshake />
              Asignar en comodato
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => dialogs.enviarAReparacion(i.id)}>
              <Wrench />
              Enviar a reparación
            </DropdownMenuItem>
          </>
        )}
        {i.estado === "reparacion" && (
          <DropdownMenuItem onClick={() => marcarReparado(i)}>
            <CircleCheck />
            Marcar como reparado
          </DropdownMenuItem>
        )}
        {comodato && (
          <>
            <DropdownMenuItem onClick={() => descargar(i.id)}>
              <FileDown />
              Descargar contrato PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => dialogs.finalizarComodato(comodato.id)}>
              <Trash2 />
              Finalizar comodato
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
