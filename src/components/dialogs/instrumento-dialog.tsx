import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { FotoInput } from "@/components/foto-instrumento"
import { SelectField } from "@/components/select-field"
import { sedeConDireccion } from "@/lib/format"
import { useStore } from "@/lib/store"
import { CONDICIONES, FAMILIAS, type CondicionFisica, type Familia, type Instrumento } from "@/lib/types"

const vacio = {
  abrev: "",
  nombre: "",
  familia: "" as Familia | "",
  marca: "",
  modelo: "",
  serial: "",
  medida: "",
  material: "",
  anio: String(new Date().getFullYear()),
  condicion: "Buena" as CondicionFisica,
  sedeId: "",
  accesorios: "",
  observaciones: "",
  foto: undefined as string | undefined,
}

function desde(i: Instrumento): typeof vacio {
  return {
    abrev: i.codigo.split("-")[0].replace(/\d+$/, ""),
    nombre: i.nombre,
    familia: i.familia,
    marca: i.marca,
    modelo: i.modelo,
    serial: i.serial,
    medida: i.medida ?? "",
    material: i.material ?? "",
    anio: String(i.anioAdquisicion),
    condicion: i.condicion,
    sedeId: i.sedeId ?? "",
    accesorios: i.accesorios.join(", "),
    observaciones: i.observaciones ?? "",
    foto: i.foto,
  }
}

export function InstrumentoDialog({
  open,
  onOpenChange,
  instrumento,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Si viene, el diálogo edita ese instrumento en lugar de crear uno nuevo. */
  instrumento?: Instrumento
}) {
  const store = useStore()
  const editando = !!instrumento
  const [f, setF] = useState(() => (instrumento ? desde(instrumento) : vacio))
  const [intentado, setIntentado] = useState(false)
  const set = <K extends keyof typeof vacio>(k: K, v: (typeof vacio)[K]) => setF((s) => ({ ...s, [k]: v }))

  // Código acordado con la fundación: Pi004-FOSC
  const codigo = useMemo(() => {
    const a = f.abrev.trim()
    if (!a) return ""
    const abrev = a[0].toUpperCase() + a.slice(1).toLowerCase()
    if (editando && instrumento && desde(instrumento).abrev.toLowerCase() === a.toLowerCase()) return instrumento.codigo
    const max = store.db.instrumentos
      .filter((i) => i.codigo.toLowerCase().startsWith(abrev.toLowerCase()))
      .reduce((m, i) => Math.max(m, Number(i.codigo.replace(/^[A-Za-z]+/, "").split("-")[0]) || 0), 0)
    return `${abrev}${String(max + 1).padStart(3, "0")}-FOSC`
  }, [f.abrev, store.db.instrumentos, editando, instrumento])

  const errores: Record<string, string> = {}
  if (!/^[A-Za-z]{2,4}$/.test(f.abrev.trim())) errores.abrev = "De 2 a 4 letras, ej. Pi para piano."
  if (!f.nombre.trim()) errores.nombre = "Requerido."
  if (!f.familia) errores.familia = "Requerido."
  if (!f.marca.trim()) errores.marca = "Requerido."
  if (!f.modelo.trim()) errores.modelo = "Requerido."
  if (!f.serial.trim()) errores.serial = "Requerido."
  else if (store.db.instrumentos.some((i) => i.serial.toUpperCase() === f.serial.trim().toUpperCase() && i.id !== instrumento?.id))
    errores.serial = "Ya existe un instrumento con este serial."
  if (!f.sedeId) errores.sedeId = "Selecciona la sede de resguardo."
  const err = (k: string) => (intentado ? errores[k] : undefined)

  const cerrar = (o: boolean) => {
    if (!o) {
      setF(instrumento ? desde(instrumento) : vacio)
      setIntentado(false)
    }
    onOpenChange(o)
  }

  const guardar = () => {
    setIntentado(true)
    if (Object.keys(errores).length) return
    const datos = {
      codigo,
      nombre: f.nombre.trim(),
      familia: f.familia as Familia,
      marca: f.marca.trim(),
      modelo: f.modelo.trim(),
      serial: f.serial.trim().toUpperCase(),
      medida: f.medida.trim() || undefined,
      material: f.material.trim() || undefined,
      anioAdquisicion: Number(f.anio) || new Date().getFullYear(),
      condicion: f.condicion,
      sedeId: f.sedeId,
      accesorios: f.accesorios.split(",").map((a) => a.trim()).filter(Boolean),
      observaciones: f.observaciones.trim() || undefined,
      foto: f.foto,
    }
    if (instrumento) {
      store.actualizarInstrumento(instrumento.id, datos)
      toast.success(`${codigo} actualizado`)
    } else {
      const nuevo = store.crearInstrumento(datos)
      toast.success(`Instrumento ${nuevo.codigo} registrado`)
    }
    cerrar(false)
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editando ? `Editar ${instrumento.codigo}` : "Registrar instrumento"}</DialogTitle>
          <DialogDescription>
            {editando
              ? "Corrige la ficha del instrumento. El estado y el comodato se gestionan aparte."
              : "Se registra como “Disponible” en la sede de resguardo indicada."}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="max-h-[65vh] gap-4 overflow-y-auto px-0.5 py-1">
          <Field>
            <FieldLabel>Foto del instrumento</FieldLabel>
            <FotoInput value={f.foto} onChange={(foto) => set("foto", foto)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field data-invalid={!!err("abrev")}>
              <FieldLabel htmlFor="ni-abrev">Abreviatura</FieldLabel>
              <Input id="ni-abrev" className="font-mono" maxLength={4} placeholder="Pi" value={f.abrev} onChange={(e) => set("abrev", e.target.value)} />
              <FieldError>{err("abrev")}</FieldError>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Código de inventario</FieldLabel>
              <div className="bg-muted flex h-8 items-center rounded-lg px-2.5 font-mono text-sm">{codigo || "—"}</div>
              <FieldDescription>Abreviatura + correlativo + FOSC. Va en la etiqueta física.</FieldDescription>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!err("nombre")}>
              <FieldLabel htmlFor="ni-nombre">Instrumento</FieldLabel>
              <Input id="ni-nombre" placeholder="Piano vertical" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} />
              <FieldError>{err("nombre")}</FieldError>
            </Field>
            <Field data-invalid={!!err("familia")}>
              <FieldLabel htmlFor="ni-familia">Familia</FieldLabel>
              <SelectField id="ni-familia" value={f.familia} onChange={(v) => set("familia", v as Familia)} invalid={!!err("familia")} options={FAMILIAS.map((x) => ({ value: x, label: x }))} />
              <FieldError>{err("familia")}</FieldError>
            </Field>
            <Field data-invalid={!!err("marca")}>
              <FieldLabel htmlFor="ni-marca">Marca</FieldLabel>
              <Input id="ni-marca" value={f.marca} onChange={(e) => set("marca", e.target.value)} />
              <FieldError>{err("marca")}</FieldError>
            </Field>
            <Field data-invalid={!!err("modelo")}>
              <FieldLabel htmlFor="ni-modelo">Modelo</FieldLabel>
              <Input id="ni-modelo" value={f.modelo} onChange={(e) => set("modelo", e.target.value)} />
              <FieldError>{err("modelo")}</FieldError>
            </Field>
            <Field data-invalid={!!err("serial")}>
              <FieldLabel htmlFor="ni-serial">Serial del fabricante</FieldLabel>
              <Input id="ni-serial" className="font-mono" value={f.serial} onChange={(e) => set("serial", e.target.value)} />
              <FieldError>{err("serial")}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="ni-anio">Año de adquisición</FieldLabel>
              <Input id="ni-anio" type="number" min={1950} max={2100} value={f.anio} onChange={(e) => set("anio", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="ni-medida">Medida (opcional)</FieldLabel>
              <Input id="ni-medida" placeholder="4/4, 88 teclas…" value={f.medida} onChange={(e) => set("medida", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="ni-material">Material (opcional)</FieldLabel>
              <Input id="ni-material" value={f.material} onChange={(e) => set("material", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="ni-condicion">Condición</FieldLabel>
              <SelectField id="ni-condicion" value={f.condicion} onChange={(v) => set("condicion", v as CondicionFisica)} options={CONDICIONES.map((x) => ({ value: x, label: x }))} />
            </Field>
            <Field data-invalid={!!err("sedeId")}>
              <FieldLabel htmlFor="ni-sede">Sede de resguardo</FieldLabel>
              <SelectField id="ni-sede" value={f.sedeId} onChange={(v) => set("sedeId", v)} invalid={!!err("sedeId")} options={store.db.sedes.map((s) => ({ value: s.id, label: sedeConDireccion(s) }))} />
              <FieldError>{err("sedeId")}</FieldError>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="ni-accesorios">Accesorios</FieldLabel>
            <Input id="ni-accesorios" placeholder="Estuche, Arco, Resina" value={f.accesorios} onChange={(e) => set("accesorios", e.target.value)} />
            <FieldDescription>Separados por coma. Se listan en el contrato.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="ni-obs">Observaciones (opcional)</FieldLabel>
            <Textarea id="ni-obs" rows={2} value={f.observaciones} onChange={(e) => set("observaciones", e.target.value)} />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => cerrar(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar}>{editando ? "Guardar cambios" : "Registrar instrumento"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
