'use client'
import React, { useState, useEffect, useCallback } from "react";

export default function MemoryGame() {
  const [cards, setCards] = useState<{ id: number; type: string; content: string }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);

  const cardData = [
    { id: 1, type: "emoji", content: "🐶" },
    { id: 2, type: "name", content: "Cachorro" },
    { id: 3, type: "emoji", content: "🐱" },
    { id: 4, type: "name", content: "Gato" },
    { id: 5, type: "emoji", content: "🐭" },
    { id: 6, type: "name", content: "Rato" },
  ];

  useEffect(() => {
    initializeGame();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.memory-card')) {
        handleCloseExpanded();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const initializeGame = () => {
    const shuffledCards = [...cardData].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs([]);
    setIsLocked(false);
    setIsExpanded(false);
    setExpandedCard(0);
  };

  const handleCloseExpanded = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const handleCardClick = useCallback((index: number) => {
    if (isLocked || matchedPairs.includes(index)) return;

    if (expandedCard === index && isExpanded) {
      handleCloseExpanded();
      return;
    }

    setExpandedCard(index);
    setIsExpanded(true);
    
    if (isPlayerLoaded && player && cards[index].type === "name") {
      player.translate(cards[index].content);
    }
    
    const newFlippedCards = flippedCards.includes(index) 
      ? flippedCards.filter(cardIndex => cardIndex !== index)
      : [...flippedCards, index];
    
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setIsLocked(true);
      const [firstIndex, secondIndex] = newFlippedCards;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (
        (firstCard.type === "emoji" && secondCard.type === "name" && checkMatch(firstCard.content, secondCard.content)) ||
        (firstCard.type === "name" && secondCard.type === "emoji" && checkMatch(secondCard.content, firstCard.content))
      ) {
        setTimeout(() => {
          setMatchedPairs((prev) => [...prev, firstIndex, secondIndex]);
          setFlippedCards([]);
          setIsLocked(false);
          handleCloseExpanded();
        }, 10000);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
          setIsLocked(false);
          handleCloseExpanded();
        }, 10000);
      }
    }
  }, [expandedCard, isLocked, flippedCards, matchedPairs, cards, isExpanded, player, isPlayerLoaded, handleCloseExpanded]);

  const checkMatch = (emoji: string, name: string) => {
    const emojiNameMap: { [key: string]: string } = {
      "🐶": "Cachorro",
      "🐱": "Gato",
      "🐭": "Rato",
      "🦊": "Raposa",
    };
    return emojiNameMap[emoji] === name;
  };

  useEffect(() => {
    let playerInstance: any = null;
    
    const initializeVLibras = () => {
      // @ts-expect-error - VLibras is not defined in the global scope
      if (typeof VLibras !== "undefined") {
        // @ts-expect-error - VLibras is not defined in the global scope
        const newPlayer = new VLibras.Player({
          target: { name: "rnp_webgl", path: "vlibras/build/target" },
          targetPath: "/vlibras/build/target",
        });
        
        playerInstance = newPlayer;
        
        newPlayer.on("load", function () {
          console.log("VLibras carregado");
          setPlayer(newPlayer);
          setIsPlayerLoaded(true);
          newPlayer.toggleSubtitle();
        });

        newPlayer.on("animation:play", () => {
          console.log("Animação iniciada");
        });

        newPlayer.on("animation:end", () => {
          console.log("Animação finalizada");
        });

        newPlayer.on("error", (error: any) => {
          console.error("Erro no VLibras:", error);
        });

        newPlayer.load(document.getElementById("vlibras-container"));
        return true;
      }
      return false;
    };

    const interval = setInterval(() => {
      if (initializeVLibras()) {
        clearInterval(interval);
      }
    }, 100);

    const style = document.createElement('style');
    style.textContent = `
      #vlibras-container {
        width: 100% !important;
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
      }
      #vlibras-container > div {
        width: 100% !important;
        height: 100% !important;
      }
      #vlibras-container canvas {
        width: 100% !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      clearInterval(interval);
      if (playerInstance) {
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

  return (
    <div className="w-full h-full p-4 relative">
      <div className="w-full h-full">
        <div className="h-full px-4 flex flex-col items-center">
          <div className="text-center mb-3 flex flex-col justify-center items-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Jogo da Memória</h1>
            <div className="inline-block bg-pink-500 text-white px-3 py-1 rounded-full text-xl w-60 h-12 flex items-center justify-center">
              Animais
            </div>
          </div>
  
          <div className="relative w-3/5 flex-1">
            {/* VLibras Container - Always present but visibility controlled by CSS */}
            <div 
              id="vlibras-container"
              className={`absolute inset-0 col-span-2 md:col-span-3 bg-white rounded-xl shadow-2xl transition-opacity duration-300
                ${isExpanded && cards[expandedCard]?.type === "name" ? 'opacity-100 visible z-10' : 'opacity-0 invisible z-0'}`}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-8 w-full h-5/6">
              {/* Emoji Container */}
              <div 
                className={`absolute inset-0 col-span-2 md:col-span-3 bg-white rounded-xl shadow-2xl transition-opacity duration-300 flex items-center justify-center text-6xl
                  ${isExpanded && cards[expandedCard]?.type === "emoji" ? 'opacity-100 visible z-10' : 'opacity-0 invisible z-0'}`}
              >
                {isExpanded && cards[expandedCard]?.type === "emoji" && cards[expandedCard]?.content}
              </div>

              {/* Game Cards */}
              {cards.map((card, index) => (
                <div
                  key={card.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(index);
                  }}
                  className={`
                    memory-card aspect-square cursor-pointer rounded-xl transition-all duration-300
                    ${!flippedCards.includes(index) && !matchedPairs.includes(index) ? 
                      'bg-pink-100' : 
                      'bg-white shadow-md border-2 border-pink-200'
                    }
                  `}
                >
                  <div className="w-full h-full flex items-center justify-center text-xs sm:text-3xl">
                    {(flippedCards.includes(index) || matchedPairs.includes(index)) ? (
                      <span>{card.content}</span>
                    ) : (
                      <span className="text-pink-500 font-bold">?</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
  
        <div className="absolute bottom-4 right-4">
          <button className="bg-pink-500 text-white px-6 py-2 rounded-full text-xl flex items-center gap-2 hover:bg-pink-600 transition-colors h-12">
            Próximo
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}