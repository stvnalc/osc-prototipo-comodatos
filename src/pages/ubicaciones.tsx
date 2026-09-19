import { Link } from "react-router-dom"
import { ChevronRight, MapPin } from "lucide-react"
import { EstadoBadge } from "@/components/estado-badge"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"

export function UbicacionesPage() {
  const { db } = useStore()

  return (
    <>
      <PageHeader
        title="Ubicaciones de resguardo"
        description="Nodos físicos donde se guardan los instrumentos. Ruta: Sede › Dirección › Espacio."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {db.ubicaciones.map((u) => {
          const aqui = db.instrumentos.filter((i) => i.ubicacionId === u.id)
          const presentes = aqui.filter((i) => i.estado !== "comodato")
          const prestados = aqui.length - presentes.length
          return (
            <Card key={u.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="text-muted-foreground size-4" />
                  {u.espacio}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-1">
                  {u.sede} <ChevronRight className="size-3" /> {u.direccion} <ChevronRight className="size-3" /> {u.espacio}
                </CardDescription>
                <CardAction>
                  <Button variant="ghost" size="sm" render={<Link to={`/instrumentos?ubicacion=${u.id}`} />} nativeButton={false}>
                    Ver
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="space-y-3">
                {u.detalle && <p className="text-muted-foreground text-sm">{u.detalle}</p>}
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">{presentes.length} en sitio</Badge>
                  {prestados > 0 && <Badge variant="outline">{prestados} en préstamo (resguardo suspendido)</Badge>}
                </div>
                <ul className="divide-y text-sm">
                  {presentes.slice(0, 5).map((i) => (
                    <li key={i.id} className="flex items-center gap-2 py-1.5">
                      <Link to={`/consulta?codigo=${i.codigo}`} className="font-mono text-xs hover:underline">
                        {i.codigo}
                      </Link>
                      <span className="text-muted-foreground truncate">{i.nombre}</span>
                      <EstadoBadge estado={i.estado} className="ml-auto" />
                    </li>
                  ))}
                  {presentes.length > 5 && <li className="text-muted-foreground py-1.5 text-xs">y {presentes.length - 5} más…</li>}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </>
  )
}
