"use client";

import Sidebar from "@/components/Sidebar";
import { CollectionProvider } from "@/contexts/ContentContext";
import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-[#4A3C8D] h-full w-full p-6 flex">
        <Script src="/vlibras/build/vlibras.js" strategy="lazyOnload" onLoad={() => {
            console.log("VLibras script loaded");
          }}
        onError={() => console.error("Failed to load VLibras script")}/>
        <Sidebar />
        <div className="bg-white w-full h-full rounded-3xl max-w-full" id="main-content">
            <CollectionProvider>
                {children}
            </CollectionProvider>
        </div>
    </div>
  );
}
