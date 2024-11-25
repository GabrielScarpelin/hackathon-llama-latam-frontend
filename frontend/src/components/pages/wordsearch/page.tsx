'use client'
import React, { useState, useEffect, useCallback } from "react";
import vlibrasPlayerIllustration from "@/images/illustrate_vlibras.png";
import Image from "next/image";
import { useCollection } from "@/contexts/ContentContext";
import { Loader2, PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";

interface Card {
  id: number;
  imageUrl: string;
  text: string;
  type: "text" | "image";
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const collectionContext = useCollection();
  const [isLocked, setIsLocked] = useState(false);
  const [expandedCard, setExpandedCard] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false);
  const [awaitingAnimationEnd, setAwaitingAnimationEnd] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isCompletingInitialLoad, setIsCompletingInitialLoad] = useState(true);
  const router = useRouter();


  useEffect(() => {
    setTimeout(() => {
      if (isCompletingInitialLoad) {
        setIsCompletingInitialLoad(false);
      }
    }, 3000);
  }, [])


  useEffect(() => {
    initializeGame();
  }, [collectionContext.collection]);

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
    if (!collectionContext.collection) return;

    const allItems = [...collectionContext.collection?.words || [], ...collectionContext.collection?.sentences || []];

    const cardsChoosed = allItems.sort(() => Math.random() - 0.5).slice(0, 3);

    const cardData: Card[] = [ ...cardsChoosed.map((card, index) => {
      return {
        id: index,
        imageUrl: card.url || "",
        text: card.texto_pt,
        type: "image" as const
      }
    }), ...cardsChoosed.map((card, index) => {
      return {
        id: index + cardsChoosed.length,
        imageUrl: "",
        text: card.texto_pt,
        type: "text" as const
      }
    })];

    const shuffledCards = [...cardData].sort(() => Math.random() - 0.5);
    console.log("Suffled Cards:",shuffledCards);
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
    
    if (isPlayerLoaded && player && cards[index].type === "text") {
      player.translate(cards[index].text);
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

      if (secondCard.type === "text") {
        setAwaitingAnimationEnd(true);
      }

      if (
        (firstCard.type === "image" && secondCard.type === "text" && firstCard.text === secondCard.text) ||
        (firstCard.type === "text" && secondCard.type === "image" && firstCard.text === secondCard.text)
      ) {
        setTimeout(() => {
          setMatchedPairs((prev) => [...prev, firstIndex, secondIndex]);
          setFlippedCards([]);
          setIsLocked(false);
        }, 500);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  }, [expandedCard, isLocked, flippedCards, matchedPairs, cards, isExpanded, player, isPlayerLoaded, handleCloseExpanded]);


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
          newPlayer.enableSubtitle();
        });

        newPlayer.on("animation:play", () => {
          console.log("Animação iniciada");
          setAwaitingAnimationEnd(true);
        });

        newPlayer.on("animation:end", () => {
          console.log("Animação finalizada");
          setAwaitingAnimationEnd(false);
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

  const handleTaskCompletion = () => {
    // Aqui você pode adicionar a lógica para finalizar a tarefa
    console.log("Tarefa concluída!");
    setShowCelebration(false);
    router.push("/pages/home");
  };


  useEffect(() => {
    // Verifica se todas as cartas foram encontradas
    if (matchedPairs.length === cards.length && cards.length > 0) {
      setShowCelebration(true);
      
      // Anima os emojis caindo
      const interval = setInterval(() => {
        const emoji = document.createElement('div');
        emoji.innerText = '🎉';
        emoji.style.position = 'fixed';
        emoji.style.left = `${Math.random() * 100}vw`;
        emoji.style.top = '-20px';
        emoji.style.fontSize = '2rem';
        emoji.style.zIndex = '1000';
        emoji.style.animation = 'fall 3s linear';
        emoji.classList.add('emoji-dropping');
        document.body.appendChild(emoji);

        emoji.addEventListener('animationend', () => {
          document.body.removeChild(emoji);
        });

      }, 300);

      setTimeout(() => {
        clearInterval(interval);
      }, 3000);
    }

    return () => {
      document.querySelectorAll('.emoji-dropping').forEach((emoji) => {
        document.body.removeChild(emoji);
      });
    }
  }, [matchedPairs, cards]);


  useEffect(() => {
    if (!awaitingAnimationEnd) {
      console.log("Closing expanded card");
      handleCloseExpanded();
    }
  }, [awaitingAnimationEnd]);

  return (
    <div className="w-full h-full p-4 relative">
      <style jsx>{`
        @keyframes fall {
          from {
            transform: translateY(0) rotate(0deg);
          }
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-20px);
          }
          60% {
            transform: translateY(-10px);
          }
        }
      `}</style>
      {showCelebration && (
        <>
          <div className="fixed bg-black opacity-40 w-full h-full left-0 top-0 z-[49] backdrop-blur-md blur-3xl" />

          <div className="absolute inset-0 bg-black bg-opacity-0 z-50 flex items-center justify-center w-full h-full">
            <div className="bg-white p-8 rounded-xl text-center animate-bounce">
              <PartyPopper className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-2xl font-bold mb-4">Parabéns!</h2>
              <p className="mb-6">Você completou o seu aprendizado sobre: {collectionContext.collection?.title}!</p>
              <button
                onClick={handleTaskCompletion}
                className="bg-green-600 text-white px-6 py-3 rounded-full text-lg hover:bg-green-600 transition-colors"
              >
                Finalizar tarefa
              </button>
            </div>
          </div>
        </>
      )}
      {
        isCompletingInitialLoad && (
          <div className="absolute inset-0 z-50 flex items-center justify-center w-full h-full flex-col gap-4">
            <div className="bg-white p-8 rounded-xl text-center animate-bounce flex items-center flex-col gap-4">
              <Loader2 size={48} className="text-black animate-spin" />
              <p className="mb-6 font-medium">Estamos preparando o jogo da memória para você!</p>
            </div>
          </div>
        )
      }
      <div className="w-full h-full" 
        style={{
          display: isCompletingInitialLoad ? 'none' : 'block'
        }}
      >
        <div className="h-full px-4 flex flex-col items-center">
          <div className="text-center mb-3 flex flex-col justify-center items-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Jogo da Memória</h1>
            <div className="flex justify-center items-center gap-4">
              <div className="bg-pink-500 text-white px-3 py-1 rounded-full text-base w-60 h-12 flex items-center justify-center">
                { collectionContext.collection?.title || "Coleção sobre um tema" }
              </div>
              <div className="inline-block bg-blue-500 text-white px-3 py-1 rounded-full text-xl w-60 h-12 flex items-center justify-center">
                Placar: {Math.ceil(matchedPairs.length / 2)} / {cards.length / 2}
              </div>
            </div>
          </div>
  
          <div className="relative w-3/5 flex-1">
            {/* VLibras Container - Always present but visibility controlled by CSS */}
            <div 
              id="vlibras-container"
              className={`absolute inset-0 col-span-2 md:col-span-3 bg-white rounded-xl shadow-2xl transition-opacity duration-300
                ${isExpanded && cards[expandedCard]?.type === "text" ? 'opacity-100 visible z-10' : 'opacity-0 invisible z-0'}`}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-8 w-full h-5/6">
              {/* Emoji Container */}
              <div 
                className={`absolute inset-0 col-span-2 md:col-span-3 bg-white rounded-xl shadow-2xl transition-opacity duration-300 flex items-center justify-center text-4xl text-center px-2
                  ${isExpanded && cards[expandedCard]?.type === "image" ? 'opacity-100 visible z-10' : 'opacity-0 invisible z-0'}`}
              >
                {isExpanded && cards[expandedCard]?.type === "image" && cards[expandedCard]?.imageUrl || cards[expandedCard]?.text}
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
                  <div className="w-full h-full flex items-center justify-center text-xs sm:text-2xl text-center">
                    {(flippedCards.includes(index) || matchedPairs.includes(index)) ? (
                      <span>
                        { card.type === "text" ? (
                            <Image 
                            src={vlibrasPlayerIllustration}
                            alt="Imagem do personagem VLibras"
                            width={100}
                            height={100}
                          />
                        ) : card.imageUrl === "" ? (
                          <p>{card.text}</p>
                        ) : (
                          <Image
                            src={card.imageUrl}
                            alt={card.text}
                            width={100}
                            height={100}
                          />
                        )}
                      </span>
                    ) : (
                      <span className="text-pink-500 font-bold">?</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}