import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SelectField } from "@/components/select-field"
import { edad, nombreCompleto, sedeConDireccion } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { Integrante } from "@/lib/types"

const vacio = {
  nombre: "",
  cedula: "",
  rif: "",
  fechaNacimiento: "",
  telefono: "",
  email: "",
  sedeId: "",
  catedra: "",
  direccionFiscal: "",
  repNombre: "",
  repCedula: "",
  repRif: "",
  repTelefono: "",
  repParentesco: "",
}

function desde(e: Integrante): typeof vacio {
  return {
    nombre: e.nombre,
    cedula: e.cedula ?? "",
    rif: e.rif ?? "",
    fechaNacimiento: e.fechaNacimiento,
    telefono: e.telefono,
    email: e.email,
    sedeId: e.sedeId,
    catedra: e.catedra,
    direccionFiscal: e.direccionFiscal,
    repNombre: e.representante?.nombre ?? "",
    repCedula: e.representante?.cedula ?? "",
    repRif: e.representante?.rif ?? "",
    repTelefono: e.representante?.telefono ?? "",
    repParentesco: e.representante?.parentesco ?? "",
  }
}

export function IntegranteDialog({
  open,
  onOpenChange,
  integrante,
  onCreado,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Si viene, el diálogo edita ese integrante en lugar de crear uno nuevo. */
  integrante?: Integrante
  /** Se llama al registrar uno nuevo (p. ej. para seleccionarlo en el comodato). */
  onCreado?: (integrante: Integrante) => void
}) {
  const store = useStore()
  const editando = !!integrante
  const [f, setF] = useState(() => (integrante ? desde(integrante) : vacio))
  const [intentado, setIntentado] = useState(false)
  const set = (k: keyof typeof vacio) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  const menor = f.fechaNacimiento ? edad(f.fechaNacimiento) < 18 : false

  // La cédula y el RIF no son obligatorios (acuerdo del 2026-10-03), ni el
  // representante, aunque el integrante sea menor de edad.
  const errores: Record<string, string> = {}
  for (const k of ["nombre", "fechaNacimiento", "telefono", "catedra", "sedeId", "direccionFiscal"] as const)
    if (!f[k].trim()) errores[k] = "Requerido."
  if (f.cedula.trim() && store.db.integrantes.some((e) => e.cedula === f.cedula.trim() && e.id !== integrante?.id))
    errores.cedula = "Ya existe un integrante con esta cédula."
  const err = (k: string) => (intentado ? errores[k] : undefined)

  const cerrar = (o: boolean) => {
    if (!o) {
      setF(integrante ? desde(integrante) : vacio)
      setIntentado(false)
    }
    onOpenChange(o)
  }

  const guardar = () => {
    setIntentado(true)
    if (Object.keys(errores).length) return
    const datos = {
      nombre: f.nombre.trim(),
      cedula: f.cedula.trim() || undefined,
      rif: f.rif.trim() || undefined,
      fechaNacimiento: f.fechaNacimiento,
      telefono: f.telefono.trim(),
      email: f.email.trim(),
      sedeId: f.sedeId,
      catedra: f.catedra.trim(),
      direccionFiscal: f.direccionFiscal.trim(),
      representante: f.repNombre.trim()
        ? {
            nombre: f.repNombre.trim(),
            cedula: f.repCedula.trim() || undefined,
            rif: f.repRif.trim() || undefined,
            telefono: f.repTelefono.trim() || undefined,
            parentesco: f.repParentesco.trim() || "Representante",
          }
        : undefined,
    }
    if (integrante) {
      store.actualizarIntegrante(integrante.id, datos)
      toast.success(`${datos.nombre} actualizado(a)`)
    } else {
      const e = store.crearIntegrante(datos)
      toast.success(`${nombreCompleto(e)} registrado(a)`)
      onCreado?.(e)
    }
    cerrar(false)
  }

  const campo = (k: keyof typeof vacio, label: string, props: React.ComponentProps<"input"> = {}) => (
    <Field data-invalid={!!err(k)}>
      <FieldLabel htmlFor={`ne-${k}`}>{label}</FieldLabel>
      <Input id={`ne-${k}`} value={f[k]} onChange={set(k)} aria-invalid={!!err(k) || undefined} {...props} />
      <FieldError>{err(k)}</FieldError>
    </Field>
  )

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editando ? `Editar ${nombreCompleto(integrante)}` : "Registrar integrante"}</DialogTitle>
          <DialogDescription>Datos necesarios para el contrato de comodato.</DialogDescription>
        </DialogHeader>
        <FieldGroup className="max-h-[65vh] gap-4 overflow-y-auto px-0.5 py-1">
          <Field data-invalid={!!err("nombre")}>
            <FieldLabel htmlFor="ne-nombre">Nombre completo</FieldLabel>
            <Input
              id="ne-nombre"
              value={f.nombre}
              onChange={set("nombre")}
              aria-invalid={!!err("nombre") || undefined}
              placeholder="Nombres y apellidos"
            />
            <FieldError>{err("nombre")}</FieldError>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            {campo("cedula", "Cédula (opcional)", { placeholder: "V-30.000.000" })}
            {campo("rif", "RIF (opcional)", { placeholder: "V-300000000" })}
            {campo("fechaNacimiento", "Fecha de nacimiento", { type: "date" })}
            {campo("telefono", "Teléfono", { placeholder: "0414-000-0000" })}
            {campo("email", "Correo", { type: "email" })}
            {campo("catedra", "Cátedra", { placeholder: "Violín" })}
            <Field data-invalid={!!err("sedeId")} className="sm:col-span-2">
              <FieldLabel htmlFor="ne-sede">Sede recurrente a la que va el integrante</FieldLabel>
              <SelectField
                id="ne-sede"
                value={f.sedeId}
                onChange={(v) => setF((s) => ({ ...s, sedeId: v }))}
                invalid={!!err("sedeId")}
                options={store.db.sedes.map((s) => ({ value: s.id, label: sedeConDireccion(s) }))}
              />
              <FieldError>{err("sedeId")}</FieldError>
            </Field>
          </div>
          <Field data-invalid={!!err("direccionFiscal")}>
            <FieldLabel htmlFor="ne-direccionFiscal">Dirección fiscal</FieldLabel>
            <Input
              id="ne-direccionFiscal"
              value={f.direccionFiscal}
              onChange={set("direccionFiscal")}
              aria-invalid={!!err("direccionFiscal") || undefined}
              placeholder="Urbanización, calle, número, ciudad, estado"
            />
            <FieldDescription>Aparece en el contrato de comodato.</FieldDescription>
            <FieldError>{err("direccionFiscal")}</FieldError>
          </Field>
          <FieldSet>
            <FieldLegend variant="label">Representante (opcional)</FieldLegend>
            <FieldDescription>
              {menor
                ? "Es menor de edad: si hay representante, el instrumento se registra a su nombre en el contrato."
                : "Los integrantes mayores de edad también pueden tener representante."}
            </FieldDescription>
            <div className="grid gap-4 sm:grid-cols-2">
              {campo("repNombre", "Nombre completo")}
              {campo("repCedula", "Cédula (opcional)")}
              {campo("repRif", "RIF (opcional)", { placeholder: "V-123456789" })}
              {campo("repTelefono", "Teléfono (opcional)")}
              {campo("repParentesco", "Parentesco", { placeholder: "Madre, Padre…" })}
            </div>
          </FieldSet>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => cerrar(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar}>{editando ? "Guardar cambios" : "Registrar integrante"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
