import { useState } from "react"
import { Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { SelectField } from "@/components/select-field"
import { formatDate, nombreCompleto, rutaUbicacion } from "@/lib/format"
import { useStore } from "@/lib/store"

export function FinalizarComodatoDialog({ comodatoId, onClose }: { comodatoId: string | null; onClose: () => void }) {
  const store = useStore()
  const comodato = store.db.comodatos.find((c) => c.id === comodatoId)
  const instrumento = comodato && store.instrumento(comodato.instrumentoId)
  const estudiante = comodato && store.estudiante(comodato.estudianteId)
  const [ubicacionId, setUbicacionId] = useState<string>("")

  const destino = ubicacionId || instrumento?.ubicacionId || ""

  const confirmar = () => {
    if (!comodato || !instrumento) return
    store.finalizarComodato(comodato.id, destino || null)
    toast.success(`Comodato ${comodato.numero} eliminado`, {
      description: `${instrumento.codigo} vuelve a estar Disponible en ${rutaUbicacion(store.ubicacion(destino))}.`,
    })
    setUbicacionId("")
    onClose()
  }

  return (
    <AlertDialog
      open={!!comodato}
      onOpenChange={(o) => {
        if (!o) {
          setUbicacionId("")
          onClose()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>Finalizar y eliminar comodato</AlertDialogTitle>
          <AlertDialogDescription>
            {comodato && instrumento && estudiante && (
              <>
                <span className="text-foreground font-medium">{comodato.numero}</span> · {instrumento.codigo} (
                {instrumento.nombre}) entregado a{" "}
                <span className="text-foreground font-medium">{nombreCompleto(estudiante)}</span> el{" "}
                {formatDate(comodato.fechaInicio)}.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Field>
          <FieldLabel htmlFor="fc-ubicacion">Ubicación de resguardo al recibirlo</FieldLabel>
          <SelectField
            id="fc-ubicacion"
            value={destino}
            onChange={setUbicacionId}
            options={store.db.ubicaciones.map((u) => ({ value: u.id, label: rutaUbicacion(u) }))}
          />
          <FieldDescription>Por defecto vuelve a su ubicación estática original.</FieldDescription>
        </Field>

        <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <TriangleAlert />
          <AlertTitle>El registro se eliminará por completo</AlertTitle>
          <AlertDescription>
            Así lo pide la propuesta (“purga el historial de esa asignación”). No quedará constancia de que este
            estudiante tuvo el instrumento.
          </AlertDescription>
        </Alert>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirmar}>
            Eliminar comodato
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
