
import ProgressCard from "@/components/ProgressCard";

export default function Page({
    
    params
} : {
    params: {
        id: string;
    }
}){
    
    return(
        <div className="p-10">
            <h1 className="text-xl font-bold">Contextos e palavras usadas na matemática</h1>
            <div className="cards w-full mt-4 flex flex-col gap-4 ">
                <ProgressCard title="Aprender Palavras" current={58} total={82} href={`${params.id}/wordynamics`}/>
                <ProgressCard title="VAMOS MONTAR FRASES?" current={58} total={82} gradient="from-[#5EA6FA] to-[#0BB5D6]" progressBarColor="bg-[#E94F37]" href={`${params.id}/sentencedynamics`}/>
                <ProgressCard title="HORA DE JOGAR E TESTAR SEUS CONHECIMENTOS" current={58} total={82} gradient="from-[#FA923D] to-[#EF4643]" href={`${params.id}/wordsearch`}/>
            </div>
        </div>
    )
}