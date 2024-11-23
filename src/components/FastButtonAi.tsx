"use client";

export default function FastButton({ text, onClick }: {
    text: string;
    onClick: () => void;
}) {
    return (
        <button className="font-bold py-2 px-4 border-2 border-[#656565] text-[#656565] rounded-full text-sm hover:bg-[#656565] hover:text-white" onClick={onClick}>
            {text}
        </button>
    )
}