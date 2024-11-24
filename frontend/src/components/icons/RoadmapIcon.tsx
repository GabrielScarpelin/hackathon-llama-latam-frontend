"use client";

import { useEffect, useState } from "react";

export default function RoadmapIcon({ isActive, ...props } : {
    isActive?: boolean;
}) {
    const baseScreenWidth = 1440;
    const [screenWidth, setScreenWidth] = useState<number>(baseScreenWidth);
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
    height={40}
    fill="none"
    {...props}

    style={{
        transform: `scale(${screenWidth / baseScreenWidth * 0.6})`,
    }}
  >
    <g fill={isActive ? "#393E41" : "#F6F7EB"} clipPath="url(#a)">
      <path d="M0 4.511v29.273l11.75 1.705V6.216L0 4.51Zm9.43 25.541-7.11-1.316v-2.422l7.11 1.324v2.414Zm0-4.094-7.11-1.316v-2.417l7.11 1.32v2.413Zm0-4.09L2.32 20.55v-2.418l7.11 1.32v2.418Zm0-4.094-7.11-1.319v-2.419l7.11 1.321v2.417Zm0-4.094-7.11-1.318v-2.42l7.11 1.322v2.416ZM28.25 4.511v29.273L40 35.49V6.216L28.25 4.51Zm9.43 25.541-7.11-1.316v-2.422l7.11 1.324v2.414Zm0-4.094-7.11-1.316v-2.417l7.11 1.32v2.413Zm0-4.09-7.11-1.319v-2.418l7.11 1.32v2.418Zm0-4.094-7.11-1.319v-2.419l7.11 1.321v2.417Zm0-4.094-7.11-1.318v-2.42l7.11 1.322v2.416ZM14.126 6.216v29.273l11.749-1.705V4.511l-11.75 1.705Zm9.43 22.52-7.111 1.316V19.451l7.11-1.32v10.605Zm0-12.28-7.111 1.318v-2.417l7.11-1.32v2.418Zm0-4.094-7.111 1.318v-2.416l7.11-1.322v2.42Z" />
      <path d="M18.821 21.428v5.768l2.358-.44V20.99l-2.358.438Z" />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h40v40H0z" />
      </clipPath>
    </defs>
  </svg>
    )
}