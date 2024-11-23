"use client";

import { useEffect, useState } from "react";

export default function HistoryIcon({ isActive, ...props } : {
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
            height={40}
            fill="none"
            {...props}
            style={{
                transform: `scale(${screenWidth / baseScreenWidth})`,
            }}
        >
            <path
            fill={isActive ? "#393E41" : "#F6F7EB"}
            d="M5 9.459V5a1.667 1.667 0 0 0-3.333 0v6.667A3.333 3.333 0 0 0 5 15h6.667a1.667 1.667 0 1 0 0-3.333h-4.13c.033-.042.066-.085.096-.13A14.985 14.985 0 1 1 5.11 21.676c-.103-.915-.848-1.663-1.768-1.662-.92 0-1.682.75-1.597 1.666A18.333 18.333 0 1 0 5 9.459Z"
            />
            <path
            fill={isActive ? "#393E41" : "#F6F7EB"}
            d="M20 8.333c-.92 0-1.667.747-1.667 1.667v10.778s0 .434.212.761c.14.277.361.518.65.685l7.7 4.446a1.667 1.667 0 0 0 1.667-2.887l-6.895-3.981V10c0-.92-.747-1.667-1.667-1.667Z"
            />
        </svg>
    )
}