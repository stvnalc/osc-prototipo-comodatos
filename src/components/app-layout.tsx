import { useEffect, useRef, useState } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Plus, Search } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { useDialogs } from "@/components/dialogs/dialogs-provider"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

const TITULOS: Record<string, string> = {
  "/": "Panel",
  "/consulta": "Consulta de instrumentos",
  "/instrumentos": "Instrumentos",
  "/comodatos": "Comodatos",
  "/estudiantes": "Estudiantes",
  "/ubicaciones": "Ubicaciones",
}

export function AppLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const dialogs = useDialogs()
  const [codigo, setCodigo] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // "/" enfoca la búsqueda rápida por código desde cualquier pantalla.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{TITULOS[pathname] ?? "Inventario OSC"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!codigo.trim()) return
                navigate(`/consulta?codigo=${encodeURIComponent(codigo.trim().toUpperCase())}`)
                setCodigo("")
                inputRef.current?.blur()
              }}
            >
              <InputGroup className="w-44 sm:w-64">
                <InputGroupAddon>
                  <Search />
                </InputGroupAddon>
                <InputGroupInput
                  ref={inputRef}
                  placeholder="Código, ej. VLN-003"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  aria-label="Buscar instrumento por código"
                />
                <InputGroupAddon align="inline-end" className="hidden sm:flex">
                  <Kbd>/</Kbd>
                </InputGroupAddon>
              </InputGroup>
            </form>
            <Button onClick={() => dialogs.nuevoComodato()} className="hidden md:inline-flex">
              <Plus data-icon="inline-start" />
              Nuevo comodato
            </Button>
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl flex-1 space-y-6 p-4 md:p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
