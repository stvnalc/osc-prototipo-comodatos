import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Handshake, MapPin, Plus, Search } from "lucide-react"
import { NuevoInstrumentoDialog } from "@/components/dialogs/nuevo-instrumento-dialog"
import { EstadoBadge } from "@/components/estado-badge"
import { InstrumentoAcciones } from "@/components/instrumento-acciones"
import { PageHeader } from "@/components/page-header"
import { Paginacion, usePaginado } from "@/components/paginacion"
import { SelectField } from "@/components/select-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { nombreCompleto, rutaUbicacion } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { EstadoInstrumento, Familia } from "@/lib/types"

type Filtro = "todos" | EstadoInstrumento
const FAMILIAS: Familia[] = ["Cuerdas", "Maderas", "Metales", "Percusión"]

export function InstrumentosPage() {
  const store = useStore()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [nuevoOpen, setNuevoOpen] = useState(false)

  const estado = (params.get("estado") as Filtro) || "todos"
  const q = params.get("q") ?? ""
  const familia = params.get("familia") ?? ""
  const ubicacionId = params.get("ubicacion") ?? ""
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
      if (ubicacionId && i.ubicacionId !== ubicacionId) return false
      if (!t) return true
      const c = store.comodatoDeInstrumento(i.id)
      const e = c && store.estudiante(c.estudianteId)
      return [i.codigo, i.nombre, i.marca, i.modelo, i.serial, e ? nombreCompleto(e) : ""].some((x) => x.toLowerCase().includes(t))
    })
  }, [store, q, estado, familia, ubicacionId])

  const { visibles, totalPaginas, actual } = usePaginado(filtrados, pagina)
  const cuenta = (e: Filtro) => (e === "todos" ? store.db.instrumentos.length : store.db.instrumentos.filter((i) => i.estado === e).length)

  return (
    <>
      <PageHeader
        title="Instrumentos"
        description="Inventario completo con control de disponibilidad y ubicación."
        actions={
          <Button onClick={() => setNuevoOpen(true)}>
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
                placeholder="Código, nombre, marca, serial o estudiante"
                value={q}
                onChange={(e) => setParam("q", e.target.value)}
              />
            </InputGroup>
            <SelectField
              className="md:w-44"
              value={familia || "todas"}
              onChange={(v) => setParam("familia", v === "todas" ? "" : v)}
              options={[{ value: "todas", label: "Todas las familias" }, ...FAMILIAS.map((f) => ({ value: f, label: f }))]}
            />
            <SelectField
              className="md:w-72"
              value={ubicacionId || "todas"}
              onChange={(v) => setParam("ubicacion", v === "todas" ? "" : v)}
              options={[
                { value: "todas", label: "Todas las ubicaciones" },
                ...store.db.ubicaciones.map((u) => ({ value: u.id, label: rutaUbicacion(u) })),
              ]}
            />
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Instrumento</TableHead>
                  <TableHead className="hidden lg:table-cell">Familia</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="hidden md:table-cell">Ubicación actual</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                      No hay instrumentos que coincidan con los filtros.
                    </TableCell>
                  </TableRow>
                )}
                {visibles.map((i) => {
                  const c = store.comodatoDeInstrumento(i.id)
                  const e = c && store.estudiante(c.estudianteId)
                  return (
                    <TableRow key={i.id} className="cursor-pointer" onClick={() => navigate(`/consulta?codigo=${i.codigo}`)}>
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
                        {e ? (
                          <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                            <Handshake className="size-3.5 shrink-0" />
                            <span className="truncate">{nombreCompleto(e)}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{rutaUbicacion(store.ubicacion(i.ubicacionId))}</span>
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

      <NuevoInstrumentoDialog open={nuevoOpen} onOpenChange={setNuevoOpen} />
    </>
  )
}
