import { HouseIcon, type LucideIcon, UserIcon } from "lucide-react";

export interface NavItem {
  title: string;
  /** In-app path. Active when the current URL is this path or below it. */
  to: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** Optional group heading; omit for an unlabeled group. */
  label?: string;
  items: NavItem[];
}

/** Sidebar navigation. Features add their entries here. */
export const navGroups: NavGroup[] = [
  {
    items: [{ title: "Home", to: "/home", icon: HouseIcon }],
  },
];

/** Entries shown in the user menu (e.g. Settings, Billing) instead of the sidebar. */
export const userMenuItems: NavItem[] = [{ title: "Profile", to: "/me", icon: UserIcon }];
