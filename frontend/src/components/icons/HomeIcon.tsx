"use client";

import { useEffect, useState } from "react";

export default function HomeIcon({isActive, ...props} : {
    isActive?: boolean;
}) {
    const baseScreenWidth = 1440;
    const [screenWidth, setScreenWidth] = useState<number>(window.innerWidth);
    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        }
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, [])
    return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={40}
          height={43}
          fill="none"
          style={{
            transform: `scale(${screenWidth / baseScreenWidth})`,
          }}
          {...props}
        >
          <path
            fill={isActive ? "#393E41" : "#fff"}
            d="M0 17.2V43h14.286V31.533c0-3.166 2.558-5.733 5.714-5.733 3.156 0 5.714 2.567 5.714 5.733V43H40V17.2L20 0 0 17.2Z"
          />
        </svg>
      )
}