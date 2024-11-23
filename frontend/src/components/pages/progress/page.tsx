"use client";

import ProgressCard from "@/components/ProgressCard";
import { useSearchParams } from "next/navigation";

export default function Page(){

    const queryParams = useSearchParams();
    
    return(
        <div className="p-10">
            <h1 className="text-xl font-bold">{queryParams.get("theme")}</h1>
            <div className="cards w-full mt-4 flex flex-col gap-4 ">
                <ProgressCard title="Aprender Palavras" current={58} total={82} href={`talking?theme=${queryParams.get("theme")}&nextPhase=wordynamics`}/>
                <ProgressCard title="VAMOS MONTAR FRASES?" current={58} total={82} gradient="from-[#5EA6FA] to-[#0BB5D6]" progressBarColor="bg-[#E94F37]" href={`talking?theme=${queryParams.get("theme")}&nextPhase=sentecedynamics`}/>
                <ProgressCard title="HORA DE JOGAR E TESTAR SEUS CONHECIMENTOS" current={58} total={82} gradient="from-[#FA923D] to-[#EF4643]" href={`talking?theme=${queryParams.get("theme")}&nextPhase=gamedynamics`}/>
            </div>
        </div>
    )
}