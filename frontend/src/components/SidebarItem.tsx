import Link from "next/link";

export default function SidebarItem({ Icon, text, isActive, href }: {
    Icon: React.ElementType;
    text: string;
    isActive?: boolean;
    href: string;
}) {
    
    return (
        <Link href={href}>
            <div className={`flex gap-4 mx-4 items-center hover:cursor-pointer select-none rounded-full px-4 py-2 ${isActive ? "bg-white text-[#393E41]" : "text-white bg-transparent"}`} >
                <Icon />
                <p className="text-base font-bold">{text}</p>
            </div>
        </Link>
        
    )
}