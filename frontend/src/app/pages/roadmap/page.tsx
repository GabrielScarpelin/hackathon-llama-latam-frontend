"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

const RoadmapLibras = () => {
  const router = useRouter();
  const [points, setPoints] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedPoints, setCompletedPoints] = useState([1]); // Primeiro ponto desbloqueado
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const pointsPerView = 5;

  const API_URL_GENERATE = "http://localhost:8000/roadmaps/api/roadmaps/yanoma";

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL_GENERATE, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na requisição: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Mapear os dados para o formato de pontos
      const mappedPoints = data.map((label, index) => ({
        id: index + 1,
        label,
        color: `hsl(${(index * 50) % 360}, 70%, 50%)`, // Gera cores dinâmicas
      }));

      setPoints(mappedPoints);
      
    } catch (err) {
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


const API_POST_URL = "http://127.0.0.1:8000/content/generate/content";

const handlePointClick = async (pointId) => {
  const selectedPoint = points.find((point) => point.id === pointId);

  // Verifica se o ponto existe e está desbloqueado
  if (selectedPoint && completedPoints.includes(pointId)) {
    const topic = selectedPoint.label;

    try {
      // Criação do corpo da requisição
      const requestBody = {
        topic: topic.trim(),
        user_id: "yanoma",
      };

      console.log("Enviando POST para:", API_POST_URL);
      console.log("Payload:", requestBody);

      // Realizando a requisição POST
      const response = await fetch(API_POST_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro no servidor:", errorText);
        throw new Error(`Erro ao enviar POST: ${response.status} - ${errorText}`);
      }

      // Lidando com a resposta
      const data = await response.json();
      console.log("Resposta do servidor:", data);

      // Redireciona para a página baseada no ID retornado
      if (data.collection_id) {
        router.push(`/pages/history/${data.collection_id}`);
      } else {
        throw new Error("Resposta inválida do servidor: ID da coleção ausente.");
      }

      // Desbloqueia o próximo ponto
      if (!completedPoints.includes(pointId + 1) && pointId + 1 <= points.length) {
        setCompletedPoints((prev) => [...prev, pointId + 1]);
      }
    } catch (err) {
      console.error("Erro durante o clique no ponto:", err.message);
      setError(`Erro: ${err.message}`);
    }
  }
};


  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-16">
        Mapa do aprendizado de libras
      </h1>

      
      {error && <p className="text-red-500">{error}</p>}
      {successMessage && <p className="text-green-500">{successMessage}</p>}

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
                      {completedPoints.includes(point.id) ? (
                        point.id
                      ) : (
                        <Lock className="w-8 h-8" />
                      )}
                    </button>
                    <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-lg font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {completedPoints.includes(point.id) 
                        ? point.label 
                        : point.label }
                    </span>
                  </div>
                  {index < points.length - 1 && (
                    <div 
                      className={`w-12 h-0.5 transition-colors duration-300 ${
                        completedPoints.includes(point.id + 1) 
                          ? "bg-gray-300" 
                          : "bg-gray-200"
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
  );
};

export default RoadmapLibras;
