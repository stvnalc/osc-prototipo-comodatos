import { CircleCheck, Handshake, Wrench, AlertTriangle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ESTADO_LABEL, textoVencimiento, type Vencimiento } from "@/lib/format"
import type { EstadoInstrumento } from "@/lib/types"
import { cn } from "@/lib/utils"

const ESTILOS: Record<EstadoInstrumento, string> = {
  disponible: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  comodato: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  reparacion: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
}

const ICONOS = { disponible: CircleCheck, comodato: Handshake, reparacion: Wrench }

export function EstadoBadge({ estado, className }: { estado: EstadoInstrumento; className?: string }) {
  const Icon = ICONOS[estado]
  return (
    <Badge variant="outline" className={cn(ESTILOS[estado], className)}>
      <Icon data-icon="inline-start" />
      {ESTADO_LABEL[estado]}
    </Badge>
  )
}

export function VencimientoBadge({ v }: { v: Vencimiento }) {
  if (v.tipo === "vigente") {
    return <span className="text-muted-foreground text-xs">{textoVencimiento(v)}</span>
  }
  const Icon = v.tipo === "vencido" ? AlertTriangle : Clock
  return (
    <Badge
      variant="outline"
      className={
        v.tipo === "vencido"
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
      }
    >
      <Icon data-icon="inline-start" />
      {textoVencimiento(v)}
    </Badge>
  )
}
