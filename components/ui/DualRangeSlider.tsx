'use client';

import { useState, useRef, useEffect } from 'react';

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  label?: string;
}

export function DualRangeSlider({ min, max, value, onChange, step = 1, label = 'Year Range' }: DualRangeSliderProps) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercentage = (val: number) => {
    return ((val - min) / (max - min)) * 100;
  };

  const handleMouseDown = (type: 'min' | 'max') => {
    setIsDragging(type);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newValue = Math.round((percentage / 100) * (max - min) + min);

    if (isDragging === 'min') {
      const newMin = Math.min(newValue, value[1] - step);
      onChange([newMin, value[1]]);
    } else {
      const newMax = Math.max(newValue, value[0] + step);
      onChange([value[0], newMax]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, value, min, max, step]);

  const minPercentage = getPercentage(value[0]);
  const maxPercentage = getPercentage(value[1]);

  return (
    <div className="w-full px-4 py-3">
      <div className="flex items-center justify-between mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <span>{value[0]}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        <span>{value[1]}</span>
      </div>
      
      <div className="relative h-2 select-none" ref={trackRef}>
        {/* Track background */}
        <div className="absolute w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
        
        {/* Active range */}
        <div
          className="absolute h-2 bg-blue-500 dark:bg-blue-400 rounded-full"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`,
          }}
        />
        
        {/* Min thumb */}
        <div
          className="absolute w-5 h-5 bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform"
          style={{
            left: `${minPercentage}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={() => handleMouseDown('min')}
        />
        
        {/* Max thumb */}
        <div
          className="absolute w-5 h-5 bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform"
          style={{
            left: `${maxPercentage}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          onMouseDown={() => handleMouseDown('max')}
        />
      </div>
      
      {/* Tick marks (optional) */}
      <div className="flex justify-between mt-1 text-xs text-gray-400 dark:text-gray-600">
        <span>{min}</span>
        <span>{Math.round((min + max) / 2)}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
