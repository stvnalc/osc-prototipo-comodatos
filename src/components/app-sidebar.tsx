import { Link, useLocation } from "react-router-dom"
import { Building2, GraduationCap, Handshake, LayoutDashboard, Music, RotateCcw, ScanSearch } from "lucide-react"
import { toast } from "sonner"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useStore } from "@/lib/store"
import { vencimiento } from "@/lib/format"

export function AppSidebar() {
  const { pathname } = useLocation()
  const { db, reset } = useStore()
  const vencidos = db.comodatos.filter((c) => vencimiento(c).tipo !== "vigente").length

  const principal = [
    { to: "/", label: "Panel", icon: LayoutDashboard },
    { to: "/consulta", label: "Consulta de instrumentos", icon: ScanSearch },
  ]
  const gestion = [
    { to: "/instrumentos", label: "Instrumentos", icon: Music, badge: db.instrumentos.length },
    { to: "/comodatos", label: "Comodatos", icon: Handshake, badge: vencidos || undefined, alert: vencidos > 0 },
    { to: "/integrantes", label: "Integrantes", icon: GraduationCap, badge: db.integrantes.length },
    { to: "/sedes", label: "Sedes", icon: Building2, badge: db.sedes.length },
  ]

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link to="/" />} className="h-auto py-2">
              <img src="/brand/logo.webp" alt="" className="size-9 shrink-0 rounded-md bg-white object-contain" />
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold">Inventario OSC</span>
                <span className="text-muted-foreground truncate text-xs">Orquesta Sinfónica de Carabobo</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {principal.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton isActive={isActive(item.to)} tooltip={item.label} render={<Link to={item.to} />}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {gestion.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton isActive={isActive(item.to)} tooltip={item.label} render={<Link to={item.to} />}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                  {item.badge !== undefined && (
                    <SidebarMenuBadge className={item.alert ? "text-red-600 dark:text-red-400" : undefined}>
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Restablecer datos de prueba"
              onClick={() => {
                reset()
                toast.success("Datos de prueba restablecidos")
              }}
            >
              <RotateCcw />
              <span>Restablecer datos de prueba</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <p className="text-muted-foreground px-2 pb-1 text-[11px] leading-snug group-data-[collapsible=icon]:hidden">
          Prototipo navegable · datos ficticios guardados solo en este navegador.
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
