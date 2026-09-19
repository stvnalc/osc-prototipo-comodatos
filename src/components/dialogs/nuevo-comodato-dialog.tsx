import { useMemo, useState } from "react"
import { FileDown, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SelectField } from "@/components/select-field"
import { addDays, edad, nombreCompleto, rutaUbicacion, todayIso } from "@/lib/format"
import { descargarContrato } from "@/lib/pdf"
import { useStore } from "@/lib/store"
import type { CondicionFisica } from "@/lib/types"

const CONDICIONES: CondicionFisica[] = ["Excelente", "Buena", "Regular", "Deteriorada"]
const DURACIONES = [
  { label: "3 meses", dias: 90 },
  { label: "6 meses", dias: 182 },
  { label: "1 año", dias: 365 },
]

export function NuevoComodatoDialog({
  open,
  onOpenChange,
  presetInstrumentoId,
  presetEstudianteId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetInstrumentoId?: string
  presetEstudianteId?: string
}) {
  const store = useStore()
  const { db } = store
  const hoy = todayIso()

  const [instrumentoId, setInstrumentoId] = useState(presetInstrumentoId ?? "")
  const [estudianteId, setEstudianteId] = useState(presetEstudianteId ?? "")
  const [fechaInicio, setFechaInicio] = useState(hoy)
  const [fechaFin, setFechaFin] = useState(addDays(hoy, 182))
  const [condicion, setCondicion] = useState<string>("")
  const [observaciones, setObservaciones] = useState("")
  const [intentado, setIntentado] = useState(false)

  const disponibles = db.instrumentos.filter((i) => i.estado === "disponible" || i.id === presetInstrumentoId)
  const instrumento = store.instrumento(instrumentoId)
  const estudiante = store.estudiante(estudianteId)

  const errores = useMemo(() => {
    const e: Record<string, string> = {}
    if (!instrumentoId) e.instrumento = "Selecciona un instrumento disponible."
    if (!estudianteId) e.estudiante = "Selecciona el estudiante que recibirá el instrumento."
    if (!fechaInicio) e.fechaInicio = "Indica la fecha de entrega."
    if (!fechaFin) e.fechaFin = "Indica la fecha de devolución."
    else if (fechaFin <= fechaInicio) e.fechaFin = "La devolución debe ser posterior a la entrega."
    return e
  }, [instrumentoId, estudianteId, fechaInicio, fechaFin])

  const menorSinRepresentante = estudiante && edad(estudiante.fechaNacimiento) < 18 && !estudiante.representante
  const yaTieneComodato = estudiante ? store.comodatosDeEstudiante(estudiante.id).length : 0

  const registrar = () => {
    setIntentado(true)
    if (Object.keys(errores).length || !instrumento || !estudiante) return
    const c = store.crearComodato({
      instrumentoId,
      estudianteId,
      fechaInicio,
      fechaFin,
      condicionEntrega: (condicion || instrumento.condicion) as CondicionFisica,
      observaciones: observaciones.trim() || undefined,
    })
    onOpenChange(false)
    toast.success(`Comodato ${c.numero} registrado`, {
      description: `${instrumento.codigo} asignado a ${nombreCompleto(estudiante)}.`,
      action: {
        label: "Descargar PDF",
        onClick: () => descargarContrato({ comodato: c, instrumento, estudiante, ubicacion: store.ubicacion(instrumento.ubicacionId) }),
      },
    })
  }

  const err = (k: string) => (intentado ? errores[k] : undefined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nuevo comodato</DialogTitle>
          <DialogDescription>
            Asigna un instrumento disponible a un estudiante. Al registrarlo, el instrumento pasa a “En comodato” y su
            ubicación de resguardo queda suspendida.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup className="max-h-[65vh] gap-4 overflow-y-auto px-0.5 py-1">
          <Field data-invalid={!!err("instrumento")}>
            <FieldLabel htmlFor="nc-instrumento">Instrumento</FieldLabel>
            <SelectField
              id="nc-instrumento"
              value={instrumentoId}
              onChange={(v) => {
                setInstrumentoId(v)
                setCondicion("")
              }}
              invalid={!!err("instrumento")}
              placeholder={disponibles.length ? "Buscar entre los disponibles…" : "No hay instrumentos disponibles"}
              options={disponibles.map((i) => ({
                value: i.id,
                label: `${i.codigo} · ${i.nombre} ${i.marca}`,
                hint: i.medida,
              }))}
            />
            {instrumento && (
              <p className="text-muted-foreground text-xs">
                {instrumento.marca} {instrumento.modelo} · Serial {instrumento.serial} · Resguardo:{" "}
                {rutaUbicacion(store.ubicacion(instrumento.ubicacionId))}
              </p>
            )}
            <FieldError>{err("instrumento")}</FieldError>
          </Field>

          <Field data-invalid={!!err("estudiante")}>
            <FieldLabel htmlFor="nc-estudiante">Estudiante</FieldLabel>
            <SelectField
              id="nc-estudiante"
              value={estudianteId}
              onChange={setEstudianteId}
              invalid={!!err("estudiante")}
              options={db.estudiantes.map((e) => ({
                value: e.id,
                label: `${nombreCompleto(e)} · ${e.cedula}`,
                hint: e.catedra,
              }))}
            />
            {estudiante && (
              <p className="text-muted-foreground text-xs">
                {estudiante.catedra} · {estudiante.nucleo} · {edad(estudiante.fechaNacimiento)} años
                {estudiante.representante && ` · Representante: ${estudiante.representante.nombre}`}
              </p>
            )}
            <FieldError>{err("estudiante")}</FieldError>
          </Field>

          {menorSinRepresentante && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <TriangleAlert />
              <AlertTitle>Estudiante menor de edad sin representante</AlertTitle>
              <AlertDescription>El contrato debería firmarlo un representante legal. Regístralo antes de imprimir.</AlertDescription>
            </Alert>
          )}
          {yaTieneComodato > 0 && (
            <Alert>
              <TriangleAlert />
              <AlertTitle>Este estudiante ya tiene {yaTieneComodato} instrumento(s) en comodato</AlertTitle>
              <AlertDescription>¿Se permite más de un comodato por estudiante? Regla a confirmar con la orquesta.</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!err("fechaInicio")}>
              <FieldLabel htmlFor="nc-inicio">Fecha de entrega</FieldLabel>
              <Input id="nc-inicio" type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              <FieldError>{err("fechaInicio")}</FieldError>
            </Field>
            <Field data-invalid={!!err("fechaFin")}>
              <FieldLabel htmlFor="nc-fin">Fecha de devolución</FieldLabel>
              <Input id="nc-fin" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
              <div className="flex gap-1">
                {DURACIONES.map((d) => (
                  <Button
                    key={d.label}
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={() => setFechaFin(addDays(fechaInicio || hoy, d.dias))}
                  >
                    {d.label}
                  </Button>
                ))}
              </div>
              <FieldError>{err("fechaFin")}</FieldError>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="nc-condicion">Condición al entregar</FieldLabel>
            <SelectField
              id="nc-condicion"
              value={condicion || instrumento?.condicion || ""}
              onChange={setCondicion}
              options={CONDICIONES.map((c) => ({ value: c, label: c }))}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="nc-obs">Observaciones (opcional)</FieldLabel>
            <Textarea
              id="nc-obs"
              rows={2}
              placeholder="Ej.: se entrega con estuche nuevo; cuerda Mi reemplazada."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={registrar}>
            <FileDown data-icon="inline-start" />
            Registrar comodato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
