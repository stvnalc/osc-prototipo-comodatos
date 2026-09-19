import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type Opcion = { value: string; label: string; hint?: string }

/** Envoltorio de Select (Base UI) que muestra la etiqueta de la opción elegida. */
export function SelectField({
  id,
  value,
  onChange,
  options,
  placeholder = "Seleccionar…",
  className,
  invalid,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: Opcion[]
  placeholder?: string
  className?: string
  invalid?: boolean
}) {
  return (
    <Select
      value={value || null}
      onValueChange={(v) => onChange((v as string | null) ?? "")}
      items={options.map((o) => ({ value: o.value, label: o.label }))}
    >
      <SelectTrigger id={id} className={cn("w-full", className)} aria-invalid={invalid || undefined}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <span className="truncate">{o.label}</span>
            {o.hint && <span className="text-muted-foreground ml-auto pl-2 text-xs">{o.hint}</span>}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
