'use client';
import { useState } from 'react';

export default function Sentencedynamic() {
  const [currentWord, setCurrentWord] = useState('Cachorro andando na rua');
  const [currentImage, setCurrentImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // Simulação - remova isso quando implementar a chamada real
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentWord('Nova Palavra'); // Substitua pela palavra da IA
      setCurrentImage('https://via.placeholder.com/480x360'); // Substitua pela URL real da imagem gerada
    } catch (error) {
      console.error('Erro ao gerar novo conteúdo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 w-full max-w-lg mx-auto flex flex-col h-[500px]">
      <h1 className="text-2xl font-bold text-center mb-6">
        Dinâmica de frases
      </h1>

      {/* Texto atual em negrito */}
      <div className="mb-3">
        <span className="inline-block bg-[#E454A4] text-white px-6 py-2 rounded-full text-lg font-bold">
          {isLoading ? 'Carregando...' : currentWord}
        </span>
      </div>
      
      {/* Container de imagens com menor distância */}
      <div className="flex flex-col gap-4 mb-4">
        {/* Primeira imagem - menor e alinhada à esquerda */}
        <div className="flex justify-start">
          {isLoading ? (
            <div className="w-40 h-28 bg-gray-200 rounded-2xl animate-pulse" />
          ) : currentImage ? (
            <img
              src={currentImage}
              alt={currentWord}
              className="w-40 h-28 object-cover rounded-2xl"
            />
          ) : (
            <div className="w-40 h-28 bg-gray-200 rounded-2xl" />
          )}
        </div>

        {/* Segunda imagem - maior e alinhada à direita */}
        <div className="flex justify-end">
          {isLoading ? (
            <div className="w-60 h-40 bg-gray-200 rounded-2xl animate-pulse" />
          ) : currentImage ? (
            <img
              src={currentImage}
              alt={currentWord}
              className="w-60 h-40 object-cover rounded-2xl"
            />
          ) : (
            <div className="w-60 h-40 bg-gray-200 rounded-2xl" />
          )}
        </div>
      </div>

      {/* Botão alinhado ao final com a mesma altura que a imagem e menor margem */}
      <div className="w-96 flex justify-end ml-auto mb-2">
        <button
          onClick={handleNext}
          disabled={isLoading}
          className="bg-[#E454A4] h-12 text-white text-lg px-8 py-2 rounded-full flex items-center font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d13d93] transition-all duration-300"
        >
          {isLoading ? 'Gerando...' : 'Próximo'}
          <span className="ml-2">→</span>
        </button>
      </div>
    </div>
  );
}
