import { useRef, useState } from "react"
import { Image as ImageIcon, ImagePlus, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { comprimirImagen, TIPOS_IMAGEN } from "@/lib/imagen"
import { cn } from "@/lib/utils"

/** Vista previa de la foto (solo en el formulario; en las tablas no va miniatura). */
export function FotoMiniatura({ foto, className }: { foto?: string; className?: string }) {
  return foto ? (
    <img src={foto} alt="" className={cn("bg-muted size-10 rounded-md object-cover", className)} />
  ) : (
    <div className={cn("bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-md", className)}>
      <ImageIcon className="size-4" />
    </div>
  )
}

/** Campo para subir/cambiar/quitar la foto del instrumento. */
export function FotoInput({ value, onChange }: { value?: string; onChange: (foto: string | undefined) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [cargando, setCargando] = useState(false)

  const seleccionar = async (file?: File) => {
    if (!file) return
    setCargando(true)
    try {
      onChange(await comprimirImagen(file))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la imagen.")
    } finally {
      setCargando(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="flex items-center gap-3">
      <FotoMiniatura foto={value} className="size-20" />
      <div className="flex flex-col gap-1.5">
        <input
          ref={inputRef}
          type="file"
          accept={TIPOS_IMAGEN}
          className="hidden"
          onChange={(e) => seleccionar(e.target.files?.[0])}
        />
        <Button type="button" variant="outline" size="sm" disabled={cargando} onClick={() => inputRef.current?.click()}>
          {cargando ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <ImagePlus data-icon="inline-start" />}
          {value ? "Cambiar foto" : "Subir foto"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange(undefined)}>
            <Trash2 data-icon="inline-start" />
            Quitar
          </Button>
        )}
        <p className="text-muted-foreground text-xs">JPG, PNG o WebP. Se reduce a 640 px.</p>
      </div>
    </div>
  )
}

/** Botón "Ver foto" + diálogo con la foto en grande (nota del 2026-10-03). */
export function VerFotoButton({
  foto,
  codigo,
  nombre,
  className,
}: {
  foto?: string
  codigo: string
  nombre: string
  className?: string
}) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <Button variant="outline" className={className} onClick={() => setAbierto(true)}>
        <ImageIcon data-icon="inline-start" />
        Ver foto
      </Button>
      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Foto de {codigo}</DialogTitle>
            <DialogDescription>{nombre}</DialogDescription>
          </DialogHeader>
          {foto ? (
            <img src={foto} alt={`Foto de ${codigo}`} className="bg-muted max-h-[65vh] w-full rounded-lg object-contain" />
          ) : (
            <Empty className="border border-dashed">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ImageIcon />
                </EmptyMedia>
                <EmptyTitle>Sin foto cargada</EmptyTitle>
                <EmptyDescription>Puedes subirla desde “Editar” en la ficha del instrumento.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
