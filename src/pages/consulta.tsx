import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import {
  Archive,
  CalendarDays,
  CircleCheck,
  FileDown,
  Handshake,
  Mail,
  Pencil,
  Phone,
  ScanSearch,
  Search,
  UserRound,
  Wrench,
} from "lucide-react"
import { EstadoBadge, VencimientoBadge } from "@/components/estado-badge"
import { VerFotoButton } from "@/components/foto-instrumento"
import { useAccionesInstrumento } from "@/components/instrumento-acciones"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  cedulaODash,
  diffDays,
  edad,
  formatDate,
  iniciales,
  nombreCompleto,
  nombreSede,
  sedeConDireccion,
  todayIso,
  vencimiento,
} from "@/lib/format"
import type { Instrumento } from "@/lib/types"
import { cn } from "@/lib/utils"

export function ConsultaPage() {
  const [params, setParams] = useSearchParams()
  const codigo = params.get("codigo") ?? ""
  const [query, setQuery] = useState(codigo)
  const [abierto, setAbierto] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { store } = useAccionesInstrumento()

  useEffect(() => {
    setQuery(codigo)
  }, [codigo])
  useEffect(() => {
    if (!codigo) inputRef.current?.focus()
  }, [codigo])

  const resultado = codigo ? store.buscarPorCodigo(codigo) : undefined

  const sugerencias = useMemo(() => {
    const q = query.trim().toUpperCase()
    if (!q || q === codigo) return []
    return store.db.instrumentos
      .filter((i) => i.codigo.toUpperCase().includes(q) || i.nombre.toUpperCase().includes(q) || i.serial.includes(q))
      .slice(0, 6)
  }, [query, codigo, store.db.instrumentos])

  const buscar = (valor: string) => {
    const v = valor.trim()
    setAbierto(false)
    setParams(v ? { codigo: v } : {})
  }

  return (
    <>
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Consulta de instrumentos</h1>
        <p className="text-muted-foreground text-sm">
          Ingresa el código del instrumento para ver su ficha técnica, estado, sede y el integrante asignado.
        </p>
      </div>

      <div className="relative max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            buscar(query)
          }}
        >
          <InputGroup className="h-12 text-base">
            <InputGroupAddon>
              <ScanSearch className="size-5" />
            </InputGroupAddon>
            <InputGroupInput
              ref={inputRef}
              className="font-mono text-base placeholder:font-sans"
              placeholder="Código de inventario, ej. Pi001-FOSC o Pi001"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setAbierto(true)
              }}
              onFocus={() => setAbierto(true)}
              onBlur={() => setTimeout(() => setAbierto(false), 150)}
              aria-label="Código del instrumento"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" variant="default" size="sm">
                <Search data-icon="inline-start" />
                Buscar
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
        {abierto && sugerencias.length > 0 && (
          <div className="bg-popover text-popover-foreground ring-foreground/10 absolute top-full z-30 mt-1 w-full overflow-hidden rounded-lg p-1 shadow-md ring-1">
            {sugerencias.map((i) => (
              <button
                key={i.id}
                type="button"
                className="hover:bg-muted flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => buscar(i.codigo)}
              >
                <span className="font-mono text-xs">{i.codigo}</span>
                <span className="text-muted-foreground truncate">
                  {i.nombre} {i.marca}
                </span>
                <EstadoBadge estado={i.estado} className="ml-auto" />
              </button>
            ))}
          </div>
        )}
      </div>

      {!codigo && <SinBusqueda onPick={buscar} />}
      {codigo && !resultado && <NoEncontrado codigo={codigo} onPick={buscar} />}
      {resultado && <VistaIntegrada instrumento={resultado} />}
    </>
  )
}

function SinBusqueda({ onPick }: { onPick: (c: string) => void }) {
  const { store } = useAccionesInstrumento()
  const ejemplos = ["comodato", "disponible", "reparacion"]
    .map((e) => store.db.instrumentos.find((i) => i.estado === e))
    .filter(Boolean) as Instrumento[]
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ScanSearch />
        </EmptyMedia>
        <EmptyTitle>Busca un instrumento por su código</EmptyTitle>
        <EmptyDescription>
          El código está en la etiqueta del instrumento. En el sistema real se podría escanear un código QR o de barras.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap justify-center gap-2">
          {ejemplos.map((i) => (
            <Button key={i.id} variant="outline" size="sm" onClick={() => onPick(i.codigo)}>
              <span className="font-mono">{i.codigo}</span>
              <EstadoBadge estado={i.estado} />
            </Button>
          ))}
        </div>
      </EmptyContent>
    </Empty>
  )
}

function NoEncontrado({ codigo, onPick }: { codigo: string; onPick: (c: string) => void }) {
  const { store } = useAccionesInstrumento()
  const letras = codigo.replace(/[^A-Za-z]/g, "").slice(0, 2).toLowerCase()
  const parecidos = store.db.instrumentos.filter((i) => i.codigo.toLowerCase().startsWith(letras)).slice(0, 4)
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Search />
        </EmptyMedia>
        <EmptyTitle>No existe ningún instrumento con el código “{codigo}”</EmptyTitle>
        <EmptyDescription>Verifica la etiqueta o busca en el listado de instrumentos.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {parecidos.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            {parecidos.map((i) => (
              <Button key={i.id} variant="outline" size="sm" className="font-mono" onClick={() => onPick(i.codigo)}>
                {i.codigo}
              </Button>
            ))}
          </div>
        )}
        <Button variant="link" render={<Link to="/instrumentos" />} nativeButton={false}>
          Ir al listado de instrumentos
        </Button>
      </EmptyContent>
    </Empty>
  )
}

function Dato({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  )
}

function VistaIntegrada({ instrumento: i }: { instrumento: Instrumento }) {
  const { store, dialogs, descargar, marcarReparado } = useAccionesInstrumento()
  const comodato = store.comodatoDeInstrumento(i.id)
  const integrante = comodato && store.integrante(comodato.integranteId)
  const sedeResguardo = store.sede(i.sedeId)
  const sedeComodato = comodato && store.sede(comodato.sedeId)

  return (
    <div className="space-y-4">
      {/* Encabezado del activo */}
      <Card>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-mono text-sm">{i.codigo}</span>
              <EstadoBadge estado={i.estado} />
              <Badge variant="secondary">{i.familia}</Badge>
            </div>
            <h2 className="font-heading text-xl font-semibold">
              {i.nombre} {i.marca} {i.modelo}
            </h2>
            <p className="text-muted-foreground text-sm">
              {i.medida ? `Medida ${i.medida} · ` : ""}Adquirido en {i.anioAdquisicion}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <VerFotoButton foto={i.foto} codigo={i.codigo} nombre={`${i.nombre} ${i.marca} ${i.modelo}`} />
            <Button variant="outline" onClick={() => dialogs.editarInstrumento(i.id)}>
              <Pencil data-icon="inline-start" />
              Editar
            </Button>
            {i.estado === "disponible" && (
              <>
                <Button onClick={() => dialogs.nuevoComodato({ instrumentoId: i.id })}>
                  <Handshake data-icon="inline-start" />
                  Asignar en comodato
                </Button>
                <Button variant="outline" onClick={() => dialogs.enviarAReparacion(i.id)}>
                  <Wrench data-icon="inline-start" />
                  Reparación
                </Button>
              </>
            )}
            {i.estado === "reparacion" && (
              <Button onClick={() => marcarReparado(i)}>
                <CircleCheck data-icon="inline-start" />
                Marcar como reparado
              </Button>
            )}
            {comodato && (
              <>
                <Button onClick={() => descargar(i.id)}>
                  <FileDown data-icon="inline-start" />
                  Contrato PDF
                </Button>
                <Button variant="outline" onClick={() => dialogs.archivarComodato(comodato.id)}>
                  <Archive data-icon="inline-start" />
                  Recibir y archivar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Integrante / disponibilidad */}
        {comodato && integrante ? (
          <Card className="ring-sky-200 dark:ring-sky-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-4" /> Integrante asignado
              </CardTitle>
              <CardDescription>
                Comodato {comodato.codigo} · asignado el {formatDate(comodato.fechaInicio)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                    {iniciales(integrante)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold">{nombreCompleto(integrante)}</p>
                  <p className="text-muted-foreground text-sm">
                    C.I. {cedulaODash(integrante)} · {edad(integrante.fechaNacimiento)} años
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto"
                  onClick={() => dialogs.editarIntegrante(integrante.id)}
                  aria-label="Editar integrante"
                >
                  <Pencil />
                </Button>
              </div>
              <dl className="grid grid-cols-2 gap-4">
                <Dato label="Cátedra">{integrante.catedra}</Dato>
                <Dato label="Sede del integrante">{nombreSede(store.sede(integrante.sedeId))}</Dato>
                <Dato label="Teléfono">
                  <a href={`tel:${integrante.telefono}`} className="inline-flex items-center gap-1 hover:underline">
                    <Phone className="size-3" />
                    {integrante.telefono}
                  </a>
                </Dato>
                <Dato label="Correo">
                  <a href={`mailto:${integrante.email}`} className="inline-flex items-center gap-1 break-all hover:underline">
                    <Mail className="size-3 shrink-0" />
                    {integrante.email}
                  </a>
                </Dato>
                <Dato label="Dirección fiscal" className="col-span-2">
                  {integrante.direccionFiscal}
                </Dato>
                {integrante.rif && <Dato label="RIF">{integrante.rif}</Dato>}
                {integrante.representante && (
                  <Dato label="Representante" className="col-span-2">
                    {[
                      `${integrante.representante.nombre} (${integrante.representante.parentesco})`,
                      integrante.representante.cedula && `C.I. ${integrante.representante.cedula}`,
                      integrante.representante.rif && `RIF ${integrante.representante.rif}`,
                      integrante.representante.telefono,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Dato>
                )}
              </dl>
              <Separator />
              <PeriodoComodato inicio={comodato.fechaInicio} fin={comodato.fechaFin} />
              {comodato.observaciones && (
                <p className="text-muted-foreground text-sm">
                  <span className="text-foreground font-medium">Observaciones: </span>
                  {comodato.observaciones}
                </p>
              )}
              <div className="flex items-center gap-2">
                <VencimientoBadge v={vencimiento(comodato)} />
                <Button variant="ghost" size="sm" onClick={() => dialogs.editarComodato(comodato.id)}>
                  <Pencil data-icon="inline-start" />
                  Editar comodato
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-4" /> Integrante asignado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Empty className="bg-muted/40 p-6">
                <EmptyHeader>
                  <EmptyTitle>Sin integrante asignado</EmptyTitle>
                  <EmptyDescription>
                    {i.estado === "reparacion"
                      ? "El instrumento está en reparación y no puede asignarse hasta que se marque como reparado."
                      : "El instrumento está disponible para ser entregado en comodato."}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {/* Ficha técnica */}
          <Card>
            <CardHeader>
              <CardTitle>Ficha técnica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Dato label="Familia">{i.familia}</Dato>
                <Dato label="Marca">{i.marca}</Dato>
                <Dato label="Modelo">{i.modelo}</Dato>
                <Dato label="Serial">
                  <span className="font-mono">{i.serial}</span>
                </Dato>
                {i.medida && <Dato label="Medida">{i.medida}</Dato>}
                {i.material && <Dato label="Material">{i.material}</Dato>}
                <Dato label="Condición">{i.condicion}</Dato>
                <Dato label="Año de adquisición">{i.anioAdquisicion}</Dato>
                <Dato label={comodato ? "Sede durante el comodato" : "Sede de resguardo"} className="col-span-2 sm:col-span-3">
                  {comodato ? sedeConDireccion(sedeComodato) : sedeConDireccion(sedeResguardo)}
                  {!comodato && sedeResguardo?.detalle && (
                    <span className="text-muted-foreground font-normal"> · {sedeResguardo.detalle}</span>
                  )}
                </Dato>
              </dl>
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs">Accesorios incluidos</p>
                <div className="flex flex-wrap gap-1.5">
                  {i.accesorios.length ? (
                    i.accesorios.map((a) => (
                      <Badge key={a} variant="secondary">
                        {a}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm">Ninguno</span>
                  )}
                </div>
              </div>
              {i.observaciones && (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                  {i.observaciones}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PeriodoComodato({ inicio, fin }: { inicio: string; fin: string }) {
  const total = Math.max(1, diffDays(inicio, fin))
  const transcurrido = Math.min(total, Math.max(0, diffDays(inicio, todayIso())))
  const pct = Math.round((transcurrido / total) * 100)
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="text-muted-foreground size-4" />
          {formatDate(inicio)}
        </span>
        <span>{formatDate(fin)}</span>
      </div>
      <Progress value={pct} />
      <p className="text-muted-foreground text-xs">{pct}% del período transcurrido</p>
    </div>
  )
}
