import React from 'react';

interface AtsScoreGaugeProps {
  score: number;
}

export const AtsScoreGauge: React.FC<AtsScoreGaugeProps> = ({ score }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score > 85) return 'text-green-600';
    if (score > 60) return 'text-yellow-500';
    return 'text-red-600';
  };
  
  const getTrackColor = () => {
    if (score > 85) return 'stroke-green-600';
    if (score > 60) return 'stroke-yellow-500';
    return 'stroke-red-600';
  };

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="w-full h-full" viewBox="0 0 140 140">
        <circle
          className="stroke-current text-gray-200"
          strokeWidth="12"
          fill="transparent"
          r={radius}
          cx="70"
          cy="70"
        />
        <circle
          className={`transition-all duration-1000 ease-in-out ${getTrackColor()}`}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="70"
          cy="70"
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className={`absolute text-4xl font-bold ${getColor()}`}>
        {score}<span className="text-2xl">%</span>
      </div>
    </div>
  );
};
