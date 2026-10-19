import { NavLink, useMatch } from "react-router";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { NavGroup, NavItem } from "../nav";

export function NavMain({ groups }: { groups: NavGroup[] }) {
  return groups.map((group, index) => (
    <SidebarGroup key={group.label ?? index}>
      {group.label ? <SidebarGroupLabel>{group.label}</SidebarGroupLabel> : null}
      <SidebarMenu>
        {group.items.map((item) => (
          <NavMainItem key={item.to} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  ));
}

function NavMainItem({ item }: { item: NavItem }) {
  // Active for the item's path and anything below it ("/chat" matches "/chat/1", not "/chatx").
  const isActive = useMatch({ path: item.to, end: false }) !== null;
  const { isMobile, setOpenMobile } = useSidebar();
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        tooltip={item.title}
        render={<NavLink to={item.to} onClick={() => isMobile && setOpenMobile(false)} />}
      >
        <Icon />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
