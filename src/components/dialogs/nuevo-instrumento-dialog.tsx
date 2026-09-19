import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SelectField } from "@/components/select-field"
import { rutaUbicacion } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { CondicionFisica, Familia } from "@/lib/types"

const FAMILIAS: Familia[] = ["Cuerdas", "Maderas", "Metales", "Percusión"]
const CONDICIONES: CondicionFisica[] = ["Excelente", "Buena", "Regular", "Deteriorada"]

const vacio = {
  prefijo: "",
  nombre: "",
  familia: "" as Familia | "",
  marca: "",
  modelo: "",
  serial: "",
  medida: "",
  material: "",
  anio: String(new Date().getFullYear()),
  condicion: "Buena" as CondicionFisica,
  ubicacionId: "",
  accesorios: "",
}

export function NuevoInstrumentoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const store = useStore()
  const [f, setF] = useState(vacio)
  const [intentado, setIntentado] = useState(false)
  const set = <K extends keyof typeof vacio>(k: K, v: (typeof vacio)[K]) => setF((s) => ({ ...s, [k]: v }))

  // Código correlativo por prefijo: OSC-<PREFIJO>-<NNN>
  const codigo = useMemo(() => {
    const p = f.prefijo.trim().toUpperCase()
    if (!p) return ""
    const max = store.db.instrumentos
      .filter((i) => i.codigo.startsWith(`OSC-${p}-`))
      .reduce((m, i) => Math.max(m, Number(i.codigo.split("-")[2]) || 0), 0)
    return `OSC-${p}-${String(max + 1).padStart(3, "0")}`
  }, [f.prefijo, store.db.instrumentos])

  const errores: Record<string, string> = {}
  if (!/^[A-Za-z]{2,4}$/.test(f.prefijo.trim())) errores.prefijo = "De 2 a 4 letras, ej. VLN."
  if (!f.nombre.trim()) errores.nombre = "Requerido."
  if (!f.familia) errores.familia = "Requerido."
  if (!f.marca.trim()) errores.marca = "Requerido."
  if (!f.modelo.trim()) errores.modelo = "Requerido."
  if (!f.serial.trim()) errores.serial = "Requerido."
  else if (store.db.instrumentos.some((i) => i.serial.toUpperCase() === f.serial.trim().toUpperCase()))
    errores.serial = "Ya existe un instrumento con este serial."
  if (!f.ubicacionId) errores.ubicacionId = "Selecciona dónde se resguarda."
  const err = (k: string) => (intentado ? errores[k] : undefined)

  const cerrar = (o: boolean) => {
    if (!o) {
      setF(vacio)
      setIntentado(false)
    }
    onOpenChange(o)
  }

  const guardar = () => {
    setIntentado(true)
    if (Object.keys(errores).length) return
    const nuevo = store.crearInstrumento({
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
      ubicacionId: f.ubicacionId,
      accesorios: f.accesorios.split(",").map((a) => a.trim()).filter(Boolean),
    })
    toast.success(`Instrumento ${nuevo.codigo} registrado`)
    cerrar(false)
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar instrumento</DialogTitle>
          <DialogDescription>Se registra como “Disponible” en la ubicación de resguardo indicada.</DialogDescription>
        </DialogHeader>
        <FieldGroup className="max-h-[65vh] gap-4 overflow-y-auto px-0.5 py-1">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field data-invalid={!!err("prefijo")}>
              <FieldLabel htmlFor="ni-prefijo">Prefijo del código</FieldLabel>
              <Input id="ni-prefijo" className="font-mono uppercase" maxLength={4} placeholder="VLN" value={f.prefijo} onChange={(e) => set("prefijo", e.target.value)} />
              <FieldError>{err("prefijo")}</FieldError>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Código asignado</FieldLabel>
              <div className="bg-muted flex h-8 items-center rounded-lg px-2.5 font-mono text-sm">{codigo || "—"}</div>
              <FieldDescription>Se genera automáticamente y va en la etiqueta física.</FieldDescription>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!err("nombre")}>
              <FieldLabel htmlFor="ni-nombre">Instrumento</FieldLabel>
              <Input id="ni-nombre" placeholder="Violín" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} />
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
              <Input id="ni-medida" placeholder="4/4, 3/4…" value={f.medida} onChange={(e) => set("medida", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="ni-material">Material (opcional)</FieldLabel>
              <Input id="ni-material" value={f.material} onChange={(e) => set("material", e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="ni-condicion">Condición</FieldLabel>
              <SelectField id="ni-condicion" value={f.condicion} onChange={(v) => set("condicion", v as CondicionFisica)} options={CONDICIONES.map((x) => ({ value: x, label: x }))} />
            </Field>
            <Field data-invalid={!!err("ubicacionId")}>
              <FieldLabel htmlFor="ni-ubicacion">Ubicación de resguardo</FieldLabel>
              <SelectField id="ni-ubicacion" value={f.ubicacionId} onChange={(v) => set("ubicacionId", v)} invalid={!!err("ubicacionId")} options={store.db.ubicaciones.map((u) => ({ value: u.id, label: rutaUbicacion(u) }))} />
              <FieldError>{err("ubicacionId")}</FieldError>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="ni-accesorios">Accesorios</FieldLabel>
            <Input id="ni-accesorios" placeholder="Estuche, Arco, Resina" value={f.accesorios} onChange={(e) => set("accesorios", e.target.value)} />
            <FieldDescription>Separados por coma. Se listan en el contrato.</FieldDescription>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => cerrar(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar}>Registrar instrumento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
