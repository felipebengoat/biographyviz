'use client';

import { TimelineEvent as TimelineEventType, Photo } from '@/lib/types';
import { useState, useEffect, useRef } from 'react';
import { Icon } from '@/lib/icons';

interface TimelineEventProps {
  event: TimelineEventType;
  onClick: () => void;
  isDarkMode: boolean;
}

export default function TimelineEvent({ event, onClick, isDarkMode }: TimelineEventProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Intersection Observer para fade in
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const isPhoto = event.type === 'photo' && event.data && 'preview' in event.data;
  const isLetter = event.type === 'letter';
  const isTrip = event.type === 'trip';

  // Colores por tipo
  const colors = {
    photo: isDarkMode ? 'border-purple-500 bg-purple-950' : 'border-purple-400 bg-purple-50',
    letter: isDarkMode ? 'border-blue-500 bg-blue-950' : 'border-blue-400 bg-blue-50',
    trip: isDarkMode ? 'border-orange-500 bg-orange-950' : 'border-orange-400 bg-orange-50',
  };

  const color = colors[event.type];

  return (
    <div
      ref={elementRef}
      className={`transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}
      onMouseEnter={() => {
        setIsHovered(true);
        // Elevar el contenedor padre al hacer hover
        if (elementRef.current?.parentElement) {
          elementRef.current.parentElement.style.zIndex = '30';
        }
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        // Restaurar z-index del contenedor padre
        if (elementRef.current?.parentElement) {
          elementRef.current.parentElement.style.zIndex = '10';
        }
      }}
    >
      <div
        className={`
          relative cursor-pointer
          transition-all duration-200 ease-out
          ${isHovered ? 'scale-105 -translate-y-1' : 'scale-100'}
        `}
        onClick={onClick}
      >
        {/* Card principal */}
        <div
          className={`
            w-32 h-32 rounded-xl border-2 ${color}
            ${isHovered ? 'shadow-xl' : 'shadow-lg'}
            transition-all duration-200
            overflow-hidden
            flex flex-col items-center justify-center p-2
          `}
        >
          {/* Contenido según tipo */}
          {isPhoto && event.data?.preview ? (
            <img
              src={event.data.preview}
              alt={event.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <>
              <Icon 
                name={event.type === 'letter' ? 'letter' : event.type === 'photo' ? 'photo' : event.type === 'trip' ? 'trip' : 'calendar'} 
                className="text-blue-600 dark:text-blue-400" 
                size={32}
              />
              <p className={`text-xs font-medium text-center line-clamp-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {event.title}
              </p>
              <p className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {event.date.getFullYear()}
              </p>
            </>
          )}

          {/* Badge de año (solo para fotos con preview) */}
          {isPhoto && event.data?.preview && (
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur px-2 py-1 rounded text-xs text-white font-bold">
              {event.date.getFullYear()}
            </div>
          )}
        </div>

        {/* Conector a la línea temporal */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-0.5 ${
            isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
          }`}
          style={{
            height: isHovered ? '32px' : '24px',
            bottom: '-24px',
            transition: 'height 0.3s ease-out',
          }}
        />

        {/* Punto en la línea */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 ${
            isPhoto ? 'border-purple-500 bg-purple-400' :
            isLetter ? 'border-blue-500 bg-blue-400' :
            'border-orange-500 bg-orange-400'
          }`}
          style={{
            bottom: '-27px',
            transform: `translateX(-50%) scale(${isHovered ? 1.3 : 1})`,
            transition: 'transform 0.3s ease-out',
          }}
        />
      </div>
    </div>
  );
}
