import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Archive, FileDown, Pencil, Plus, Search } from "lucide-react"
import { VencimientoBadge } from "@/components/estado-badge"
import { useAccionesInstrumento } from "@/components/instrumento-acciones"
import { PageHeader } from "@/components/page-header"
import { Paginacion, usePaginado } from "@/components/paginacion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cedulaODash, formatDate, nombreCompleto, nombreSede, vencimiento } from "@/lib/format"

type Filtro = "activos" | "historial"

export function ComodatosPage() {
  const { store, dialogs, descargar } = useAccionesInstrumento()
  const [filtro, setFiltro] = useState<Filtro>("activos")
  const [q, setQ] = useState("")
  const [pagina, setPagina] = useState(1)
  const historial = filtro === "historial"

  const filas = useMemo(() => {
    const t = q.trim().toLowerCase()
    const base = historial ? store.comodatosArchivados : store.comodatosActivos
    return base
      .map((c) => ({ c, i: store.instrumento(c.instrumentoId)!, e: store.integrante(c.integranteId)! }))
      .filter(({ i, e }) => i && e)
      .filter(
        ({ c, i, e }) =>
          !t ||
          [c.codigo, i.codigo, i.nombre, nombreCompleto(e), e.cedula ?? "", c.motivoArchivo ?? ""].some((x) =>
            x.toLowerCase().includes(t)
          )
      )
      .sort((a, b) =>
        historial
          ? (b.c.archivadoEn ?? "").localeCompare(a.c.archivadoEn ?? "")
          : a.c.fechaFin.localeCompare(b.c.fechaFin)
      )
  }, [store, historial, q])

  const { visibles, totalPaginas, actual } = usePaginado(filas, pagina)

  return (
    <>
      <PageHeader
        title="Comodatos"
        description="Instrumentos prestados a integrantes. Al recibir el instrumento el comodato se archiva con su nota y queda en el historial."
        actions={
          <Button onClick={() => dialogs.nuevoComodato()}>
            <Plus data-icon="inline-start" />
            Nuevo comodato
          </Button>
        }
      />

      <Tabs
        value={filtro}
        onValueChange={(v) => {
          setFiltro(v as Filtro)
          setPagina(1)
        }}
      >
        <TabsList>
          <TabsTrigger value="activos">
            Activos <span className="text-muted-foreground ml-1 tabular-nums">{store.comodatosActivos.length}</span>
          </TabsTrigger>
          <TabsTrigger value="historial">
            Historial <span className="text-muted-foreground ml-1 tabular-nums">{store.comodatosArchivados.length}</span>
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
              placeholder={historial ? "Código, instrumento, integrante o motivo" : "Código, instrumento, integrante o cédula"}
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
                  <TableHead>Código</TableHead>
                  <TableHead>Instrumento</TableHead>
                  <TableHead>Integrante</TableHead>
                  <TableHead className="hidden lg:table-cell">Sede</TableHead>
                  <TableHead className="hidden lg:table-cell">Asignado</TableHead>
                  {historial ? (
                    <>
                      <TableHead className="hidden md:table-cell">Archivado</TableHead>
                      <TableHead>Motivo</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="hidden md:table-cell">Devolución</TableHead>
                      <TableHead>Plazo</TableHead>
                      <TableHead className="w-28 text-right">Acciones</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground h-24 text-center">
                      {historial ? "Todavía no hay comodatos archivados." : "No hay comodatos activos en esta vista."}
                    </TableCell>
                  </TableRow>
                )}
                {visibles.map(({ c, i, e }) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.codigo}</TableCell>
                    <TableCell>
                      <Link to={`/consulta?codigo=${i.codigo}`} className="font-medium hover:underline">
                        {i.codigo}
                      </Link>
                      <div className="text-muted-foreground text-xs">{i.nombre}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{nombreCompleto(e)}</div>
                      <div className="text-muted-foreground text-xs">{cedulaODash(e)}</div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{nombreSede(store.sede(c.sedeId))}</TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(c.fechaInicio)}</TableCell>
                    {historial ? (
                      <>
                        <TableCell className="hidden md:table-cell">
                          {c.archivadoEn ? formatDate(c.archivadoEn) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-80 text-sm">{c.motivoArchivo}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="hidden md:table-cell">{formatDate(c.fechaFin)}</TableCell>
                        <TableCell>
                          <VencimientoBadge v={vencimiento(c)} />
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger render={<Button variant="ghost" size="icon-sm" onClick={() => dialogs.editarComodato(c.id)} aria-label="Editar comodato" />}>
                                <Pencil />
                              </TooltipTrigger>
                              <TooltipContent>Editar comodato</TooltipContent>
                            </Tooltip>
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
                                    onClick={() => dialogs.archivarComodato(c.id)}
                                    aria-label="Recibir y archivar"
                                  />
                                }
                              >
                                <Archive />
                              </TooltipTrigger>
                              <TooltipContent>Recibir instrumento y archivar</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </>
                    )}
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
