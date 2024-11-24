"use client";

import { Rabbit, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

export default function Page() {
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [player, setPlayer] = useState(null);
  const [playerSpeed, setPlayerSpeed] = useState(1);
  const [currentGlossIndex, setCurrentGlossIndex] = useState(0);
  const [playerGloss, setPlayerGloss] = useState<string | null>(null);
  const [currentPhrase, setCurrentPhrase] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [message, setMessage] = useState(null);

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

        playerInstance = newPlayer;

        newPlayer.on("load", function () {
          setIsLoaded(true);
          setPlayer(newPlayer);
          newPlayer.toggleSubtitle();
        });

        newPlayer.load(document.getElementById("wrapper"));
        clearInterval(interval);
      }
    }, 100);

    const style = document.createElement('style');
    style.textContent = `
        #wrapper {
            width: 60% !important;
            height: 80% !important;
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
      if (player) {
        // @ts-expect-error - the object is never because it's not defined in the global scope
        player.stop();
        // @ts-expect-error - the object is never because it's not defined in the global scope
        player.gloss = null;
      }
      document.head.removeChild(style);
    };
  }, []);

  const handleSubmit = async () => {};

  return (
    <div className="h-full flex flex-col p-6">
      {/* Main Content */}
      <div className="flex flex-grow overflow-hidden">
        {/* Left - Fixed Boneco */}
        <div className="w-[50%] flex justify-center items-center">
          <div id="wrapper" className="h-[100%] w-[100%] bg-black bg-opacity-50 relative">
            <span className="controls absolute z-50 bg-[#4A3C8D] text-white items-center gap-2 w-full py-2 px-4 rounded-xl bottom-0 flex justify-between">
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
            <span className='subtitle absolute py-2 bottom-16 bg-black bg-opacity-70 text-white z-[200] font-medium px-4 left-1/2 -translate-x-1/2'>
                {playerGloss?.split(' ')[currentGlossIndex]}
            </span>
          </div>
        </div>

        {/* Right - Messages */}
        <div className="w-[50%] h-full overflow-y-auto p-6 bg-white flex flex-col gap-8">
          <MessageGroup />
          <MessageGroup />
          <MessageGroup />
          <MessageGroup />
          <MessageGroup />
          <MessageGroup />
        </div>
      </div>

      {/* Input Section */}
      <div className="w-full h-[10%] flex items-center px-4">
        <div className="input rounded-full border-[#656565] border-2 px-4 w-full flex items-center gap-4">
          <input
            type="text"
            placeholder="Digite o tópico aqui..."
            className="border-none outline-none w-full py-2"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={40}
                height={40}
                fill="none"
                transform="scale(0.8)"
                className="hover:scale-90 hover:bg-gray-200 rounded-full transition-all"
              >
                <path
                  stroke="#656565"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M19.167 20H9.031m-.287 1.329L7.069 26.33c-.917 2.74-1.375 4.11-1.046 4.953a2.5 2.5 0 0 0 1.657 1.5c.872.243 2.19-.35 4.824-1.535l16.89-7.601c2.572-1.158 3.858-1.736 4.255-2.54a2.5 2.5 0 0 0 0-2.216c-.397-.804-1.683-1.383-4.255-2.54l-16.92-7.614c-2.626-1.182-3.94-1.773-4.81-1.53a2.5 2.5 0 0 0-1.658 1.495c-.33.842.124 2.21 1.03 4.943L8.748 18.8c.156.47.234.704.265.944.027.213.027.429-.001.642-.032.24-.11.474-.267.944Z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageGroup() {
  return (
    <div className="">
      <div className="sended mb-2">
        <p className=" bg-[#E454A4] text-white py-2 px-4 rounded-lg">
          <b>Você:</b> Olá, tudo bem?
        </p>
      </div>
      <div className="response">
        <p className=" bg-gray-200 text-black py-2 px-4 rounded-lg">
            <b>IA:</b> Tudo sim, e você?
        </p>
      </div>
    </div>
  );
}
