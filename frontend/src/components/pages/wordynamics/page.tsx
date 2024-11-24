'use client';
import { useCollection } from '@/contexts/ContentContext';
import { Rabbit, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WordDynamicsPage() {
  const searchParams = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const collectionContext = useCollection();
  const [isLoading, setIsLoading] = useState(false);
  const [player, setPlayer] = useState(null);
  const [playerSpeed, setPlayerSpeed] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof VLibras !== "undefined") {
        console.log("VLibras is now available");
        const player = new VLibras.Player({
          target: { name: "rnp_webgl", path: "vlibras/build/target" },
          targetPath: "/vlibras/build/target",
        });

        player.on("load", function () {
          console.log("Player loaded");
          setPlayer(player);
          
          // Adiciona estilos ao canvas após o carregamento
          const canvas = document.querySelector('#wrapper canvas');
          if (canvas) {
            canvas.style.width = '100%';
            canvas.style.height = '100%';
          }
        });

        player.load(document.getElementById("wrapper"));
        clearInterval(interval);
      } else {
        console.log("VLibras is not available yet");
      }
    }, 100);

    // Adiciona estilos CSS necessários
    const style = document.createElement('style');
    style.textContent = `
      #wrapper {
        width: 100% !important;
        height: 100% !important;
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

    return () => {
      clearInterval(interval);
      document.head.removeChild(style);
    };
  }, []);

  const [currentImage, setCurrentImage] = useState('');

  const handleGenerateImage = async () => {
    setIsLoading(true);
    const response = await fetch('http://localhost:8000/content/generate/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection_id: collectionContext.collection?.collection_id,
        text_en: collectionContext.collection?.words[currentIndex].texto_en,
      }),
    });
    
    const data = await response.json();
    console.log(data);
    return data;
  }

  useEffect(() => {
    if (collectionContext.collection?.words[currentIndex].url) {
      setCurrentImage(collectionContext.collection?.words[currentIndex].url);
      setCurrentWord(collectionContext.collection.words[currentIndex].texto_pt);
    } else if (collectionContext.collection) {
      setCurrentWord(collectionContext.collection.words[currentIndex].texto_pt);
      handleGenerateImage()
        .then((data) => {
          setCurrentImage(data.url);
        })
        .catch((error) => {
          console.error('Failed to generate image:', error);
        });
    }
  }, [currentIndex, collectionContext.collection]);


  useEffect(() => {
    if (player) {
      player.setSpeed(playerSpeed);
    }
  }, [playerSpeed]);

  const handleNext = () => {
    setCurrentIndex((prev) => 
      (prev + 1) % (collectionContext.collection?.words.length || 1)
    );
  };

  return (
    <div className="rounded-3xl p-6 w-full flex flex-col h-full">
      <h1 className="text-2xl font-bold text-center mb-1">Dinâmica de palavras</h1>

      {/* Texto atual em negrito */}
      <div className="flex justify-center">
        <span 
          className="inline-block bg-[#E454A4] text-white px-20 py-2 rounded-full text-lg font-bold cursor-pointer"
          onClick={() => player?.translate(currentWord)}
        >
          {isLoading ? 'Carregando...' : currentWord}
        </span>
      </div>

      {/* Contêiner das imagens */}
      <div className="flex gap-4 items-stretch h-full">
        {/* Primeira imagem */}
        <div className="flex-[0.4] rounded-2xl flex items-center justify-center">
          {isLoading ? (
            <div className="w-full h-full rounded-2xl animate-pulse" />
          ) : currentImage ? (
            <Image
              src={currentImage}
              alt={currentWord}
              className="object-cover rounded-2xl w-full"
              width={320}
              height={320}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-2xl" />
          )}
        </div>

        {/* Container do VLibras */}
        <div 
          className="flex-[0.6] rounded-2xl flex justify-center items-center relative" 
          id="wrapper"
        >
          <span className="controls absolute z-50 bg-[#4A3C8D] text-white items-center gap-2 w-full py-2 px-4 rounded-sm bottom-0 flex justify-between">
            <RotateCcw size={24} onClick={() => {
              if (player.gloss){
                player.repeat();
              }
              else {
                if (player && currentWord) {
                  player.translate(currentWord);
                }
              }
            }} className='hover:cursor-pointer'/>
            <div className='flex gap-2 items-center justify-center'>
              <Rabbit size={24} />
              <select name="" id="" className='p-1 rounded-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500' defaultValue={1} onChange={(e) => {
                setPlayerSpeed(parseFloat(e.target.value));
              }}>
                <option value="0.5" className='text-black'>
                  0.5x
                </option>
                <option value="1" className='text-black' defaultChecked>
                  1x
                </option>
                <option value="1.5" className='text-black'>
                  1.5x
                </option>
                <option value="2" className='text-black'>
                  2x
                </option>
                
              </select>
            </div>

          </span>
        </div>
      </div>

      {/* Botão Próximo */}
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