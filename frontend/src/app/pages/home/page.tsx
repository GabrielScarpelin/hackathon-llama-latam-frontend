"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FastButton from "@/components/FastButtonAi";
import { useSession } from "next-auth/react";
import CONFIG from "@/constants/config";

export default function Home() {
    const topics = [
        "Móveis da casa",
        "Animais de estimação",
        "Cores e formas",
        "Objetos de cozinha",
        "Brinquedos",
        "Instrumentos musicais",
        "Roupas",
        "Meios de transporte",
    ];
    const router = useRouter();
    const [topic, setTopic] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { data: session } = useSession();

    const handleSubmit = async () => {
        if (session === null) return;

        if (!topic || typeof topic !== 'string' || !topic.trim()) {
            setError("Por favor, digite um tópico válido!");
            return;
        }

        try {
            setError(null);
            setIsLoading(true);


            const response = await fetch(`${CONFIG.serverUrl}/content/generate/content`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${session.jwt}`,
                },
                body: JSON.stringify({
                    topic: topic.trim(),
                    user_id: session.user.id,
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Resposta do servidor:', errorText);
                throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log("Dados recebidos:", data);
            
            // Redirecionamento após receber os dados com sucesso
            if (data.collection_id) {
                router.push(`/pages/history/${data.collection_id}`);
            }

        } catch (err: any) {
            console.error("Detalhes do erro:", err);
            setError(`Erro ao gerar conteúdo: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col p-10 h-full">
            <div className="flex justify-between">
                <div>
                    <span>
                        <h1 className="text-3xl text-[#393E41] font-bold">
                            Olá, Gabriel Scarpelin Diniz 👋
                        </h1>
                    </span>
                    <h2 className="text-gray-600 font-bold text-2xl mt-3">
                        Sobre o que vamos aprender hoje?
                    </h2>
                </div>
            </div>
            <div className="my-auto">
                <p className="text-lg text-center mb-4">
                    Aprenda Libras de forma personalizada e divertida! Com inteligência artificial, criamos conteúdos dinâmicos que se adaptam ao ritmo e interesses do seu filho, tornando o aprendizado mais eficiente e envolvente.
                </p>
                <div className="input rounded-full border-[#656565] border-2 px-4">
                    <div className="flex w-full gap-4">
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
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                {topics.map((topic, index) => (
                    <FastButton
                        key={index}
                        text={topic}
                        onClick={() => {
                            setTopic(topic);
                        }}
                    />
                ))}
                </div>
                <div>
                    {error && <p className="text-red-600 mt-4">{error}</p>}
                </div>
            </div>
        </div>
    );
}