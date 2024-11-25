"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2, Rabbit, RotateCcw } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCollection } from '@/contexts/ContentContext';
import CONFIG from '@/constants/config';
import { useSession } from 'next-auth/react';

const TalkingPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [message, setMessage] = useState(null);
  const [playerSpeed, setPlayerSpeed] = useState(1);
  const [playerGloss, setPlayerGloss] = useState<string | null>(null);
  const [currentGlossIndex, setCurrentGlossIndex] = useState(0);
  const [isMessageFetched, setIsMessageFetched] = useState(false); // New state to prevent duplicate calls
  const [awaitingInitialLoad, setAwaitingInitialLoad] = useState(true);
  const { data: session, status } = useSession();
  const collectionContext = useCollection();
  const queryParams = useSearchParams();
  const params = useParams();

  const mockPhrases = {
    "worddynamic": "Olá, meu nome é Cristiano. Estou aqui para te ajudar a aprender libras. Agora, nós vamos começar com uma dinâmica de palavras com base no tema x",
    "sentencedynamic": "Excelente! Agora que você já aprendeu algumas palavras, vamos montar frases com elas. Vamos lá?",
    "gamedynamics": "Parabéns! Você já aprendeu bastante. Agora é hora de jogar e testar seus conhecimentos. Vamos lá?"
  }

  const [player, setPlayer] = useState(null);

  useEffect(() => {
    let playerInstance: any = null;
    
    const interval = setInterval(() => {
      // @ts-expect-error - VLibras is not defined in the global scope
      if (typeof VLibras !== "undefined") {

        // @ts-expect-error - VLibras is not defined in the global scope
        const newPlayer = new VLibras.Player({
          target: { name: "rnp_webgl", path: "vlibras/build/target" },
          targetPath: "/vlibras/build/target",
        });
        
        // Armazena a referência do player
        playerInstance = newPlayer;
        
        // Configura os eventos antes de carregar
        newPlayer.on("load", function () {
          console.log("VLibras carregado");
          setIsLoaded(true);
          setPlayer(newPlayer);
          newPlayer.disableSubtitle();
        });

        // Evento de progresso da animação
        newPlayer.on("response:glosa", function (progressValue: number) {
          console.log("Progresso da animação:", progressValue);
          setCurrentGlossIndex(progressValue - 1);
          if (newPlayer.gloss && newPlayer.gloss !== playerGloss) {
            setPlayerGloss(newPlayer.gloss);
          }
        });

        // Eventos adicionais para debug
        newPlayer.on("animation:play", () => {
          console.log("Animação iniciada");
        });

        newPlayer.on("animation:end", () => {
          if (awaitingInitialLoad) {
            setAwaitingInitialLoad(false);
          }
        });

        newPlayer.on("error", (error: any) => {
          console.error("Erro no VLibras:", error);
        });

        // Carrega o player no container
        newPlayer.load(document.getElementById("wrapper"));
        clearInterval(interval);
      }
    }, 100);
    const style = document.createElement('style');
    style.textContent = `
      #wrapper {
        width: 100% !important;
      }
      #wrapper > div {
        width: 100% !important;
        height: 100% !important;
      }
      #wrapper canvas {
        width: 100% !important;
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup function
    return () => {
      clearInterval(interval);
      if (playerInstance) {
        // Remove os listeners quando o componente for desmontado
        playerInstance.removeAllListeners("animation:progress");
        playerInstance.removeAllListeners("animation:play");
        playerInstance.removeAllListeners("animation:end");
        playerInstance.removeAllListeners("load");
        playerInstance.removeAllListeners("error");
        playerInstance.stop();
        playerInstance.gloss = null;
      }
      document.head.removeChild(style);
    };
  }, []);



  useEffect(() => {
    console.log('message:', message);
    if (player && message) {
      // @ts-expect-error - the object is never because it's not defined in the global scope
      player.translate(message)
    }
  }, [message, player]);


  const handleAiGeneratedMessage = async () => {
    if (!session) {
      return;
    }
    try {
      const aiMap = {
        "worddynamic": "palavras",
        "sentencedynamic": "frases",
        "gamedynamic": "jogos"
      };
      const response = await fetch(CONFIG.serverUrl+'/introductions/generate-introduction', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.jwt}`
        },
        body: JSON.stringify({
          fase: aiMap[queryParams.get("nextPhase") as keyof typeof aiMap],
          tema: collectionContext?.collection?.title
        })
      });
      if (!response.ok) {
        throw new Error("Failed to fetch AI generated message");
      }
      const data = await response.json();
      return data.introducao;
    } catch (error) {
      console.error('Failed to generate AI message:', error);
      return mockPhrases[queryParams.get("nextPhase") as keyof typeof mockPhrases];
    }
  };

  useEffect(() => {
    if (!isMessageFetched && collectionContext.collection && status === "authenticated") {
      setIsMessageFetched(true); // Prevent duplicate calls
      handleAiGeneratedMessage().then((fetchedMessage) => {
        setMessage(fetchedMessage);
      });
    }
  }, [collectionContext.collection, isMessageFetched, status]); // Consolidated dependency array

  useEffect(() => {
    if (player && message) {
      // @ts-expect-error - the object is never because it's not defined in the global scope
      player.translate(message);
    }
  }, [message, player]);

  useEffect(() => {
    if (!player) return;

    // @ts-expect-error - the object is never because it's not defined in the global scope
    player.setSpeed(playerSpeed);
  }, [playerSpeed]);

  const phaseMap = {
    "worddynamic": "Dinâmica de palavras",
    "sentencedynamic": "Dinâmica de frases",
    "gamedynamics": "Jogos"
  }

  return (
    <>
      { (awaitingInitialLoad || !isLoaded) && (
        <div className='w-full h-full flex flex-col items-center justify-center gap-4'>
          <Loader2 className='text-[#4A3C8D] animate-spin' size={48} />
        </div>
      )}
      <div className={`relative flex flex-col items-center justify-center p-2 h-full gap-2 ${ (awaitingInitialLoad || !isLoaded) ? "hidden" : "block"}`}>
        {/* Balão de fala */}
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-full mb-8 relative font-medium">
          <div className="text-base">{message}</div>
          {/* Triângulo do balão */}
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black drop-shadow-xl"></div>
        </div>

        {/* Container do VLibras */}
        <div 
            className="w-full h-2/3 rounded-2xl flex justify-center items-center relative" 
            id="wrapper"
          >
            <span className="controls absolute z-50 bg-[#4A3C8D] text-white items-center gap-2 w-1/3 py-2 px-4 rounded-xl bottom-0 flex justify-between">
              <RotateCcw size={24} onClick={() => {
                // @ts-expect-error - the object is never because it's not defined in the global scope
                if (player?.gloss && player?.gloss === message) {
                  // @ts-expect-error - the object is never because it's not defined in the global scope
                  player.repeat();
                }
                else {
                  if (player && message) {
                    // @ts-expect-error - the object is never because it's not defined in the global scope
                    player.translate(message);
                  }
                }
              }} className='hover:cursor-pointer'/>
              <div className='flex gap-2 items-center justify-center'>
                <Rabbit size={24} />
                <select 
                  className='p-1 rounded-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                  defaultValue={1} 
                  onChange={(e) => setPlayerSpeed(parseFloat(e.target.value))}
                >
                  <option value="0.5" className='text-black'>0.5x</option>
                  <option value="1" className='text-black'>1x</option>
                  <option value="1.5" className='text-black'>1.5x</option>
                  <option value="2" className='text-black'>2x</option>
                </select>
              </div>
            </span>
            <Link href={`${params.id}?page=${queryParams.get("nextPhase")}`}
              className="absolute bottom-0 flex gap-2 items-center justify-center right-0 z-[100] p-3 rounded-full text-white font-bold bg-[#E454A4]"
            >
              Ir para {phaseMap[queryParams.get("nextPhase") as keyof typeof phaseMap]}
              <ArrowRight size={24} />
            </Link>
            <span className='subtitle absolute py-2 bottom-16 bg-black bg-opacity-70 text-white z-[200] font-medium px-4'>
              {playerGloss?.split(' ')[currentGlossIndex]}
            </span>
          </div>
      </div>
    </>
  );
};

export default TalkingPage;