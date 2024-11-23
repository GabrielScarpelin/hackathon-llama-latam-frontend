"use client";
import React, { useState, useEffect } from "react";

export default function MemoryGame() {
  const [cards, setCards] = useState<{ id: number; type: string; content: string }[]>([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [isLocked, setIsLocked] = useState(false);

  const cardData = [
    { id: 1, type: "image", content: "🐶" },
    { id: 2, type: "video", content: "🐶" },
    { id: 3, type: "image", content: "🐱" },
    { id: 4, type: "video", content: "🐱" },
    { id: 5, type: "image", content: "🐭" },
    { id: 6, type: "video", content: "🐭" },
    { id: 7, type: "image", content: "🦊" },
    { id: 8, type: "video", content: "🦊" },
    { id: 9, type: "image", content: "🐻" },
    { id: 10, type: "video", content: "🐻" },
    { id: 11, type: "image", content: "🐼" },
    { id: 12, type: "video", content: "🐼" },
    { id: 13, type: "image", content: "🐨" },
    { id: 14, type: "video", content: "🐨" },
    { id: 15, type: "image", content: "🦁" },
    { id: 16, type: "video", content: "🦁" },
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
    if (isLocked) return;
    if (flippedCards.includes(index)) return;
    if (matchedPairs.includes(index)) return;

    const newFlippedCards = [...flippedCards, index];
    setFlippedCards(newFlippedCards);

    if (newFlippedCards.length === 2) {
      setIsLocked(true);
      checkForMatch(newFlippedCards);
    }
  };

  const checkForMatch = (selectedCards) => {
    const [firstIndex, secondIndex] = selectedCards;
    const firstCard = cards[firstIndex];
    const secondCard = cards[secondIndex];

    if (firstCard.content === secondCard.content) {
      setMatchedPairs([...matchedPairs, firstIndex, secondIndex]);
      setFlippedCards([]);
      setIsLocked(false);
    } else {
      setTimeout(() => {
        setFlippedCards([]);
        setIsLocked(false);
      }, 1000);
    }
  };

  return (
    <div className="w-full md:w-[600px] lg:w-[800px] mx-auto p-4">
      <div className="w-full h-[400px] bg-white rounded-3xl relative overflow-hidden shadow-lg">
        {/* Container com scroll */}
        <div className="h-full overflow-y-auto px-4 sm:px-6 md:px-8 py-6">
          {/* Cabeçalho fixo */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Jogo da memória</h1>
            <div className="inline-block bg-pink-500 text-white px-6 py-1 rounded-full text-sm">
              Animais
            </div>
          </div>

          {/* Grid de cartas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-8">
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
                <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl">
                  {(flippedCards.includes(index) || matchedPairs.includes(index)) && (
                    <span>{card.content}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botão Próximo */}
          <div className="flex justify-end">
            <button className="bg-pink-500 text-white px-6 py-2 rounded-full text-sm flex items-center gap-2 hover:bg-pink-600 transition-colors">
              Próximo
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}