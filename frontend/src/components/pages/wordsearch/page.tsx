"use client";
import React, { useState, useEffect } from "react";

export default function MemoryGame() {
  const [cards, setCards] = useState<{ id: number; type: string; content: string }[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  // Dados das cartas (emoji + nome)
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

  const initializeGame = () => {
    const shuffledCards = [...cardData].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs([]);
    setIsLocked(false);
  };

  const handleCardClick = (index: number) => {
    if (isLocked || flippedCards.includes(index) || matchedPairs.includes(index)) return;

    const newFlippedCards = [...flippedCards, index];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setIsLocked(true);
      checkForMatch(newFlippedCards);
    }
  };

  const checkForMatch = (selectedCards: number[]) => {
    const [firstIndex, secondIndex] = selectedCards;
    const firstCard = cards[firstIndex];
    const secondCard = cards[secondIndex];

    // Verifica se um emoji combina com o nome correspondente
    if (
      (firstCard.type === "emoji" && secondCard.type === "name" && checkMatch(firstCard.content, secondCard.content)) ||
      (firstCard.type === "name" && secondCard.type === "emoji" && checkMatch(secondCard.content, firstCard.content))
    ) {
      setMatchedPairs((prev) => [...prev, firstIndex, secondIndex]);
      setFlippedCards([]);
      setIsLocked(false);
    } else {
      setTimeout(() => {
        setFlippedCards([]);
        setIsLocked(false);
      }, 1000);
    }
  };

  // Função para verificar se um emoji combina com o nome
  const checkMatch = (emoji: string, name: string) => {
    const emojiNameMap: { [key: string]: string } = {
      "🐶": "Cachorro",
      "🐱": "Gato",
      "🐭": "Rato",
      "🦊": "Raposa",
    };
    return emojiNameMap[emoji] === name;
  };

  return (
    <div className="w-full p-4 h-full relative">
      <div className="w-full h-full">
        {/* Container com scroll */}
        <div className="h-3/5 px-4">
          {/* Cabeçalho fixo */}
          <div className="text-center mb-3 flex flex-col justify-center items-center">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4">Jogo da Memória</h1>
            <div className="inline-block bg-pink-500 text-white px-3 py-1 rounded-full text-xl w-60 h-12 flex items-center justify-center">
              Animais
            </div>
          </div>
  
          {/* Grid de cartas */}
          <div className="flex w-3/5 h-3/5 grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-8">
            {cards.map((card, index) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`aspect-square cursor-pointer rounded-xl transition-all duration-300 ${
                  flippedCards.includes(index) || matchedPairs.includes(index)
                    ? "bg-white shadow-md border-2 border-gray-100"
                    : "bg-gray-100"
                }`}
              >
                <div className="w-full h-full flex items-center justify-center text-xs sm:text-3xl">
                  {(flippedCards.includes(index) || matchedPairs.includes(index)) && (
                    <span>{card.content}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
  
        {/* Botão Próximo */}
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