import { useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Handshake, MapPin, Plus, Search } from "lucide-react"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { EstadoBadge } from "@/components/estado-badge"
import { FotoMiniatura } from "@/components/foto-instrumento"
import { InstrumentoAcciones } from "@/components/instrumento-acciones"
import { PageHeader } from "@/components/page-header"
import { Paginacion, usePaginado } from "@/components/paginacion"
import { SelectField } from "@/components/select-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDate, nombreCompleto, nombreSede, sedeConDireccion } from "@/lib/format"
import { useStore } from "@/lib/store"
import { FAMILIAS, type EstadoInstrumento } from "@/lib/types"

type Filtro = "todos" | EstadoInstrumento

export function InstrumentosPage() {
  const store = useStore()
  const dialogs = useDialogs()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()

  const estado = (params.get("estado") as Filtro) || "todos"
  const q = params.get("q") ?? ""
  const familia = params.get("familia") ?? ""
  const sedeId = params.get("sede") ?? ""
  const pagina = Number(params.get("page")) || 1

  const setParam = (k: string, v: string) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        if (v && v !== "todos") n.set(k, v)
        else n.delete(k)
        if (k !== "page") n.delete("page")
        return n
      },
      { replace: true }
    )

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return store.db.instrumentos.filter((i) => {
      if (estado !== "todos" && i.estado !== estado) return false
      if (familia && i.familia !== familia) return false
      if (sedeId && store.sedeActual(i)?.id !== sedeId) return false
      if (!t) return true
      const c = store.comodatoDeInstrumento(i.id)
      const e = c && store.integrante(c.integranteId)
      return [i.codigo, i.nombre, i.marca, i.modelo, i.serial, e ? nombreCompleto(e) : ""].some((x) =>
        x.toLowerCase().includes(t)
      )
    })
  }, [store, q, estado, familia, sedeId])

  const { visibles, totalPaginas, actual } = usePaginado(filtrados, pagina)
  const cuenta = (e: Filtro) =>
    e === "todos" ? store.db.instrumentos.length : store.db.instrumentos.filter((i) => i.estado === e).length

  return (
    <>
      <PageHeader
        title="Instrumentos"
        description="Inventario completo con control de disponibilidad, familia y sede."
        actions={
          <Button onClick={dialogs.nuevoInstrumento}>
            <Plus data-icon="inline-start" />
            Registrar instrumento
          </Button>
        }
      />

      <Tabs value={estado} onValueChange={(v) => setParam("estado", v as string)}>
        <TabsList className="flex-wrap">
          {(
            [
              ["todos", "Todos"],
              ["disponible", "Disponibles"],
              ["comodato", "En comodato"],
              ["reparacion", "En reparación"],
            ] as [Filtro, string][]
          ).map(([v, l]) => (
            <TabsTrigger key={v} value={v}>
              {l}
              <span className="text-muted-foreground ml-1 tabular-nums">{cuenta(v)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="py-0">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-2 md:flex-row">
            <InputGroup className="md:max-w-sm">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Código, nombre, marca, serial o integrante"
                value={q}
                onChange={(e) => setParam("q", e.target.value)}
              />
            </InputGroup>
            <SelectField
              className="md:w-52"
              value={familia || "todas"}
              onChange={(v) => setParam("familia", v === "todas" ? "" : v)}
              options={[{ value: "todas", label: "Todas las familias" }, ...FAMILIAS.map((f) => ({ value: f, label: f }))]}
            />
            <SelectField
              className="md:w-64"
              value={sedeId || "todas"}
              onChange={(v) => setParam("sede", v === "todas" ? "" : v)}
              options={[
                { value: "todas", label: "Todas las sedes" },
                ...store.db.sedes.map((s) => ({ value: s.id, label: sedeConDireccion(s) })),
              ]}
            />
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-14" />
                  <TableHead>Código</TableHead>
                  <TableHead>Instrumento</TableHead>
                  <TableHead className="hidden lg:table-cell">Familia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Sede / Asignado a</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                      No hay instrumentos que coincidan con los filtros.
                    </TableCell>
                  </TableRow>
                )}
                {visibles.map((i) => {
                  const c = store.comodatoDeInstrumento(i.id)
                  const e = c && store.integrante(c.integranteId)
                  return (
                    <TableRow key={i.id} className="cursor-pointer" onClick={() => navigate(`/consulta?codigo=${i.codigo}`)}>
                      <TableCell>
                        <FotoMiniatura foto={i.foto} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{i.codigo}</TableCell>
                      <TableCell>
                        <div className="font-medium">{i.nombre}</div>
                        <div className="text-muted-foreground text-xs">
                          {i.marca} {i.modelo}
                          {i.medida && ` · ${i.medida}`}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{i.familia}</TableCell>
                      <TableCell>
                        <EstadoBadge estado={i.estado} />
                      </TableCell>
                      <TableCell className="hidden max-w-72 md:table-cell">
                        {e && c ? (
                          <>
                            <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                              <Handshake className="size-3.5 shrink-0" />
                              <span className="truncate">{nombreCompleto(e)}</span>
                            </span>
                            <span className="text-muted-foreground text-xs">
                              {nombreSede(store.sede(c.sedeId))} · desde {formatDate(c.fechaInicio)}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{nombreSede(store.sede(i.sedeId))}</span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell onClick={(ev) => ev.stopPropagation()}>
                        <InstrumentoAcciones instrumento={i} />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <Paginacion actual={actual} totalPaginas={totalPaginas} total={filtrados.length} onChange={(p) => setParam("page", String(p))} />
        </CardContent>
      </Card>
    </>
  )
}
