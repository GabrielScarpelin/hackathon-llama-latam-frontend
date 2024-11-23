"use client"

import React, { useEffect, useState } from 'react';
import { Flag } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const LearningRoadmap = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const queryParams = useSearchParams();

  const points = [
    { color: '#FF6B6B', label: 'Início', number: '1' },
    { color: '#4ECDC4', label: '', number: '2' },
    { color: '#FFD93D', label: '', number: '3' },
    { color: '#95D44A', label: '', number: '4' },
    { color: '#6C63FF', label: 'Fim', number: '5' }
  ];

  useEffect(() => {
    console.log('queryParams:', queryParams);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto p-8 bg-white rounded-xl">
      <h1 className="text-4xl font-bold text-center mb-24 text-gray-800">
        Mapa do aprendizado de libras
      </h1>
      
      <div className="relative h-[300px]">
        {/* Linha tracejada horizontal */}
        <div 
          className="absolute top-[45px] left-[80px] right-[80px] h-1"
          style={{
            borderTop: '6px dashed #E2E8F0',
            zIndex: 0
          }}
        />

        {/* Pontos do roadmap */}
        <div className="relative flex justify-between items-start mx-16">
          {points.map((point, index) => (
            <div key={index} className="flex flex-col items-center">
              <button 
                onClick={() => setCurrentStep(index)}
                className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all 
                  ${currentStep === index ? 'ring-4 ring-offset-4 ring-blue-400' : 'hover:scale-110'}`}
                style={{ backgroundColor: point.color }}
              >
                {currentStep === index ? (
                  <Flag className="w-12 h-12 text-white animate-bounce" />
                ) : (
                  <span className="text-4xl font-bold text-white">{point.number || ''}</span>
                )}
              </button>
              <div className={`mt-6 text-xl font-bold transition-all duration-300
                ${currentStep === index ? 'scale-110' : ''}`} 
                style={{ color: point.color }}
              >
                {point.label}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <button>
          Ver progresso
        </button>
        <Link href={`talking?${queryParams.toString()}`}>
          Continuar
        </Link>
      </div>
    </div>
  );
};

export default LearningRoadmap;