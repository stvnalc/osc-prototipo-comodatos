import { Link } from "react-router-dom"
import { ArrowRight, CircleCheck, Handshake, Music, Wrench } from "lucide-react"
import { VencimientoBadge } from "@/components/estado-badge"
import { PageHeader } from "@/components/page-header"
import { useAccionesInstrumento } from "@/components/instrumento-acciones"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { formatDate, nombreCompleto, vencimiento } from "@/lib/format"
import { FAMILIAS, type EstadoInstrumento } from "@/lib/types"

const COLOR: Record<EstadoInstrumento, string> = {
  disponible: "bg-emerald-500",
  comodato: "bg-sky-500",
  reparacion: "bg-amber-500",
}

export function PanelPage() {
  const { store, dialogs, descargar } = useAccionesInstrumento()
  const { db } = store
  const total = db.instrumentos.length
  const cuenta = (e: EstadoInstrumento) => db.instrumentos.filter((i) => i.estado === e).length

  const stats = [
    { label: "Instrumentos", value: total, icon: Music, hint: `${db.sedes.length} sedes`, to: "/instrumentos" },
    { label: "Disponibles", value: cuenta("disponible"), icon: CircleCheck, hint: "Listos para asignar", to: "/instrumentos?estado=disponible", tone: "text-emerald-600" },
    { label: "En comodato", value: cuenta("comodato"), icon: Handshake, hint: `${db.integrantes.length} integrantes registrados`, to: "/instrumentos?estado=comodato", tone: "text-sky-600" },
    { label: "En reparación", value: cuenta("reparacion"), icon: Wrench, hint: "Fuera de servicio", to: "/instrumentos?estado=reparacion", tone: "text-amber-600" },
  ]

  const atencion = db.comodatos
    .map((c) => ({ c, v: vencimiento(c) }))
    .filter(({ v }) => v.tipo !== "vigente")
    .sort((a, b) => a.v.dias - b.v.dias)

  const recientes = [...db.comodatos].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn)).slice(0, 5)

  return (
    <>
      <PageHeader
        title="Panel general"
        description="Resumen del inventario de instrumentos y de los comodatos activos."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="group">
            <Card className="group-hover:ring-foreground/20 h-full transition-shadow">
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <s.icon className={`size-4 ${s.tone ?? ""}`} />
                  {s.label}
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">{s.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground -mt-2 text-xs">
                {s.hint}
                {s.label !== "Instrumentos" && total > 0 && ` · ${Math.round((s.value / total) * 100)}%`}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Comodatos que requieren atención</CardTitle>
            <CardDescription>Vencidos o con 15 días o menos para la devolución.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="sm" render={<Link to="/comodatos" />} nativeButton={false}>
                Ver todos <ArrowRight data-icon="inline-end" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {atencion.length === 0 ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>Todo al día</EmptyTitle>
                  <EmptyDescription>No hay comodatos vencidos ni por vencer.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="divide-y">
                {atencion.map(({ c, v }) => {
                  const i = store.instrumento(c.instrumentoId)
                  const e = store.integrante(c.integranteId)
                  if (!i || !e) return null
                  return (
                    <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                      <div className="min-w-0 flex-1">
                        <Link to={`/consulta?codigo=${i.codigo}`} className="font-medium hover:underline">
                          {i.codigo} · {i.nombre}
                        </Link>
                        <p className="text-muted-foreground truncate text-sm">
                          {nombreCompleto(e)} · devolución {formatDate(c.fechaFin)}
                        </p>
                      </div>
                      <VencimientoBadge v={v} />
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => descargar(i.id)}>
                          Contrato
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => dialogs.finalizarComodato(c.id)}>
                          Recibir
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Estado por familia</CardTitle>
            <CardDescription>Distribución del inventario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {FAMILIAS.map((f) => {
              const items = db.instrumentos.filter((i) => i.familia === f)
              if (!items.length) return null
              return (
                <div key={f} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{f}</span>
                    <span className="text-muted-foreground tabular-nums">{items.length}</span>
                  </div>
                  <div className="bg-muted flex h-2.5 overflow-hidden rounded-full">
                    {(["comodato", "disponible", "reparacion"] as EstadoInstrumento[]).map((e) => {
                      const n = items.filter((i) => i.estado === e).length
                      return n ? (
                        <div
                          key={e}
                          className={COLOR[e]}
                          style={{ width: `${(n / items.length) * 100}%` }}
                          title={`${n} ${e}`}
                        />
                      ) : null
                    })}
                  </div>
                </div>
              )
            })}
            <div className="text-muted-foreground flex flex-wrap gap-3 pt-1 text-xs">
              <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-sky-500" />En comodato</span>
              <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-emerald-500" />Disponible</span>
              <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-amber-500" />En reparación</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos comodatos registrados</CardTitle>
          <CardAction>
            <Button size="sm" onClick={() => dialogs.nuevoComodato()}>Nuevo comodato</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {recientes.map((c) => {
              const i = store.instrumento(c.instrumentoId)
              const e = store.integrante(c.integranteId)
              if (!i || !e) return null
              return (
                <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-sm">
                  <span className="text-muted-foreground w-28 font-mono text-xs">{c.numero}</span>
                  <Link to={`/consulta?codigo=${i.codigo}`} className="font-medium hover:underline">
                    {i.codigo}
                  </Link>
                  <span className="text-muted-foreground">{i.nombre}</span>
                  <span className="ml-auto">{nombreCompleto(e)}</span>
                  <span className="text-muted-foreground hidden w-24 text-right text-xs sm:inline">{formatDate(c.fechaInicio)}</span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </>
  )
}
