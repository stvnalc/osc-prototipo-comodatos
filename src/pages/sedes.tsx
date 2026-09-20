import { Link } from "react-router-dom"
import { Building2, Handshake, MapPin } from "lucide-react"
import { EstadoBadge } from "@/components/estado-badge"
import { FotoMiniatura } from "@/components/foto-instrumento"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { nombreCompleto } from "@/lib/format"
import { useStore } from "@/lib/store"
import { FAMILIAS } from "@/lib/types"

export function SedesPage() {
  const store = useStore()
  const { db } = store

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
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{aqui.length} instrumentos</Badge>
                  {enComodato > 0 && <Badge variant="outline">{enComodato} en comodato</Badge>}
                </div>

                {aqui.length === 0 && <p className="text-muted-foreground text-sm">Sin instrumentos registrados en esta sede.</p>}

                {FAMILIAS.map((familia) => {
                  const items = aqui.filter((i) => i.familia === familia)
                  if (!items.length) return null
                  return (
                    <div key={familia} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold">{familia}</h3>
                        <span className="text-muted-foreground text-xs tabular-nums">{items.length}</span>
                      </div>
                      <ul className="divide-y rounded-lg border">
                        {items.map((i) => {
                          const c = store.comodatoDeInstrumento(i.id)
                          const e = c && store.integrante(c.integranteId)
                          return (
                            <li key={i.id} className="flex items-center gap-3 px-3 py-2">
                              <FotoMiniatura foto={i.foto} className="size-8" />
                              <div className="min-w-0 flex-1">
                                <Link to={`/consulta?codigo=${i.codigo}`} className="font-mono text-xs hover:underline">
                                  {i.codigo}
                                </Link>
                                <div className="truncate text-sm">
                                  {i.nombre}
                                  {e && (
                                    <span className="text-muted-foreground ml-1 inline-flex items-center gap-1 text-xs">
                                      <Handshake className="size-3" />
                                      {nombreCompleto(e)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <EstadoBadge estado={i.estado} />
                            </li>
                          )
                        })}
                      </ul>
                    </div>
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
