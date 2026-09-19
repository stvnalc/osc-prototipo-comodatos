import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { FileDown, Info, Plus, Search, Trash2 } from "lucide-react"
import { VencimientoBadge } from "@/components/estado-badge"
import { useAccionesInstrumento } from "@/components/instrumento-acciones"
import { PageHeader } from "@/components/page-header"
import { Paginacion, usePaginado } from "@/components/paginacion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { formatDate, nombreCompleto, vencimiento } from "@/lib/format"

type Filtro = "todos" | "por-vencer" | "vencido"

export function ComodatosPage() {
  const { store, dialogs, descargar } = useAccionesInstrumento()
  const [filtro, setFiltro] = useState<Filtro>("todos")
  const [q, setQ] = useState("")
  const [pagina, setPagina] = useState(1)

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase()
    return store.db.comodatos
      .map((c) => ({ c, i: store.instrumento(c.instrumentoId)!, e: store.estudiante(c.estudianteId)!, v: vencimiento(c) }))
      .filter(({ i, e }) => i && e)
      .filter(({ v }) => filtro === "todos" || v.tipo === filtro)
      .filter(({ c, i, e }) => !t || [c.numero, i.codigo, i.nombre, nombreCompleto(e), e.cedula].some((x) => x.toLowerCase().includes(t)))
      .sort((a, b) => a.c.fechaFin.localeCompare(b.c.fechaFin))
  }, [store, filtro, q])

  const { visibles, totalPaginas, actual } = usePaginado(filas, pagina)
  const n = (t: Filtro) => store.db.comodatos.filter((c) => t === "todos" || vencimiento(c).tipo === t).length

  return (
    <>
      <PageHeader
        title="Comodatos"
        description="Instrumentos prestados a estudiantes, ordenados por fecha de devolución."
        actions={
          <Button onClick={() => dialogs.nuevoComodato()}>
            <Plus data-icon="inline-start" />
            Nuevo comodato
          </Button>
        }
      />

      <Alert>
        <Info />
        <AlertTitle>Solo se muestran comodatos activos</AlertTitle>
        <AlertDescription>
          Según la propuesta, al finalizar un comodato su registro se elimina y el instrumento vuelve a “Disponible”. Por
          eso aquí no existe un historial de préstamos anteriores.
        </AlertDescription>
      </Alert>

      <Tabs
        value={filtro}
        onValueChange={(v) => {
          setFiltro(v as Filtro)
          setPagina(1)
        }}
      >
        <TabsList>
          <TabsTrigger value="todos">
            Activos <span className="text-muted-foreground ml-1 tabular-nums">{n("todos")}</span>
          </TabsTrigger>
          <TabsTrigger value="por-vencer">
            Por vencer <span className="text-muted-foreground ml-1 tabular-nums">{n("por-vencer")}</span>
          </TabsTrigger>
          <TabsTrigger value="vencido">
            Vencidos <span className="ml-1 text-red-600 tabular-nums dark:text-red-400">{n("vencido")}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="py-0">
        <CardContent className="space-y-4 p-4">
          <InputGroup className="max-w-sm">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="N° de comodato, código, estudiante o cédula"
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
                  <TableHead>N°</TableHead>
                  <TableHead>Instrumento</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead className="hidden lg:table-cell">Entrega</TableHead>
                  <TableHead className="hidden md:table-cell">Devolución</TableHead>
                  <TableHead>Plazo</TableHead>
                  <TableHead className="w-24 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground h-24 text-center">
                      No hay comodatos en esta vista.
                    </TableCell>
                  </TableRow>
                )}
                {visibles.map(({ c, i, e, v }) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.numero}</TableCell>
                    <TableCell>
                      <Link to={`/consulta?codigo=${i.codigo}`} className="font-medium hover:underline">
                        {i.codigo}
                      </Link>
                      <div className="text-muted-foreground text-xs">{i.nombre}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{nombreCompleto(e)}</div>
                      <div className="text-muted-foreground text-xs">{e.cedula}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(c.fechaInicio)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(c.fechaFin)}</TableCell>
                    <TableCell>
                      <VencimientoBadge v={v} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={() => descargar(i.id)} aria-label="Descargar contrato" />}>
                            <FileDown />
                          </TooltipTrigger>
                          <TooltipContent>Descargar contrato PDF</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => dialogs.finalizarComodato(c.id)}
                                aria-label="Finalizar comodato"
                              />
                            }
                          >
                            <Trash2 />
                          </TooltipTrigger>
                          <TooltipContent>Finalizar (eliminar) comodato</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Paginacion actual={actual} totalPaginas={totalPaginas} total={filas.length} onChange={setPagina} />
        </CardContent>
      </Card>
    </>
  )
}
