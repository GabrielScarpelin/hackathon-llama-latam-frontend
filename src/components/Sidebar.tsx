"use client";

import { usePathname } from "next/navigation";

import SidebarItem from "./SidebarItem";
import { History, House, Map, MessageCircle, UserRound } from "lucide-react";
import LogoIcon from "./icons/Logo";

// Mapear rotas para nomes e ícones
const routeMap = [
  {
    path: "/pages/home",
    name: "Início", // Nome exibido em português
    Icon: House,
  },
  {
    path: "/pages/roadmap",
    name: "Roadmap",
    Icon: Map,
  },
  {
    path: "/pages/history",
    name: "Histórico",
    Icon: History,
  },
  {
    path: "/pages/chat",
    name: "Chat",
    Icon: MessageCircle,
  },
  {
    path: "/pages/profile",
    name: "Perfil",
    Icon: UserRound,
  }
];

export default function Sidebar() {
  const pathname = usePathname(); // Pega a rota atual

  return (
    <div className="h-full w-1/5 flex flex-col items-center">
      {/* Logo */}
      <LogoIcon  className="scale-75"/>

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
