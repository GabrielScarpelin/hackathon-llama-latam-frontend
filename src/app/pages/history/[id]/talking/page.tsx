"use client";

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const IntroScreen = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [message, setMessage] = useState(null);
  const queryParams = useSearchParams();

  const mockPhrases = {
    "wordynamics": "Olá, meu nome é Cristiano. Estou aqui para te ajudar a aprender libras. Agora, nós vamos começar com uma dinâmica de palavras com base no tema x",
    "sentencedynamics": "Excelente! Agora que você já aprendeu algumas palavras, vamos montar frases com elas. Vamos lá?",
    "gamedynamics": "Parabéns! Você já aprendeu bastante. Agora é hora de jogar e testar seus conhecimentos. Vamos lá?"
  }

  const [player, setPlayer] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let playerInstance = null;
    
    const interval = setInterval(() => {
      if (typeof VLibras !== "undefined") {
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
        });

        // Evento de progresso da animação
        newPlayer.on("response:glosa", function (progressValue, glossLength) {
          console.log("Progresso da animação:", progressValue);
          console.log("Tamanho do glossário:", glossLength);
          console.log("Glosa atual:", newPlayer.gloss);
          
        });

        // Eventos adicionais para debug
        newPlayer.on("animation:play", () => {
          console.log("Animação iniciada");
        });

        newPlayer.on("animation:end", () => {
          console.log("Animação finalizada");
        });

        newPlayer.on("error", (error) => {
          console.error("Erro no VLibras:", error);
        });

        // Carrega o player no container
        newPlayer.load(document.getElementById("vlibras-container"));
        clearInterval(interval);
      }
    }, 100);
    
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
    };
  }, []);


  const onContinue = () => {
    if (player) {
      player.stop();
    }
  }

  useEffect(() => {
    console.log('message:', message);
    if (player && message) {
        player.translate(message)
    }
  }, [message, player])

  const phaseMap = {
    "wordynamics": "Dinâmica de palavras",
    "sentencedynamics": "Dinâmica de frases",
    "gamedynamics": "Jogos"
  }

  return (
    <div className="relative flex flex-col items-center justify-center p-4 h-full">
      {/* Balão de fala */}
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mb-8 relative">
        <div className="text-lg">{message}</div>
        {/* Triângulo do balão */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
      </div>

      {/* Container do VLibras */}
      <div 
        id="vlibras-container" 
        className="w-96 bg-gray-200 rounded-lg mb-8"
      />

      {/* Botão de continuar */}
      <div className='flex gap-4'>
        <button
            onClick={() => {
                if (message && player) {
                    player.repeat();
                } else {
                    setMessage(mockPhrases[queryParams.get("nextPhase")])
                }
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
            Repetir libras
        </button>
        <Link href={`${queryParams.get("nextPhase")}`}
            onClick={onContinue}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
            Ir para {phaseMap[queryParams.get("nextPhase")]}
            <ArrowRight size={20} />
        </Link>
      </div>

      {/* Indicador de carregamento */}
      {!isLoaded && (
        <div className="absolute top-4 right-4 text-sm text-gray-500">
          Carregando VLibras...
        </div>
      )}
    </div>
  );
};

export default IntroScreen;