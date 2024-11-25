"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import CONFIG from "@/constants/config";

interface Point {
  id: number;
  label: string;
  color: string;
}

const RoadmapLibras = () => {
  const router = useRouter();
  const [points, setPoints] = useState<Point[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedPoints, setCompletedPoints] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [handleClickWaitingResponse, setHandleClickWaitingResponse] = useState(false);
  const { data: session, status } = useSession();
  const pointsPerView = 5;


  useEffect(() => {
    fetchUserRoadmapLevel();
    fetchPoints();
  }, [status]);

  const fetchUserRoadmapLevel = async () => {
    if (status === "loading") return;
    
    if (session === null) return;

    try {
      const response = await fetch(`${CONFIG.serverUrl}/content/users/${session?.user.id}/roadmap-level`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${session?.jwt}`,
        },
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao obter roadmap_level: ${response.status} - ${errorText}`);
      }
  
      const data = await response.json();
      // Desbloquear pontos até o roadmap_level + 1
      const unlockedPoints = Array.from({ length: data.roadmap_level + 1 }, (_, i) => i + 1);
      setCompletedPoints(unlockedPoints);
    } catch (err: any) {
      setError(`Erro ao carregar roadmap_level: ${err.message}`);
    }
  };

  const fetchPoints = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`${CONFIG.serverUrl}/roadmaps/api/roadmaps/${session?.user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.jwt}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const mappedPoints = data.map((label: string, index: number) => ({
        id: index + 1,
        label,
        color: `hsl(${(index * 50) % 360}, 70%, 50%)`,
      }));

      setPoints(mappedPoints);
    } catch (err: any) {
      setError(`Erro ao carregar conteúdo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentIndex + pointsPerView < points.length && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prev) => prev - 1);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handlePointClick = async (pointId: number) => {
    try {
      if (handleClickWaitingResponse) {
        return;
      }

      const currentLevel = Math.max(...completedPoints);
  
      // Verifica se o ponto clicado é válido
      if (!completedPoints.includes(pointId)) {
        setError("Este ponto ainda não está desbloqueado.");
        return;
      }
  
      // Atualiza o roadmap_level e desbloqueia o próximo ponto, se aplicável
      if (pointId === currentLevel) {
        const updateResponse = await fetch(`${CONFIG.serverUrl}/content/users/${session?.user.id}/update-roadmap`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.jwt}`,
          },
          body: JSON.stringify({ roadmap_level: pointId + 1 }),
        });
  
        if (!updateResponse.ok) {
          const errorText = await updateResponse.text();
          throw new Error(`Erro ao atualizar roadmap_level: ${updateResponse.status} - ${errorText}`);
        }
  
        // Desbloqueia o próximo ponto localmente
        if (!completedPoints.includes(pointId + 1) && pointId + 1 <= points.length) {
          setCompletedPoints((prev) => [...prev, pointId + 1]);
        }
      }
  
      // Envia o POST com o tópico do ponto atual
      const selectedPoint = points.find((point) => point.id === pointId);
  
      if (selectedPoint) {

        setIsLoading(true);
        setHandleClickWaitingResponse(true);

        const response = await fetch(`${CONFIG.serverUrl}/content/generate/content`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${session?.jwt}`,
          },
          body: JSON.stringify({
            topic: selectedPoint.label.trim(),
            user_id: session?.user.id,
          }),
        });

        setHandleClickWaitingResponse(false);
        setIsLoading(false);
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro ao enviar POST: ${response.status} - ${errorText}`);
        }
  
        const data = await response.json();
  
        if (data.collection_id) {
          router.push(`/pages/history/${data.collection_id}`);
        } else {
          throw new Error("Resposta inválida do servidor: ID da coleção ausente.");
        }
      }
    } catch (err: any) {
      console.error(err.message)
    }
  };
  

  return (
    <>
      { isLoading ? (
        <div className="w-full h-full flex items-center justify-center flex-col gap-4">
          <Loader2 size={48} className="animate-spin text-[#4A3C8D]" />
          <p>Procurando sua jornada...</p>
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-center mb-16">Mapa do aprendizado de libras</h1>
        {error && <p className="text-red-500">{error}</p>}  
        <div className="relative">
          <div className="flex items-center justify-center">
            {currentIndex > 0 && (
              <button
                onClick={prevSlide}
                disabled={isAnimating}
                className="absolute left-4 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-8 h-8 text-gray-600" />
              </button>
            )}
  
            <div className="overflow-hidden w-[800px] px-8">
              <div
                className="flex items-center justify-start py-16 transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateX(-${currentIndex * 160}px)`,
                }}
              >
                {points.map((point, index) => (
                  <div key={point.id} className="flex items-center" style={{ minWidth: "160px" }}>
                    <div className="relative group">
                      <button
                        onClick={() => handlePointClick(point.id)}
                        disabled={!completedPoints.includes(point.id)}
                        className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl font-bold transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg group-hover:z-10 ${
                          completedPoints.includes(point.id)
                            ? "cursor-pointer focus:ring-blue-500 hover:brightness-110"
                            : "cursor-not-allowed brightness-75"
                        }`}
                        style={{ backgroundColor: point.color }}
                      >
                        {completedPoints.includes(point.id) ? point.id : <Lock className="w-8 h-8" />}
                      </button>
                      <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-lg font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {point.label}
                      </span>
                    </div>
                    {index < points.length - 1 && (
                      <div
                        className={`w-12 h-0.5 transition-colors duration-300 ${
                          completedPoints.includes(point.id + 1) ? "bg-gray-300" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
  
            {currentIndex + pointsPerView < points.length && (
              <button
                onClick={nextSlide}
                disabled={isAnimating}
                className="absolute right-4 z-10 p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-8 h-8 text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>
      )}
    </>
  );
};

export default RoadmapLibras;
