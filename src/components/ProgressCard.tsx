import React from 'react';

interface ProgressCardProps {
  title: string;
  current: number;
  total: number;
  gradient?: string; // Classe do Tailwind para gradiente de fundo
  progressBarColor?: string; // Classe do Tailwind para cor da barra de progresso
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  current,
  total,
  gradient = 'from-pink-400 to-purple-500', // Gradiente padrão
  progressBarColor = 'bg-indigo-600', // Cor padrão da barra de progresso
}) => {
  const percentage = (current / total) * 100;

  return (
    <div className={`bg-gradient-to-r ${gradient} text-white p-6 rounded-xl w-full`}>
      <h2 className="text-lg font-bold uppercase mb-4">{title}</h2>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm block">Progresso</span>
          <div className="text-right text-sm font-bold">
            {`${current}/${total}`}
          </div>
        </div>
        <div className="w-full bg-gray-300 h-3 rounded-full overflow-hidden">
          <div
            className={`${progressBarColor} h-full transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default ProgressCard;
