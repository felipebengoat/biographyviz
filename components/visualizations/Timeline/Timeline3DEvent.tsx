'use client';

import { TimelineEvent, Photo } from '@/lib/types';
import { motion } from 'framer-motion';
import { Icon } from '@/lib/icons';

interface Timeline3DEventProps {
  event: TimelineEvent;
  index: number;
  totalEvents: number;
  onClick: () => void;
  isDarkMode: boolean;
}

export default function Timeline3DEvent({
  event,
  index,
  totalEvents,
  onClick,
  isDarkMode
}: Timeline3DEventProps) {
  // Posición horizontal distribuida
  const leftPosition = (index / totalEvents) * 100;
  
  // Calcular profundidad Z basada en el año
  const zDepth = -index * 20;
  
  const isPhoto = event.type === 'photo' && event.data && 'preview' in event.data;
  const photoData = isPhoto ? (event.data as Photo) : null;

  const cardBg = isDarkMode ? 'bg-gray-800' : 'bg-white';
  const textClass = isDarkMode ? 'text-white' : 'text-gray-900';
  const borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: `${leftPosition}%`,
        transform: `translateZ(${zDepth}px)`,
        transformStyle: 'preserve-3d'
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ 
        scale: 1.1, 
        zIndex: 50,
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
    >
      {/* Card cuadrado */}
      <div 
        className={`w-32 h-32 ${cardBg} border-2 ${borderColor} rounded-lg shadow-lg overflow-hidden`}
        style={{ borderLeftWidth: '4px', borderLeftColor: event.color }}
      >
        {/* Contenido */}
        {isPhoto && photoData ? (
          <img
            src={photoData.preview}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2">
            <Icon 
              name={event.type === 'letter' ? 'letter' : event.type === 'photo' ? 'photo' : event.type === 'trip' ? 'trip' : 'calendar'} 
              className="text-blue-600 dark:text-blue-400" 
              size={32}
            />
            <p className={`text-xs font-medium text-center line-clamp-2 ${textClass}`}>
              {event.title}
            </p>
          </div>
        )}
        
        {/* Año badge */}
        <div className={`absolute bottom-0 left-0 right-0 ${cardBg} bg-opacity-90 px-2 py-1`}>
          <p className={`text-xs font-medium text-center ${textClass}`}>
            {event.date.getFullYear()}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

