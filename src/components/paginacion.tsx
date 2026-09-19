import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function usePaginado<T>(items: T[], pagina: number, porPagina = 10) {
  const totalPaginas = Math.max(1, Math.ceil(items.length / porPagina))
  const actual = Math.min(pagina, totalPaginas)
  return { visibles: items.slice((actual - 1) * porPagina, actual * porPagina), totalPaginas, actual }
}

export function Paginacion({
  actual,
  totalPaginas,
  total,
  onChange,
}: {
  actual: number
  totalPaginas: number
  total: number
  onChange: (p: number) => void
}) {
  return (
    <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
      <span>
        {total} {total === 1 ? "resultado" : "resultados"}
      </span>
      {totalPaginas > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" disabled={actual <= 1} onClick={() => onChange(actual - 1)} aria-label="Página anterior">
            <ChevronLeft />
          </Button>
          <span className="px-2 tabular-nums">
            {actual} / {totalPaginas}
          </span>
          <Button variant="outline" size="icon-sm" disabled={actual >= totalPaginas} onClick={() => onChange(actual + 1)} aria-label="Página siguiente">
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  )
}
