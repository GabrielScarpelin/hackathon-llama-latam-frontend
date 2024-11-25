"use client";

import CONFIG from "@/constants/config";
import { Rabbit, RotateCcw } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME_MESSAGE = "Olá! Eu sou Cris! Seu assistente virtual e estou aqui para te auxiliar no aprendizado de libras. Pode me fazer qualquer pergunta!";

export default function Page() {
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [playerSpeed, setPlayerSpeed] = useState(1);
  const [currentGlossIndex, setCurrentGlossIndex] = useState(0);
  const [playerGloss, setPlayerGloss] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const [showVLibras, setShowVLibras] = useState(false);

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

        newPlayer.on("response:glosa", function (progressValue: number) {
            setCurrentGlossIndex(progressValue - 1);
            if (newPlayer.gloss && newPlayer.gloss !== playerGloss) {
                setPlayerGloss(newPlayer.gloss);
            }
        });

        newPlayer.on("animation:end", function () {
          if (!showVLibras) {
            setShowVLibras(true);
            setIsLoading(false);
          }
        })

        newPlayer.on("load", function () {
          setPlayer(newPlayer);
          newPlayer.disableSubtitle();
          // Add welcome message and translate it only after VLibras is loaded
          setMessages([{
            role: "assistant",
            content: WELCOME_MESSAGE
          }]);
          newPlayer.translate(WELCOME_MESSAGE);
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
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }
        #wrapper.visible {
            opacity: 1;
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

      playerInstance = null;
      document.head.removeChild(style);
    };
  }, []);

  const handleSubmit = async () => {
    if (!session) return;
    
    if (!topic.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const newUserMessage: Message = {
        role: "user",
        content: topic
      };
      
      setMessages(prev => [...prev, newUserMessage]);

      const requestBody = {
        messages: [{ content: topic }]
      };

      const response = await fetch(CONFIG.serverUrl+'/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${session.jwt}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const newAssistantMessage: Message = {
        role: "assistant",
        content: data.response
      };
      
      setMessages(prev => [...prev, newAssistantMessage]);

      if (player) {
        // @ts-expect-error - the object is never because it's not defined in the global scope
        player.translate(data.response);
      }

      setTopic("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (player && playerSpeed) {
      // @ts-expect-error - the object is never because it's not defined in the global scope
      player.setSpeed(playerSpeed);
    }
  }, [player, playerSpeed]);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex flex-grow overflow-hidden">
        {/* Left - Fixed Boneco */}
        <div className="w-[50%] flex justify-center items-center relative">
          {!showVLibras && (
            <div className="absolute inset-0 flex items-center justify-center rounded-md bg-opacity-50">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-lg font-medium text-purple-500">Carregando VLibras...</p>
              </div>
            </div>
          )}
          <div 
            id="wrapper" 
            className={`h-[100%] w-[100%] bg-black bg-opacity-50 relative ${showVLibras ? 'visible' : 'invisible'}`}
          >
            <span className="controls absolute z-50 bg-[#4A3C8D] text-white items-center gap-2 w-full py-2 px-4 rounded-xl bottom-0 flex justify-between">
              <RotateCcw 
                size={24} 
                onClick={() => {
                  if (messages.length > 0) {
                    const lastAssistantMessage = messages
                      .filter(m => m.role === "assistant")
                      .slice(-1)[0];
                    if (lastAssistantMessage) {
                      // @ts-expect-error - the object is never because it's not defined in the global scope
                      player?.translate(lastAssistantMessage.content);
                    }
                  }
                }} 
                className='hover:cursor-pointer'
              />
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
        <div className="w-[50%] h-full overflow-y-auto p-6 bg-white flex flex-col gap-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          {messages.map((message, index) => (
            <div key={index} className="">
              <div className={message.role === "user" ? "sended" : "response"}>
                <p className={`${
                  message.role === "user" 
                    ? "bg-[#E454A4] text-white" 
                    : "bg-gray-200 text-black"
                  } py-2 px-4 rounded-lg`}>
                  <b>{message.role === "user" ? "Você" : "Cris"}:</b> {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="w-full h-[10%] flex items-center px-4">
        <div className="input rounded-full border-[#656565] border-2 px-4 w-full flex items-center gap-4">
          <input
            type="text"
            placeholder="Vamos aprender juntos..."
            className="border-none outline-none w-full py-2"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                handleSubmit();
              }
            }}
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