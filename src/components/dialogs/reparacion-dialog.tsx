import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/lib/store"

export function ReparacionDialog({ instrumentoId, onClose }: { instrumentoId: string | null; onClose: () => void }) {
  const store = useStore()
  const instrumento = instrumentoId ? store.instrumento(instrumentoId) : undefined
  const [motivo, setMotivo] = useState("")

  const cerrar = () => {
    setMotivo("")
    onClose()
  }

  const confirmar = () => {
    if (!instrumento) return
    store.cambiarEstado(instrumento.id, "reparacion", motivo.trim() || "Enviado a mantenimiento.")
    toast.success(`${instrumento.codigo} enviado a reparación`)
    cerrar()
  }

  return (
    <Dialog open={!!instrumento} onOpenChange={(o) => !o && cerrar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar a reparación</DialogTitle>
          <DialogDescription>
            {instrumento?.codigo} · {instrumento?.nombre} {instrumento?.marca}. Dejará de aparecer como disponible para
            comodatos hasta que se marque como reparado.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="rp-motivo">Motivo / falla detectada</FieldLabel>
          <Textarea
            id="rp-motivo"
            rows={3}
            autoFocus
            placeholder="Ej.: puente inclinado, requiere luthier."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={cerrar}>
            Cancelar
          </Button>
          <Button onClick={confirmar}>Enviar a reparación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
