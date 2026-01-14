import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { LayoutDashboard, Megaphone, Users, Settings, Shield, FileText } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-is-admin";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Campanhas", url: "/campanhas", icon: Megaphone },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "PRD Prompt", url: "/prd-prompt", icon: FileText },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;
  const { isAdmin } = useIsAdmin();

  const isActive = (path: string) => {
    if (path === "/campanhas") {
      return currentPath.startsWith("/campanhas");
    }
    if (path === "/leads") {
      return currentPath.startsWith("/leads");
    }
    return currentPath === path;
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent className="border-r border-sidebar-border/70 bg-sidebar/60 bg-gradient-to-b from-sidebar-background/80 via-background/70 to-background/90 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,0,0,0.85)]">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "text-center text-sm font-semibold tracking-[0.4em]" : "text-sm font-semibold tracking-[0.4em]"}>
            {collapsed ? "H" : <span className="bg-gradient-to-r from-primary via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">HUBLY</span>}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/10 hover:text-foreground hover-scale"
                        activeClassName="bg-primary/15 text-primary shadow-[0_0_25px_rgba(192,132,252,0.55)] border-l-2 border-primary"
                      >
                        <span
                          className={
                            active
                              ? `${collapsed ? "" : "before:absolute before:-left-1 before:top-1/2 before:h-7 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:bg-gradient-to-b before:from-primary before:via-fuchsia-500 before:to-cyan-400"}`
                              : ""
                          }
                        >
                          <item.icon className={collapsed ? "h-4 w-4 text-primary" : "mr-3 h-4 w-4 text-primary"} />
                        </span>
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin"
                      className="relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-primary/10 hover:text-foreground hover-scale"
                      activeClassName="bg-primary/15 text-primary shadow-[0_0_25px_rgba(192,132,252,0.55)] border-l-2 border-primary"
                    >
                      <span
                        className={
                          isActive("/admin")
                            ? `${collapsed ? "" : "before:absolute before:-left-1 before:top-1/2 before:h-7 before:w-[2px] before:-translate-y-1/2 before:rounded-full before:bg-gradient-to-b before:from-primary before:via-fuchsia-500 before:to-cyan-400"}`
                            : ""
                        }
                      >
                        <Shield className={collapsed ? "h-4 w-4 text-primary" : "mr-3 h-4 w-4 text-primary"} />
                      </span>
                      {!collapsed && (
                        <span className="flex items-center gap-2">
                          Super Admin
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-primary to-fuchsia-500 text-primary-foreground font-bold shadow-[0_0_10px_rgba(192,132,252,0.5)]">
                            ADMIN
                          </span>
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
