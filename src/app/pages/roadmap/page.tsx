'use client'
import { Search, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState } from 'react';




export default function Roadmap(){
    const [currentIndex, setCurrentIndex] = useState(0);
    const items = [1, 2, 3, 4, 5  ]; // Added more items for demonstration
    const itemsPerView = 4;
    const maxIndex = Math.max(0, items.length - itemsPerView);
    const CARD_WIDTH = 96; // w-24 = 96px
    const GAP_WIDTH = 16; // gap-4 = 16px
    
    const handleNext = () => {
        setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
    };
    
    const handlePrev = () => {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
    };


    return (
        <div className="max-w-6xl mx-auto pt-4 px-20">
          {/* Header with Search and Profile */}
          <div className="flex justify-between items-center mb-8">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search.."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full"
              />
            </div>
            <div className="ml-4">
              <User className="w-8 h-8 text-gray-700" />
            </div>
          </div>
    
          
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-4">Materiais não finalizados</h2>
            <div className="grid grid-cols-2 gap-24 w-full h-48 object-cover">
              {/* First Card */}
              <div className="relative rounded-3xl overflow-hidden border-2 border-blue-400">
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-3 py-1 bg-white rounded-full text-sm">Cultura</span>
                  <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm">Tempo</span>
                </div>
              </div>
              
    
              {/* Second Card */}
              <div className="relative rounded-3xl overflow-hidden border-2 border-blue-400 ">

                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-3 py-1 bg-white rounded-full text-sm">Cultura</span>
                  <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm">Tempo</span>
                </div>
              </div>
            </div>
          </div>
    
          <div className="w-full ">
            <h2 className="text-xl font-bold ">Todos materiais</h2>
            <div className="relative w-full">
                {/* Botão Anterior */}
                {currentIndex > 0 && (
                <button 
                    onClick={handlePrev}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center z-10 hover:bg-gray-50 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                )}

                {/* Container do Carrossel */}
                <div className="overflow-hidden ">
                <div 
                    className="flex gap-4 transition-transform duration-300 ease-in-out"
                    style={{ 
                    transform: `translateX(-${currentIndex * (CARD_WIDTH + GAP_WIDTH)}px)`,
                    width: `${items.length * (CARD_WIDTH + GAP_WIDTH) - GAP_WIDTH}px`
                    }}
                >
                    {items.map((item) => (
                    <div 
                        key={item} 
                        className="flex-none w-24 h-24 bg-gray-200 rounded-3xl transform transition-transform duration-300 hover:scale-105"
                    />
                    ))}
                </div>
                </div>

                {/* Botão Próximo */}
                {currentIndex < maxIndex && (
                <button 
                    onClick={handleNext}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center z-10 hover:bg-gray-50 transition-colors"
                >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
                )}
            </div>
            </div>
        </div>
    );
}