"use client";

import { useEffect, useState } from "react";

export default function HomeIcon({ isActive, ...props }: { isActive?: boolean }) {
  const baseScreenWidth = 1440;

  // Estado inicial com fallback para evitar acessar `window` diretamente
  const [screenWidth, setScreenWidth] = useState<number>(baseScreenWidth);

  useEffect(() => {
    // Apenas executa no cliente
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };

    // Configura o listener de resize
    handleResize();
    window.addEventListener("resize", handleResize);

    // Remove o listener no cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={40}
      height={43}
      fill="none"
      style={{
        transform: `scale(${(screenWidth / baseScreenWidth) * 0.6})`,
      }}
      {...props}
    >
      <path
        fill={isActive ? "#393E41" : "#fff"}
        d="M0 17.2V43h14.286V31.533c0-3.166 2.558-5.733 5.714-5.733 3.156 0 5.714 2.567 5.714 5.733V43H40V17.2L20 0 0 17.2Z"
      />
    </svg>
  );
}
