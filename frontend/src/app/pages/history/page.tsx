"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Collection } from "@/types/CollectionTypes";
import { useSession } from "next-auth/react";
import CONFIG from "@/constants/config";
import { Session } from "next-auth";

const WordSearchHistory = () => {
  const router = useRouter();
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data, status } = useSession();


  // Função para calcular o tempo decorrido
  const getTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Ajusta para o fuso horário do Brasil (UTC-3)
      const brasiliaDate = new Date(date.getTime() + (3 * 60 * 60 * 1000));
      
      const diffInMilliseconds = now.getTime() - brasiliaDate.getTime();
      const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  
      if (diffInMinutes < 1) {
        return 'Agora mesmo';
      }
      
      if (diffInMinutes < 60) {
        return diffInMinutes === 1 ? '1 minuto atrás' : `${diffInMinutes} minutos atrás`;
      }
  
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return diffInHours === 1 ? '1 hora atrás' : `${diffInHours} horas atrás`;
      }
  
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? '1 dia atrás' : `${diffInDays} dias atrás`;
    } catch (error) {
      console.error('Erro ao processar a data:', error);
      return 'Data inválida';
    }
  };

  // Buscar coleções ao carregar a página
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }
    if (!data) return;

    fetchCollections(data);
  }, [status]);

  const fetchCollections = async (session: Session) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${CONFIG.serverUrl}/content/collections/user/${session.user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${session.jwt}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data = await response.json();
      setCollections(data.collections);
    } catch (err: any) {
      console.error("Erro ao buscar coleções:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      { isLoading ? (
        <div className="h-full w-full flex justify-center items-center">
          <Loader2 size={48} className="animate-spin text-black" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 h-full w-full flex flex-col">
      <h1 className="text-blue-500 text-2xl font-bold mb-6">
        Histórico
      </h1>

      <div className="flex-1 overflow-y-auto pr-2 h-full" >
        <div className="space-y-4">
          {collections.length > 0 ? (
            collections.sort((a: Collection, b: Collection) => {
              // Ordena as coleções por data de criação
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }).map((collection: Collection, index: number) => (
              <div
                key={index}
                onClick={() => router.push(`/pages/history/${collection.collection_id}?page=progress`)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Search className="text-violet-400" size={20} />
                    <span className="text-violet-600 font-semibold text-lg">
                      {collection.topic}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {getTimeAgo(collection.created_at)}
                  </span>
                </div>
                <p className="text-gray-600 mt-1 ml-7">{collection.title}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center mt-4">Nenhuma coleção encontrada.</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <button
          className="bg-blue-400 hover:bg-blue-500 text-white px-6 py-3 rounded-full flex items-center gap-2 transition-colors duration-200"
          onClick={() => router.push("/pages/home")} // Redireciona para a página desejada
        >
          <Search size={20} />
          <span>Pesquisar novo assunto</span>
        </button>
      </div>
    </div>
      )}
    </>
  );
};

export default WordSearchHistory;
