import ProgressPage from "@/components/pages/progress/page";
import SentenceDynamicsPage from "@/components/pages/sentencedynamics/page";
import TalkingPage from "@/components/pages/talking/page";
import MemoryGame from "@/components/pages/wordsearch/page";
import WordDynamicsPage from "@/components/pages/wordynamics/page";


export default async function CollectionPage({
    searchParams,
} : {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}){
    if (searchParams) {
        if ((await searchParams).page === "progress") {
            return <ProgressPage />;
        }
    
        else if ((await searchParams).page === "worddynamic") {
            return <WordDynamicsPage />;
        }
    
        else if ((await searchParams).page === "sentencedynamic") {
            return <SentenceDynamicsPage />;
        }

        else if ((await searchParams).page === "talking") {
            return <TalkingPage />;
        }
        else if ((await searchParams).page === "gamedynamic") {
            return <MemoryGame />
        }
    }

    return <ProgressPage />;
}