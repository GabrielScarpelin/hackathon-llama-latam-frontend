import ProgressPage from "@/components/pages/progress/page";
import SentenceDynamicsPage from "@/components/pages/sentencedynamics/page";
import TalkingPage from "@/components/pages/talking/page";
import WordDynamicsPage from "@/components/pages/wordynamics/page";


export default function CollectionPage({
    params,
    searchParams,
} : {
    params: { slug: string };
    searchParams?: { [key: string]: string | string[] | undefined };
}){
    if (searchParams) {
        if (searchParams.page === "progress") {
            return <ProgressPage />;
        }
    
        else if (searchParams.page === "worddynamic") {
            return <WordDynamicsPage />;
        }
    
        else if (searchParams.page === "sentencedynamic") {
            return <SentenceDynamicsPage />;
        }

        else if (searchParams.page === "talking") {
            return <TalkingPage />;
        }
    }

    return <ProgressPage />;
}