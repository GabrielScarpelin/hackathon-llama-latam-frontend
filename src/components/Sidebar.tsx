"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import HistoryIcon from "./icons/HistoryIcon";
import HomeIcon from "./icons/HomeIcon";
import RoadmapIcon from "./icons/RoadmapIcon";
import SettingsIcon from "./icons/SettingsIcon";
import SidebarItem from "./SidebarItem";

// Mapear rotas para nomes e ícones
const routeMap = [
  {
    path: "/pages/home",
    name: "Início", // Nome exibido em português
    Icon: HomeIcon,
  },
  {
    path: "/pages/roadmap",
    name: "Roadmap",
    Icon: RoadmapIcon,
  },
  {
    path: "/pages/history",
    name: "Histórico",
    Icon: HistoryIcon,
  },
  {
    path: "/pages/settings",
    name: "Configurações",
    Icon: SettingsIcon,
  },
];

export default function Sidebar() {
  const pathname = usePathname(); // Pega a rota atual

  return (
    <div className="h-full w-2/5 flex flex-col items-center">
      {/* Logo */}
      <div className="px-4 py-2 bg-white rounded-lg">
        <p>Logo</p>
      </div>

      {/* Renderizar rotas dinamicamente */}
      <div className="items relative mt-20 flex flex-col gap-4 w-full">
        {routeMap.map(({ path, name, Icon }) => {
          const isActive = pathname.includes(path);

          return (
            <SidebarItem
              key={path}
              Icon={Icon}
              text={name} // Nome exibido em português
              isActive={isActive}
              href={path}
            />
          );
        })}
      </div>
    </div>
  );
}
