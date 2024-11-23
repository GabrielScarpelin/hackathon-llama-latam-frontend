'use client';
import { useState } from 'react';

export default function Wordynamic() {
  const [currentWord, setCurrentWord] = useState('Cachorro jogando bola');
  const [currentImage, setCurrentImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // Aqui você fará a chamada para sua API de IA
      // Exemplo:
      // const response = await fetch('/api/generate-word-image');
      // const data = await response.json();
      // setCurrentWord(data.word);
      // setCurrentImage(data.imageUrl);
      
      // Simulação - remova isso quando implementar a chamada real
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentWord('Nova Palavra'); // Substitua pela palavra da IA
    } catch (error) {
      console.error('Erro ao gerar novo conteúdo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 w-full max-w-lg mx-auto flex flex-col h-[500px]">
      <h1 className="text-2xl font-bold text-center mb-12">
        Dinâmica de frases
      </h1>

      <div className="mb-4">
        <span className="inline-block bg-[#E454A4] text-white px-6 py-2 rounded-full text-sm h-10">
          {isLoading ? 'Carregando...' : currentWord}
        </span>
      </div>
      
      <div className="flex-grow flex items-center mb-6 ml-48">
        {isLoading ? (
            <div className="w-80 h-64 bg-gray-200 rounded-3xl animate-pulse justify-center" />
            ) : currentImage ? (
            <img 
                src={currentImage} 
                alt={currentWord}
                className="w-80 h-64 object-cover rounded-3xl"
                />
            ) : (
                <div className="w-80 h-64 bg-gray-200 rounded-3xl" />
            )}
            </div>

        {/* Container com largura fixa para alinhar com a imagem */}
            <div className="w-64 flex justify-end ml-48 ">
                <button 
                    onClick={handleNext}
                    disabled={isLoading}
                    className="bg-[#E454A4] h-10  text-white px-6 py-2 rounded-full flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#d13d93] transition-colors"
                >
                    {isLoading ? 'Gerando...' : 'Próximo'}
                    <span className="ml-2">→</span>
                </button>
            </div>
        
    </div>
  );
}