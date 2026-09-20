import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Handshake, Pencil, Plus, Search } from "lucide-react"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { PageHeader } from "@/components/page-header"
import { Paginacion, usePaginado } from "@/components/paginacion"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { edad, formatDate, iniciales, nombreCompleto, nombreSede } from "@/lib/format"
import { useStore } from "@/lib/store"

export function IntegrantesPage() {
  const store = useStore()
  const dialogs = useDialogs()
  const [q, setQ] = useState("")
  const [pagina, setPagina] = useState(1)

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase()
    return store.db.integrantes.filter(
      (e) =>
        !t ||
        [nombreCompleto(e), e.cedula, e.catedra, nombreSede(store.sede(e.sedeId)), e.direccionFiscal].some((x) =>
          x.toLowerCase().includes(t)
        )
    )
  }, [store, q])
  const { visibles, totalPaginas, actual } = usePaginado(filtrados, pagina)

  return (
    <>
      <PageHeader
        title="Integrantes"
        description="Integrantes de la orquesta que pueden recibir instrumentos en comodato."
        actions={
          <Button onClick={dialogs.nuevoIntegrante}>
            <Plus data-icon="inline-start" />
            Registrar integrante
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
              placeholder="Nombre, cédula, cátedra o sede"
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
                  <TableHead>Integrante</TableHead>
                  <TableHead className="hidden md:table-cell">Cátedra</TableHead>
                  <TableHead className="hidden lg:table-cell">Sede</TableHead>
                  <TableHead>Instrumento en comodato</TableHead>
                  <TableHead className="w-28 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibles.map((e) => {
                  const cs = store.comodatosDeIntegrante(e.id)
                  const menor = edad(e.fechaNacimiento) < 18
                  return (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{iniciales(e)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium">{nombreCompleto(e)}</div>
                            <div className="text-muted-foreground text-xs">
                              {e.cedula} · {edad(e.fechaNacimiento)} años
                              {menor && (e.representante ? " · con representante" : " · ⚠ sin representante")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{e.catedra}</TableCell>
                      <TableCell className="hidden lg:table-cell">{nombreSede(store.sede(e.sedeId))}</TableCell>
                      <TableCell>
                        {cs.length ? (
                          <div className="flex flex-wrap gap-1">
                            {cs.map((c) => {
                              const i = store.instrumento(c.instrumentoId)
                              return i ? (
                                <Tooltip key={c.id}>
                                  <TooltipTrigger
                                    render={
                                      <Badge variant="outline" render={<Link to={`/consulta?codigo=${i.codigo}`} />} className="font-mono" />
                                    }
                                  >
                                    {i.codigo}
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {i.nombre} · asignado el {formatDate(c.fechaInicio)}
                                  </TooltipContent>
                                </Tooltip>
                              ) : null
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => dialogs.editarIntegrante(e.id)}
                                  aria-label={`Editar ${nombreCompleto(e)}`}
                                />
                              }
                            >
                              <Pencil />
                            </TooltipTrigger>
                            <TooltipContent>Editar datos</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => dialogs.nuevoComodato({ integranteId: e.id })}
                                  aria-label={`Asignar instrumento a ${nombreCompleto(e)}`}
                                />
                              }
                            >
                              <Handshake />
                            </TooltipTrigger>
                            <TooltipContent>Asignar instrumento</TooltipContent>
                          </Tooltip>
                        </div>
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
    </>
  )
}
