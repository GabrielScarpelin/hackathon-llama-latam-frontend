"use client";

import ProgressCard from "@/components/ProgressCard";
import { useCollection } from "@/contexts/ContentContext";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function ProgressPage(){
    const params = useParams();
    const collectionContext = useCollection();

    useEffect(() => {
        console.log(collectionContext.collection)
    }, [collectionContext.collection])
    
    return(
        <>
            {
                collectionContext.collection ? (
                    <div className="p-10">
                        <h1 className="text-xl font-bold">{collectionContext.collection?.title}</h1>
                        <div className="cards w-full mt-4 flex flex-col gap-4 ">
                            <ProgressCard title="Aprender Palavras" current={(() => {
                                return collectionContext.collection.words.filter((word) => word.url).length
                            })()} total={collectionContext.collection.words.length} href={`${params.id}?page=talking&nextPhase=worddynamic`}/>
                            <ProgressCard title="VAMOS MONTAR FRASES?" current={(() => {
                                return collectionContext.collection.sentences.filter((word) => word.url).length
                            })()} total={collectionContext.collection.sentences.length} gradient="from-[#5EA6FA] to-[#0BB5D6]" progressBarColor="bg-[#E94F37]" href={`${params.id}?page=talking&nextPhase=sentencedynamic`}/>
                            <ProgressCard title="HORA DE JOGAR E TESTAR SEUS CONHECIMENTOS" current={58} total={82} gradient="from-[#FA923D] to-[#EF4643]" href={`${params.id}?page=talking&nextPhase=gamedynamic`}/>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Loader2 size={64} className="animate-spin"/>
                    </div>
                )
            }
        </>
    )
}