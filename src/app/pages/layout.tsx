import Sidebar from "@/components/Sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-[#4A3C8D] h-full w-full p-6 flex">
        <Sidebar />
        <div className="bg-white w-full h-full rounded-3xl">
            {children}
        </div>
    </div>
  );
}
