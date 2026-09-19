import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Handshake, Plus, Search } from "lucide-react"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { PageHeader } from "@/components/page-header"
import { Paginacion, usePaginado } from "@/components/paginacion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { edad, iniciales, nombreCompleto } from "@/lib/format"
import { useStore } from "@/lib/store"
import { toast } from "sonner"

export function EstudiantesPage() {
  const store = useStore()
  const dialogs = useDialogs()
  const [q, setQ] = useState("")
  const [pagina, setPagina] = useState(1)
  const [nuevo, setNuevo] = useState(false)

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return store.db.estudiantes.filter(
      (e) => !t || [nombreCompleto(e), e.cedula, e.catedra, e.nucleo].some((x) => x.toLowerCase().includes(t))
    )
  }, [store.db.estudiantes, q])
  const { visibles, totalPaginas, actual } = usePaginado(filtrados, pagina)

  return (
    <>
      <PageHeader
        title="Estudiantes"
        description="Estudiantes de la orquesta que pueden recibir instrumentos en comodato."
        actions={
          <Button onClick={() => setNuevo(true)}>
            <Plus data-icon="inline-start" />
            Registrar estudiante
          </Button>
        }
      />
      <Card className="py-0">
        <CardContent className="space-y-4 p-4">
          <InputGroup className="max-w-sm">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Nombre, cédula, cátedra o núcleo"
              value={q}
              onChange={(e) => {
                setQ(e.target.value)
                setPagina(1)
              }}
            />
          </InputGroup>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead className="hidden md:table-cell">Cátedra</TableHead>
                  <TableHead className="hidden lg:table-cell">Núcleo</TableHead>
                  <TableHead>Instrumento en comodato</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((e) => {
                  const cs = store.comodatosDeEstudiante(e.id)
                  const menor = edad(e.fechaNacimiento) < 18
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{iniciales(e)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{nombreCompleto(e)}</div>
                            <div className="text-muted-foreground text-xs">
                              {e.cedula} · {edad(e.fechaNacimiento)} años
                              {menor && (e.representante ? " · con representante" : " · ⚠ sin representante")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{e.catedra}</TableCell>
                      <TableCell className="hidden lg:table-cell">{e.nucleo}</TableCell>
                      <TableCell>
                        {cs.length ? (
                          <div className="flex flex-wrap gap-1">
                            {cs.map((c) => {
                              const i = store.instrumento(c.instrumentoId)
                              return i ? (
                                <Badge key={c.id} variant="outline" render={<Link to={`/consulta?codigo=${i.codigo}`} />} className="font-mono">
                                  {i.codigo}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => dialogs.nuevoComodato({ estudianteId: e.id })}>
                          <Handshake data-icon="inline-start" />
                          <span className="hidden sm:inline">Asignar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <Paginacion actual={actual} totalPaginas={totalPaginas} total={filtrados.length} onChange={setPagina} />
        </CardContent>
      </Card>
      <NuevoEstudianteDialog open={nuevo} onOpenChange={setNuevo} />
    </>
  )
}

const vacio = {
  cedula: "",
  nombres: "",
  apellidos: "",
  fechaNacimiento: "",
  telefono: "",
  email: "",
  nucleo: "",
  catedra: "",
  direccion: "",
  repNombre: "",
  repCedula: "",
  repTelefono: "",
  repParentesco: "",
}

function NuevoEstudianteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const store = useStore()
  const [f, setF] = useState(vacio)
  const [intentado, setIntentado] = useState(false)
  const set = (k: keyof typeof vacio) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  const menor = f.fechaNacimiento ? edad(f.fechaNacimiento) < 18 : false

  const errores: Record<string, string> = {}
  for (const k of ["cedula", "nombres", "apellidos", "fechaNacimiento", "telefono", "catedra", "nucleo"] as const)
    if (!f[k].trim()) errores[k] = "Requerido."
  if (f.cedula && store.db.estudiantes.some((e) => e.cedula === f.cedula.trim())) errores.cedula = "Ya existe un estudiante con esta cédula."
  if (menor && (!f.repNombre.trim() || !f.repCedula.trim())) errores.rep = "Para menores de edad el representante es obligatorio."
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
    const e = store.crearEstudiante({
      cedula: f.cedula.trim(),
      nombres: f.nombres.trim(),
      apellidos: f.apellidos.trim(),
      fechaNacimiento: f.fechaNacimiento,
      telefono: f.telefono.trim(),
      email: f.email.trim(),
      nucleo: f.nucleo.trim(),
      catedra: f.catedra.trim(),
      direccion: f.direccion.trim(),
      representante: f.repNombre.trim()
        ? { nombre: f.repNombre.trim(), cedula: f.repCedula.trim(), telefono: f.repTelefono.trim(), parentesco: f.repParentesco.trim() || "Representante" }
        : undefined,
    })
    toast.success(`${nombreCompleto(e)} registrado(a)`)
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
          <DialogTitle>Registrar estudiante</DialogTitle>
          <DialogDescription>Datos necesarios para el contrato de comodato.</DialogDescription>
        </DialogHeader>
        <FieldGroup className="max-h-[65vh] gap-4 overflow-y-auto px-0.5 py-1">
          <div className="grid gap-4 sm:grid-cols-2">
            {campo("cedula", "Cédula", { placeholder: "V-30.000.000" })}
            {campo("fechaNacimiento", "Fecha de nacimiento", { type: "date" })}
            {campo("nombres", "Nombres")}
            {campo("apellidos", "Apellidos")}
            {campo("telefono", "Teléfono", { placeholder: "0414-000-0000" })}
            {campo("email", "Correo", { type: "email" })}
            {campo("catedra", "Cátedra", { placeholder: "Violín" })}
            {campo("nucleo", "Núcleo", { placeholder: "Núcleo Hesperia" })}
          </div>
          {campo("direccion", "Dirección de habitación")}
          <FieldSet>
            <FieldLegend variant="label">
              Representante legal {menor ? "(obligatorio: es menor de edad)" : "(solo si es menor de edad)"}
            </FieldLegend>
            <div className="grid gap-4 sm:grid-cols-2">
              {campo("repNombre", "Nombre completo")}
              {campo("repCedula", "Cédula")}
              {campo("repTelefono", "Teléfono")}
              {campo("repParentesco", "Parentesco", { placeholder: "Madre, Padre…" })}
            </div>
            {err("rep") && <FieldError>{err("rep")}</FieldError>}
          </FieldSet>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => cerrar(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar}>Registrar estudiante</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
