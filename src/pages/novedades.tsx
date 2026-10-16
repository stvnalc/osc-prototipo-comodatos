import { Sparkles } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateLong } from "@/lib/format"
import { NOVEDADES, TIPO_LABEL, type TipoCambio } from "@/lib/novedades"

const TONO: Record<TipoCambio, string> = {
  nuevo: "border-emerald-300 text-emerald-700 dark:border-emerald-900 dark:text-emerald-400",
  cambio: "border-sky-300 text-sky-700 dark:border-sky-900 dark:text-sky-400",
  correccion: "border-amber-300 text-amber-700 dark:border-amber-900 dark:text-amber-400",
}

export function NovedadesPage() {
  return (
    <>
      <PageHeader
        title="Novedades"
        description="Qué se fue cambiando en el prototipo y cuándo. Lo más reciente primero."
      />
      <div className="space-y-4">
        {NOVEDADES.map((v, idx) => (
          <Card key={v.fecha}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {idx === 0 && <Sparkles className="size-4 text-amber-500" />}
                {v.titulo}
                {idx === 0 && <Badge variant="secondary">Última actualización</Badge>}
              </CardTitle>
              <CardDescription>
                {formatDateLong(v.fecha)}
                {v.resumen && ` · ${v.resumen}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {v.cambios.map((c) => (
                  <li key={c.texto} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                    <Badge variant="outline" className={`shrink-0 ${TONO[c.tipo]}`}>
                      {TIPO_LABEL[c.tipo]}
                    </Badge>
                    <span className="min-w-0 flex-1">
                      {c.texto}
                      {c.origen && <span className="text-muted-foreground"> — pedido por {c.origen}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
