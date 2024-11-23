import Link from "next/link";

export default function SidebarItem({ Icon, text, isActive, href }: {
    Icon: React.ElementType;
    text: string;
    isActive?: boolean;
    href: string;
}) {
    
    return (
        <Link href={href}>
            <div className={`flex gap-4 items-center mx-9 hover:cursor-pointer select-none rounded-full px-8 py-2 ${isActive ? "bg-white text-[#393E41]" : "text-white bg-transparent"}`} >
                <Icon isActive={isActive}/>
                <p className="text-xl font-bold">{text}</p>
            </div>
        </Link>
        
    )
}