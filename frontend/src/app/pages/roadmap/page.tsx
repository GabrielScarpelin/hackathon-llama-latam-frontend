'use client';
import { Search, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

export default function Roadmap() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = [1, 2, 3, 4, 5, 6, 7, 8];
  const [itemsPerView, setItemsPerView] = useState(4);
  
  // Constants for card and spacing measurements
  const CARD_WIDTH = 96; // w-24 = 96px
  const GAP_WIDTH = 16; // gap-4 = 16px
  const MIN_ITEMS = 3; // mínimo de itens visíveis
  const MAX_ITEMS = 6; // máximo de itens visíveis

  const calculateItemsPerView = useCallback(() => {
    const availableWidth = document.getElementById('main-content')!.offsetWidth;
    
    // Calculate how many items can fit in the available width
    const itemWidth = CARD_WIDTH + GAP_WIDTH;
    const possibleItems = Math.floor(availableWidth / itemWidth);
    
    // Clamp the number of items between MIN_ITEMS and MAX_ITEMS
    return Math.max(MIN_ITEMS, Math.min(possibleItems, MAX_ITEMS));
  }, []);

  useEffect(() => {
    const updateItemsPerView = () => {
      setItemsPerView(calculateItemsPerView());
    };

    // Initial calculation
    updateItemsPerView();

    // Add debounced resize listener
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateItemsPerView, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [calculateItemsPerView]);

  const maxIndex = Math.max(0, items.length - itemsPerView);

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const carouselWidth = itemsPerView * (CARD_WIDTH + GAP_WIDTH) - GAP_WIDTH;

  return (
    <div className="w-full max-w-[1440px] mx-auto pt-4 px-4 sm:px-8 lg:px-20">
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

      {/* Materials Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Materiais não finalizados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cards */}
          <div className="relative rounded-3xl h-48 overflow-hidden border-2 border-blue-400">
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="px-3 py-1 bg-white rounded-full text-sm">Cultura</span>
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm">Tempo</span>
            </div>
          </div>
          <div className="relative rounded-3xl h-48 overflow-hidden border-2 border-blue-400">
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="px-3 py-1 bg-white rounded-full text-sm">Cultura</span>
              <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm">Tempo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Section */}
      <div className="w-full">
        <h2 className="text-xl font-bold mb-4">Todos materiais</h2>
        <div className="relative">
          {/* Carousel Container with Fixed Width */}
          <div 
            className="mx-auto overflow-hidden"
            style={{ width: `${carouselWidth}px` }}
          >
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

          {/* Navigation Buttons */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center z-10 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {currentIndex < maxIndex && (
            <button
              onClick={handleNext}
              className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-white shadow-lg rounded-full flex items-center justify-center z-10 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}