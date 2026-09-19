import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/components/app-layout"
import { DialogsProvider } from "@/components/dialogs/dialogs-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { StoreProvider } from "@/lib/store"
import { ComodatosPage } from "@/pages/comodatos"
import { ConsultaPage } from "@/pages/consulta"
import { EstudiantesPage } from "@/pages/estudiantes"
import { InstrumentosPage } from "@/pages/instrumentos"
import { PanelPage } from "@/pages/panel"
import { UbicacionesPage } from "@/pages/ubicaciones"

export default function App() {
  return (
    <StoreProvider>
      <TooltipProvider>
        <BrowserRouter>
          <DialogsProvider>
            <Routes>
              <Route element={<AppLayout />}>
                <Route index element={<PanelPage />} />
                <Route path="consulta" element={<ConsultaPage />} />
                <Route path="instrumentos" element={<InstrumentosPage />} />
                <Route path="comodatos" element={<ComodatosPage />} />
                <Route path="estudiantes" element={<EstudiantesPage />} />
                <Route path="ubicaciones" element={<UbicacionesPage />} />
                <Route path="*" element={<PanelPage />} />
              </Route>
            </Routes>
          </DialogsProvider>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </TooltipProvider>
    </StoreProvider>
  )
}
