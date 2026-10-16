import { useState } from "react"
import { Link } from "react-router-dom"
import { Building2, ChevronRight, ChevronsUpDown, Handshake, MapPin } from "lucide-react"
import { EstadoBadge } from "@/components/estado-badge"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { nombreCompleto } from "@/lib/format"
import { useStore } from "@/lib/store"
import { FAMILIAS, type Instrumento } from "@/lib/types"

export function SedesPage() {
  const store = useStore()
  const { db } = store
  // Todo empieza contraído: cada sede muestra solo el resumen por familia.
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set())
  const alternar = (claves: string[], abrir: boolean) =>
    setAbiertos((prev) => {
      const next = new Set(prev)
      for (const k of claves) {
        if (abrir) next.add(k)
        else next.delete(k)
      }
      return next
    })

  return (
    <>
      <PageHeader
        title="Sedes"
        description="Instrumentos de cada sede, organizados por familia. Los que están en comodato aparecen en la sede donde quedó el instrumento."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        {db.sedes.map((sede) => {
          // "Aquí" = los que físicamente están en esta sede (resguardo o comodato).
          const aqui = db.instrumentos.filter((i) => store.sedeActual(i)?.id === sede.id)
          const enComodato = aqui.filter((i) => i.estado === "comodato").length
          const clavesSede = FAMILIAS.flatMap((f) => {
            const items = aqui.filter((i) => i.familia === f)
            if (!items.length) return []
            return [`${sede.id}|${f}`, ...agruparPorNombre(items).map(([n]) => `${sede.id}|${f}|${n}`)]
          })
          const todoAbierto = clavesSede.length > 0 && clavesSede.every((k) => abiertos.has(k))
          return (
            <Card key={sede.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="text-muted-foreground size-4" />
                  {sede.nombre}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {sede.direccion}
                  {sede.detalle && ` · ${sede.detalle}`}
                </CardDescription>
                <CardAction>
                  <Button variant="ghost" size="sm" render={<Link to={`/instrumentos?sede=${sede.id}`} />} nativeButton={false}>
                    Ver todos
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{aqui.length} instrumentos</Badge>
                  {enComodato > 0 && <Badge variant="outline">{enComodato} en comodato</Badge>}
                  {aqui.length > 0 && (
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-muted-foreground ml-auto"
                      onClick={() => alternar(clavesSede, !todoAbierto)}
                    >
                      <ChevronsUpDown data-icon="inline-start" />
                      {todoAbierto ? "Contraer todo" : "Expandir todo"}
                    </Button>
                  )}
                </div>

                {aqui.length === 0 && <p className="text-muted-foreground text-sm">Sin instrumentos registrados en esta sede.</p>}

                {FAMILIAS.map((familia) => {
                  const items = aqui.filter((i) => i.familia === familia)
                  if (!items.length) return null
                  const kFamilia = `${sede.id}|${familia}`
                  const tipos = agruparPorNombre(items)
                  return (
                    <Collapsible
                      key={familia}
                      open={abiertos.has(kFamilia)}
                      onOpenChange={(o) => alternar([kFamilia], o)}
                      className="rounded-lg border"
                    >
                      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left">
                        <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform [[data-panel-open]>&]:rotate-90" />
                        <span className="text-sm font-semibold">{familia}</span>
                        <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                          {items.length} {items.length === 1 ? "instrumento" : "instrumentos"}
                        </span>
                      </CollapsibleTrigger>
                      {!abiertos.has(kFamilia) && (
                        <div className="flex flex-wrap gap-1.5 px-3 pb-2.5 pl-9">
                          {tipos.map(([nombre, lista]) => (
                            <Badge key={nombre} variant="secondary" className="font-normal">
                              {nombre} <span className="text-muted-foreground tabular-nums">×{lista.length}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <CollapsibleContent className="space-y-1 px-2 pb-2">
                        {tipos.map(([nombre, lista]) => {
                          const kTipo = `${kFamilia}|${nombre}`
                          const prestados = lista.filter((i) => i.estado === "comodato").length
                          return (
                            <Collapsible key={nombre} open={abiertos.has(kTipo)} onOpenChange={(o) => alternar([kTipo], o)}>
                              <CollapsibleTrigger className="hover:bg-muted/50 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm">
                                <ChevronRight className="text-muted-foreground size-3.5 shrink-0 transition-transform [[data-panel-open]>&]:rotate-90" />
                                <span>{nombre}</span>
                                <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                                  {prestados > 0 && `${prestados} en comodato · `}
                                  {lista.length}
                                </span>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <ul className="mt-1 ml-6 divide-y rounded-md border">
                                  {lista.map((i) => {
                                    const c = store.comodatoDeInstrumento(i.id)
                                    const e = c && store.integrante(c.integranteId)
                                    return (
                                      <li key={i.id} className="flex items-center gap-3 px-3 py-2">
                                        <div className="min-w-0 flex-1">
                                          <Link to={`/consulta?codigo=${i.codigo}`} className="font-mono text-xs hover:underline">
                                            {i.codigo}
                                          </Link>
                                          {e && (
                                            <div className="text-muted-foreground flex items-center gap-1 truncate text-xs">
                                              <Handshake className="size-3 shrink-0" />
                                              {nombreCompleto(e)}
                                            </div>
                                          )}
                                        </div>
                                        <EstadoBadge estado={i.estado} />
                                      </li>
                                    )
                                  })}
                                </ul>
                              </CollapsibleContent>
                            </Collapsible>
                          )
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}

/** Agrupa por nombre de instrumento (Violín, Viola…) conservando el orden de aparición. */
function agruparPorNombre(items: Instrumento[]): [string, Instrumento[]][] {
  const grupos = new Map<string, Instrumento[]>()
  for (const i of items) grupos.set(i.nombre, [...(grupos.get(i.nombre) ?? []), i])
  return [...grupos]
}
