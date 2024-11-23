'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Sentencedynamic() {
  const [currentWord, setCurrentWord] = useState('Cachorro ');
  const [currentImage, setCurrentImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [player, setPlayer] = useState(null);
  useEffect(() => {
    const interval = setInterval(() => {
      // @ts-expect-error - VLibras is not defined in the global scope
      if (typeof VLibras !== "undefined") {
        console.log("VLibras is now available");

        // @ts-expect-error - VLibras is not defined in the global scope
        const player = new VLibras.Player({
          target: { name: "rnp_webgl", path: "vlibras/build/target" },
          targetPath: "/vlibras/build/target",
        });

        player.on("load", function () {
          console.log("Player loaded");
          setPlayer(player);
        });

        player.load(document.getElementById("wrapper"));

        clearInterval(interval); // Limpa o intervalo após o carregamento
      } else {
        console.log("VLibras is not available yet");
      }
    }, 100); // Verifica a cada 100ms

    return () => clearInterval(interval); // Limpa o intervalo ao desmontar o componente
  }, []);

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
  <div className="rounded-3xl p-2 w-full max-w-lg mx-auto flex flex-col h-[500px]">
    <h1 className="text-2xl font-bold text-center mb-1">Dinâmica de palavras</h1>

    {/* Texto atual em negrito */}
    <div className="mb-3" onClick={() => {
      if (player) {
        // @ts-expect-error - the object is never because it's not defined in the global scope
        player.translate(currentWord);
      }
    }}>
      <span className="inline-block bg-[#E454A4] text-white px-20 py-2 rounded-full text-lg font-bold">
        {isLoading ? 'Carregando...' : currentWord}
      </span>
    </div>

    {/* Contêiner das imagens */}
    <div className="flex gap-8 items-center mb-0">
      {/* Primeira imagem maior */}
      <div className="w-60 h-60 bg-gray-200 rounded-2xl flex-shrink-0">
        {isLoading ? (
          <div className=" bg-gray-200 rounded-2xl animate-pulse" />
        ) : currentImage ? (
          <Image
            src={currentImage}
            alt={currentWord}
            className="object-cover rounded-2xl"
            width={240}
            height={240}
          />
        ) : (
          <div className=" bg-gray-200 rounded-2xl" />
        )}
      </div>

      {/* Segunda imagem maior */}
      <div className="w-100 h-80 bg-gray-200 rounded-2xl flex justify-end" id="wrapper"></div>
    </div>

    {/* Botão alinhado abaixo das imagens e à direita */}
    <div className="flex justify-end mt-6">
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
