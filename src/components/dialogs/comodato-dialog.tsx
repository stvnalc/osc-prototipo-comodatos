import { useMemo, useState } from "react"
import { Handshake, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SelectField } from "@/components/select-field"
import { addDays, edad, nombreCompleto, nombreSede, sedeConDireccion, todayIso } from "@/lib/format"
import { descargarContrato } from "@/lib/pdf"
import { useStore } from "@/lib/store"
import { CONDICIONES, type CondicionFisica, type Comodato } from "@/lib/types"

const DURACIONES = [
  { label: "3 meses", dias: 90 },
  { label: "6 meses", dias: 182 },
  { label: "1 año", dias: 365 },
]

export function ComodatoDialog({
  open,
  onOpenChange,
  presetInstrumentoId,
  presetIntegranteId,
  comodato,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  presetInstrumentoId?: string
  presetIntegranteId?: string
  /** Si viene, el diálogo edita ese comodato en lugar de crear uno nuevo. */
  comodato?: Comodato
}) {
  const store = useStore()
  const { db } = store
  const hoy = todayIso()
  const editando = !!comodato

  const [instrumentoId, setInstrumentoId] = useState(comodato?.instrumentoId ?? presetInstrumentoId ?? "")
  const [integranteId, setIntegranteId] = useState(comodato?.integranteId ?? presetIntegranteId ?? "")
  const [sedeId, setSedeId] = useState(comodato?.sedeId ?? "")
  const [fechaInicio, setFechaInicio] = useState(comodato?.fechaInicio ?? hoy)
  const [fechaFin, setFechaFin] = useState(comodato?.fechaFin ?? addDays(hoy, 182))
  const [condicion, setCondicion] = useState<string>(comodato?.condicionEntrega ?? "")
  const [observaciones, setObservaciones] = useState(comodato?.observaciones ?? "")
  const [intentado, setIntentado] = useState(false)

  const disponibles = db.instrumentos.filter(
    (i) => i.estado === "disponible" || i.id === presetInstrumentoId || i.id === comodato?.instrumentoId
  )
  const instrumento = store.instrumento(instrumentoId)
  const integrante = store.integrante(integranteId)

  // Por defecto el instrumento queda en la sede del integrante.
  const sedeElegida = sedeId || integrante?.sedeId || ""

  const errores = useMemo(() => {
    const e: Record<string, string> = {}
    if (!instrumentoId) e.instrumento = "Selecciona un instrumento disponible."
    if (!integranteId) e.integrante = "Selecciona el integrante que recibirá el instrumento."
    if (!sedeElegida) e.sede = "Indica en qué sede quedará el instrumento."
    if (!fechaInicio) e.fechaInicio = "Indica la fecha de asignación."
    if (!fechaFin) e.fechaFin = "Indica la fecha de devolución."
    else if (fechaFin <= fechaInicio) e.fechaFin = "La devolución debe ser posterior a la asignación."
    return e
  }, [instrumentoId, integranteId, sedeElegida, fechaInicio, fechaFin])

  const menorSinRepresentante = integrante && edad(integrante.fechaNacimiento) < 18 && !integrante.representante
  const otrosComodatos = integrante
    ? store.comodatosDeIntegrante(integrante.id).filter((c) => c.id !== comodato?.id).length
    : 0

  const guardar = () => {
    setIntentado(true)
    if (Object.keys(errores).length || !instrumento || !integrante) return
    const datos = {
      instrumentoId,
      integranteId,
      sedeId: sedeElegida,
      fechaInicio,
      fechaFin,
      condicionEntrega: (condicion || instrumento.condicion) as CondicionFisica,
      observaciones: observaciones.trim() || undefined,
    }
    if (comodato) {
      store.actualizarComodato(comodato.id, datos)
      toast.success(`Comodato ${comodato.numero} actualizado`)
      onOpenChange(false)
      return
    }
    const c = store.crearComodato(datos)
    onOpenChange(false)
    toast.success(`Comodato ${c.numero} registrado`, {
      description: `${instrumento.codigo} asignado a ${nombreCompleto(integrante)} · ${nombreSede(store.sede(sedeElegida))}.`,
      action: {
        label: "Descargar PDF",
        onClick: () =>
          descargarContrato({
            comodato: c,
            instrumento,
            integrante,
            sede: store.sede(sedeElegida),
            sedeIntegrante: store.sede(integrante.sedeId),
          }),
      },
    })
  }

  const err = (k: string) => (intentado ? errores[k] : undefined)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{editando ? `Editar comodato ${comodato.numero}` : "Nuevo comodato"}</DialogTitle>
          <DialogDescription>
            {editando
              ? "Corrige las fechas, la sede o las observaciones del préstamo."
              : "Asigna un instrumento disponible a un integrante. El instrumento pasa a “En comodato” y su sede de resguardo queda suspendida."}
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
                hint: i.familia,
              }))}
            />
            {instrumento && (
              <p className="text-muted-foreground text-xs">
                {instrumento.marca} {instrumento.modelo} · Serial {instrumento.serial} · Resguardo:{" "}
                {nombreSede(store.sede(instrumento.sedeId))}
              </p>
            )}
            <FieldError>{err("instrumento")}</FieldError>
          </Field>

          <Field data-invalid={!!err("integrante")}>
            <FieldLabel htmlFor="nc-integrante">Integrante</FieldLabel>
            <SelectField
              id="nc-integrante"
              value={integranteId}
              onChange={(v) => {
                setIntegranteId(v)
                if (!comodato) setSedeId("")
              }}
              invalid={!!err("integrante")}
              options={db.integrantes.map((e) => ({
                value: e.id,
                label: `${nombreCompleto(e)} · ${e.cedula}`,
                hint: e.catedra,
              }))}
            />
            {integrante && (
              <p className="text-muted-foreground text-xs">
                {integrante.catedra} · {nombreSede(store.sede(integrante.sedeId))} · {edad(integrante.fechaNacimiento)} años
                {integrante.representante && ` · Representante: ${integrante.representante.nombre}`}
              </p>
            )}
            <FieldError>{err("integrante")}</FieldError>
          </Field>

          <Field data-invalid={!!err("sede")}>
            <FieldLabel htmlFor="nc-sede">Sede donde quedará el instrumento</FieldLabel>
            <SelectField
              id="nc-sede"
              value={sedeElegida}
              onChange={setSedeId}
              invalid={!!err("sede")}
              options={db.sedes.map((s) => ({ value: s.id, label: sedeConDireccion(s) }))}
            />
            <FieldDescription>Por defecto, la sede del integrante. Cámbiala si ensaya en otra.</FieldDescription>
            <FieldError>{err("sede")}</FieldError>
          </Field>

          {menorSinRepresentante && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
              <TriangleAlert />
              <AlertTitle>Integrante menor de edad sin representante</AlertTitle>
              <AlertDescription>El contrato debería firmarlo un representante legal. Regístralo antes de imprimir.</AlertDescription>
            </Alert>
          )}
          {otrosComodatos > 0 && (
            <Alert>
              <TriangleAlert />
              <AlertTitle>Este integrante ya tiene {otrosComodatos} instrumento(s) en comodato</AlertTitle>
              <AlertDescription>¿Se permite más de un comodato por integrante? Regla a confirmar con la fundación.</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!err("fechaInicio")}>
              <FieldLabel htmlFor="nc-inicio">Fecha de asignación</FieldLabel>
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
          <Button onClick={guardar}>
            <Handshake data-icon="inline-start" />
            {editando ? "Guardar cambios" : "Registrar comodato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
