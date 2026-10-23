import { useState } from "react"
import { Archive } from "lucide-react"
import { toast } from "sonner"
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
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { SelectField } from "@/components/select-field"
import { formatDate, nombreCompleto, sedeConDireccion, nombreSede, todayIso } from "@/lib/format"
import { useStore } from "@/lib/store"

/** Motivos frecuentes del cierre; se pueden editar antes de guardar. */
const MOTIVOS = [
  "Creció y se le dio otro instrumento.",
  "Devuelto en la recolección de diciembre.",
  "Se retiró del programa.",
  "Cambio de cátedra.",
]

export function ArchivarComodatoDialog({ comodatoId, onClose }: { comodatoId: string | null; onClose: () => void }) {
  const store = useStore()
  const comodato = store.db.comodatos.find((c) => c.id === comodatoId)
  const instrumento = comodato && store.instrumento(comodato.instrumentoId)
  const integrante = comodato && store.integrante(comodato.integranteId)
  const [sedeId, setSedeId] = useState<string>("")
  const [motivo, setMotivo] = useState("")
  const [intentado, setIntentado] = useState(false)

  const destino = sedeId || instrumento?.sedeId || ""
  const error = !motivo.trim() ? "Indica por qué se cierra el comodato." : undefined

  const limpiar = () => {
    setSedeId("")
    setMotivo("")
    setIntentado(false)
  }

  const confirmar = () => {
    setIntentado(true)
    if (!comodato || !instrumento || error) return
    store.archivarComodato(comodato.id, destino || null, motivo.trim())
    toast.success(`Comodato ${comodato.codigo} archivado`, {
      description: `${instrumento.codigo} vuelve a estar Disponible en ${nombreSede(store.sede(destino))}.`,
    })
    limpiar()
    onClose()
  }

  return (
    <AlertDialog
      open={!!comodato}
      onOpenChange={(o) => {
        if (!o) {
          limpiar()
          onClose()
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Archive />
          </AlertDialogMedia>
          <AlertDialogTitle>Recibir instrumento y archivar comodato</AlertDialogTitle>
          <AlertDialogDescription>
            {comodato && instrumento && integrante && (
              <>
                <span className="text-foreground font-medium">{comodato.codigo}</span> · {instrumento.codigo} (
                {instrumento.nombre}) entregado a{" "}
                <span className="text-foreground font-medium">{nombreCompleto(integrante)}</span> el{" "}
                {formatDate(comodato.fechaInicio)}.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Field>
          <FieldLabel htmlFor="ac-sede">Sede de resguardo al recibirlo</FieldLabel>
          <SelectField
            id="ac-sede"
            value={destino}
            onChange={setSedeId}
            options={store.db.sedes.map((s) => ({ value: s.id, label: sedeConDireccion(s) }))}
          />
          <FieldDescription>Por defecto vuelve a su sede de resguardo original.</FieldDescription>
        </Field>

        <Field data-invalid={intentado && !!error}>
          <FieldLabel htmlFor="ac-motivo">Nota: ¿por qué se cierra?</FieldLabel>
          <Textarea
            id="ac-motivo"
            rows={2}
            placeholder="Ej.: creció y se le dio otro violín."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            aria-invalid={(intentado && !!error) || undefined}
          />
          <div className="flex flex-wrap gap-1">
            {MOTIVOS.map((m) => (
              <Button
                key={m}
                type="button"
                variant="outline"
                size="xs"
                // El Field en error tiñe de rojo su contenido; las sugerencias no son el error.
                className="text-foreground"
                onClick={() => setMotivo(m)}
              >
                {m.replace(/\.$/, "")}
              </Button>
            ))}
          </div>
          <FieldDescription>
            Queda guardada en el historial junto con la fecha de archivo ({formatDate(todayIso())}).
          </FieldDescription>
          <FieldError>{intentado ? error : undefined}</FieldError>
        </Field>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={confirmar}>Archivar comodato</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
