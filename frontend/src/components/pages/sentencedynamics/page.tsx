'use client';
import { useCollection } from '@/contexts/ContentContext';
import { Loader2, Rabbit, RotateCcw } from 'lucide-react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function WordDynamicsPage() {
  const searchParams = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState(searchParams.get('currentIndex') ? parseInt(searchParams.get('currentIndex') as string) : 0);
  const [currentWord, setCurrentWord] = useState('');
  const collectionContext = useCollection();
  const [isLoading, setIsLoading] = useState(false);
  const [player, setPlayer] = useState(null);
  const [playerSpeed, setPlayerSpeed] = useState(1);
  const [currentImage, setCurrentImage] = useState('');
  const [currentGlossIndex, setCurrentGlossIndex] = useState(0);
  const [playerGloss, setPlayerGloss] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [awaitingInitialLoad, setAwaitingInitialLoad] = useState(true);
  const router = useRouter();


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
          newPlayer.toggleSubtitle();
        });

        // Evento de progresso da animação
        newPlayer.on("response:glosa", function (progressValue: number, glossLength: number) {
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

  const handleGenerateImage = async (texto_en: string) => {
    try {
      const response = await fetch('http://localhost:8000/content/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collection_id: collectionContext.collection?.collection_id,
          text_en: texto_en,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Failed to generate image:', error);
      return "https://preview.redd.it/uma-foto-aleatoria-de-um-animal-da-sua-galeria-v0-7hil5bhx6afc1.png?width=720&format=png&auto=webp&s=09de5e9787963d8f0b0b8366d739d4d033a0afe1";
    }
  }

  const loadNewWord = async () => {
    if (!collectionContext.collection?.sentences[currentIndex]) return;

    setIsLoading(true);
    setCurrentWord(collectionContext.collection.sentences[currentIndex].texto_pt);

    try {
      if (collectionContext.collection.sentences[currentIndex].url) {
        setCurrentImage(collectionContext.collection.sentences[currentIndex].url);
      } else {
        const imageUrl = await handleGenerateImage(
          collectionContext.collection.sentences[currentIndex].texto_en
        );
        setCurrentImage(imageUrl);
      }
    } catch (error) {
      console.error('Error loading new word:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNewWord();
  }, [currentIndex, collectionContext.collection]);

  useEffect(() => {
    // @ts-expect-error - the object is never because it's not defined in the global scope
    if (player && player.gloss !== currentWord && !isLoading) {
      // @ts-expect-error - the object is never because it's not defined in the global scope
      player.translate(currentWord);
    }
  }, [currentWord, player, isLoading]);

  useEffect(() => {
    if (player) {
      // @ts-expect-error - the object is never because it's not defined in the global scope
      player.setSpeed(playerSpeed);
    }
  }, [playerSpeed]);

  const handleNext = () => {
    if (isLoading) return;
    if (currentIndex === (collectionContext.collection?.sentences.length || 1) - 1) {
      router.push(`${collectionContext.collection?.collection_id}?page=progress`);
      return;
    }
    setCurrentImage(''); // Limpa a imagem atual
    setCurrentIndex((prev) => 
      (prev + 1) % (collectionContext.collection?.sentences.length || 1)
    );

  };

  return (
    <div className='w-full h-full relative'>
      {awaitingInitialLoad && (
        <div className="h-full w-full flex justify-center items-center flex-col gap-4">
          <div className="animate-bounce">
            <Rabbit size={48} className='text-[#4A3C8D]' />
          </div>
          <p className='font-medium'>Um segundo! Nossos coelhos estão procurando as palavras...</p>
        </div>
      )}
      <div className={`rounded-3xl p-6 w-full flex flex-col h-full ${awaitingInitialLoad ? 'hidden' : ''}`}
      >
        <h1 className="text-2xl font-bold text-center mb-1">Dinâmica de palavras</h1>

        <div className="flex justify-center">
          <span 
            className="inline-block bg-[#E454A4] text-white px-20 py-2 rounded-full text-lg font-bold "
          >
            {isLoading ? 'Carregando...' : currentWord}
          </span>
        </div>

        <div className="flex gap-4 items-stretch h-full">
          <div className="flex-[0.4] rounded-2xl flex items-center justify-center">
            {isLoading ? (
              <div className="w-full h-full rounded-2xl animate-pulse flex items-center justify-center">
                <Loader2 size={48} className='text-[#4A3C8D] animate-spin'/>
              </div>
            ) : currentImage ? (
              <Image
                src={currentImage}
                alt={currentWord}
                className="object-cover rounded-2xl w-full"
                width={320}
                height={320}
              />
            ) : (
              <div className="w-full h-full rounded-2xl" />
            )}
          </div>

          <div 
            className="flex-[0.6] rounded-2xl flex justify-center items-center relative" 
            id="wrapper"
          >
            <span className="controls absolute z-50 bg-[#4A3C8D] text-white items-center gap-2 w-2/3 py-2 px-4 rounded-xl bottom-0 flex justify-between">
              <RotateCcw size={24} onClick={() => {
                // @ts-expect-error - the object is never because it's not defined in the global scope
                if (player?.gloss && player?.gloss === currentWord) {
                  // @ts-expect-error - the object is never because it's not defined in the global scope
                  player.repeat();
                }
                else {
                  if (player && currentWord) {
                    // @ts-expect-error - the object is never because it's not defined in the global scope
                    player.translate(currentWord);
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
            <span className='subtitle absolute py-2 bottom-16 bg-black bg-opacity-70 text-white z-[200] font-medium px-4'>
              {playerGloss?.split(' ')[currentGlossIndex]}
            </span>
          </div>
        </div>

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
    </div>
  );
}