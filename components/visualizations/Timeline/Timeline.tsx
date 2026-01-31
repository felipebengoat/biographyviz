'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { TimelineEvent } from '@/lib/types';  // Tipo
import TimelineEvent2D from './TimelineEvent';  // Componente (renombrado)
import EventModal from './EventModal';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Icon, Icons } from '@/lib/icons';

interface TimelineProps {
  events: TimelineEvent[];
  isDarkMode: boolean;
}

export default function Timeline({ events, isDarkMode }: TimelineProps) {
  const { t } = useLanguage();
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isSeparatedLanes, setIsSeparatedLanes] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  
  // Permitir scroll horizontal con rueda del mouse
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      // Convertir scroll vertical a horizontal con velocidad aumentada
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY * 1.5; // 1.5x velocidad
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);
  
  // Permitir arrastrar para scrollear
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    
    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      container.style.cursor = 'grabbing';
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };
    
    const handleMouseLeave = () => {
      isDown = false;
      container.style.cursor = 'grab';
    };
    
    const handleMouseUp = () => {
      isDown = false;
      container.style.cursor = 'grab';
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 2; // Multiplicador de velocidad
      container.scrollLeft = scrollLeft - walk;
    };
    
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  // Calcular años min/max (usar todos los eventos)
  const { minYear, maxYear } = useMemo(() => {
    if (events.length === 0) return { minYear: 1900, maxYear: 2000 };
    
    const years = events.map(e => e.date.getFullYear());
    return {
      minYear: Math.min(...years),
      maxYear: Math.max(...years)
    };
  }, [events]);

  const yearRange = maxYear - minYear || 1;

  // Estados de filtros
  const [filters, setFilters] = useState<{
    types: { photo: boolean; letter: boolean; trip: boolean };
    searchText: string;
    yearRange: [number, number];
  }>({
    types: { photo: true, letter: true, trip: true },
    searchText: '',
    yearRange: [minYear, maxYear],
  });

  // Actualizar yearRange cuando cambien minYear/maxYear
  useEffect(() => {
    setFilters(f => ({ ...f, yearRange: [minYear, maxYear] }));
  }, [minYear, maxYear]);

  // Función de filtrado
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Filtro por tipo (solo para photo, letter, trip)
      if (event.type === 'photo' || event.type === 'letter' || event.type === 'trip') {
        if (!filters.types[event.type]) return false;
      }
      
      // Filtro por texto
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(searchLower);
        const matchesDescription = event.description?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }
      
      // Filtro por rango de años
      const year = event.date.getFullYear();
      if (year < filters.yearRange[0] || year > filters.yearRange[1]) return false;
      
      return true;
    });
  }, [events, filters]);

  // Generar marcas de décadas
  const decades = useMemo(() => {
    const result = [];
    const startDecade = Math.floor(minYear / 10) * 10;
    for (let year = startDecade; year <= maxYear; year += 10) {
      result.push(year);
    }
    return result;
  }, [minYear, maxYear]);

  // Indicador de posición en el scroll (después de filteredEvents)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll > 0) {
        const currentScroll = container.scrollLeft;
        const percentage = (currentScroll / maxScroll) * 100;
        setScrollPercentage(Math.round(percentage));
      } else {
        setScrollPercentage(0);
      }
    };
    
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [filteredEvents.length]);

  return (
    <div className={`h-full w-full overflow-hidden flex flex-col ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Panel de Filtros */}
      <div className={`flex-shrink-0 px-6 py-4 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      } border-b`}>
        {/* Primera fila: Toggle de vista y tipos */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <span className={`text-sm font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {t('timeline.layout')}:
            </span>
            <button
              onClick={() => setIsSeparatedLanes(!isSeparatedLanes)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSeparatedLanes
                  ? isDarkMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {isSeparatedLanes ? t('timeline.tripleLane') : t('timeline.singleLane')}
            </button>
          </div>
          
          {/* Filtros de tipo */}
          <div className="flex gap-3">
            <button
              onClick={() => setFilters(f => ({ ...f, types: { ...f.types, photo: !f.types.photo }}))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filters.types.photo
                  ? isDarkMode
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-purple-400"></span>
              {t('timeline.showPhotos')} ({events.filter(e => e.type === 'photo').length})
            </button>
            
            <button
              onClick={() => setFilters(f => ({ ...f, types: { ...f.types, letter: !f.types.letter }}))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filters.types.letter
                  ? isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-blue-400"></span>
              {t('timeline.showLetters')} ({events.filter(e => e.type === 'letter').length})
            </button>
            
            <button
              onClick={() => setFilters(f => ({ ...f, types: { ...f.types, trip: !f.types.trip }}))}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                filters.types.trip
                  ? isDarkMode
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-500 text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-400'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-orange-400"></span>
              {t('timeline.showTrips')} ({events.filter(e => e.type === 'trip').length})
            </button>
          </div>
        </div>
        
        {/* Segunda fila: Búsqueda y contador */}
        <div className="flex items-center gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={t('timeline.searchPlaceholder')}
              value={filters.searchText}
              onChange={(e) => setFilters(f => ({ ...f, searchText: e.target.value }))}
              className={`w-full px-4 py-2 pl-10 rounded-lg text-sm transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-200 placeholder-gray-400 focus:bg-gray-600'
                  : 'bg-white text-gray-800 placeholder-gray-500 border border-gray-300 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
            />
            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            
            {/* Clear button */}
            {filters.searchText && (
              <button
                onClick={() => setFilters(f => ({ ...f, searchText: '' }))}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Contador de resultados */}
          <div className={`text-sm ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Showing <span className="font-bold">{filteredEvents.length}</span> of {events.length} events
          </div>
          
          {/* Reset filters */}
          {(filters.searchText || !filters.types.photo || !filters.types.letter || !filters.types.trip) && (
            <button
              onClick={() => setFilters({
                types: { photo: true, letter: true, trip: true },
                searchText: '',
                yearRange: [minYear, maxYear],
              })}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Reset Filters
            </button>
          )}
          
          {/* Navegación rápida */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollLeft -= 400;
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Scroll left"
            >
              <Icons.chevronLeft size={16} />
            </button>
            
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({
                    left: 0,
                    behavior: 'smooth'
                  });
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Go to start"
            >
              Start
            </button>
            
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTo({
                    left: scrollContainerRef.current.scrollWidth,
                    behavior: 'smooth'
                  });
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Go to end"
            >
              End
            </button>
            
            <button
              onClick={() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollLeft += 400;
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Scroll right"
            >
              <Icons.chevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor de scroll horizontal */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-x-auto overflow-y-hidden scroll-smooth timeline-scroll cursor-grab"
        style={{
          overscrollBehaviorX: 'contain',
          scrollbarWidth: 'thin',
          scrollbarColor: isDarkMode 
            ? '#4b5563 #1f2937'  // Scrollbar dark mode
            : '#d1d5db #f3f4f6', // Scrollbar light mode
        }}
      >
        <div 
          className="h-full relative" 
          style={{ 
            minWidth: `${Math.max(
              yearRange * 30, // 30px por año (mucho más compacto que antes)
              typeof window !== 'undefined' ? window.innerWidth : 1200 // Al menos el ancho de la pantalla
            )}px`,
            width: 'max-content', // Crecer según contenido
          }}
        >
          {/* Background con franjas por década */}
          {decades.map((decade, index) => {
            const x = ((decade - minYear) / yearRange) * 100;
            const width = (10 / yearRange) * 100; // Ancho de cada década
            
            return (
              <div
                key={decade}
                className={`absolute top-0 bottom-0 ${
                  index % 2 === 0 
                    ? isDarkMode ? 'bg-gray-800/40' : 'bg-gray-100/50'
                    : 'bg-transparent'
                }`}
                style={{
                  left: `${x}%`,
                  width: `${width}%`,
                }}
              >
                {/* Header de década - más compacto */}
                <div className="sticky left-0 top-2 ml-2">
                  <div className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold ${
                    isDarkMode ? 'bg-gray-700/80 text-gray-200' : 'bg-white/90 text-gray-700'
                  } shadow-sm`}>
                    {decade}s
                  </div>
                </div>
              </div>
            );
          })}

          {/* Línea temporal central */}
          <div className={`absolute top-1/2 left-0 right-0 h-0.5 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-blue-400/20 via-blue-400/50 to-blue-400/20'
              : 'bg-gradient-to-r from-blue-500/20 via-blue-500/50 to-blue-500/20'
          }`} />

          {/* Líneas de separación de carriles */}
          {isSeparatedLanes && (
            <>
              {/* Línea carril superior (Photos) */}
              <div className={`absolute left-0 right-0 h-px ${
                isDarkMode ? 'bg-purple-500/30' : 'bg-purple-400/30'
              }`} style={{ top: '25%' }} />
              
              {/* Línea carril medio (Letters) */}
              <div className={`absolute left-0 right-0 h-px ${
                isDarkMode ? 'bg-blue-500/30' : 'bg-blue-400/30'
              }`} style={{ top: '50%' }} />
              
              {/* Línea carril inferior (Trips) */}
              <div className={`absolute left-0 right-0 h-px ${
                isDarkMode ? 'bg-orange-500/30' : 'bg-orange-400/30'
              }`} style={{ top: '75%' }} />
              
              {/* Labels de carriles */}
              <div className="absolute left-4 top-[25%] -translate-y-1/2">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  isDarkMode ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                }`}>
                  Photos
                </span>
              </div>
              <div className="absolute left-4 top-[50%] -translate-y-1/2">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}>
                  Letters
                </span>
              </div>
              <div className="absolute left-4 top-[75%] -translate-y-1/2">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  isDarkMode ? 'bg-orange-900/50 text-orange-300' : 'bg-orange-100 text-orange-700'
                }`}>
                  Trips
                </span>
              </div>
            </>
          )}

          {/* Eventos - posicionados según cronología (año) */}
          {filteredEvents.map((event, index) => {
            const year = event.date.getFullYear();
            // Calcular posición X basada en el año (porcentaje del rango de años)
            const x = ((year - minYear) / yearRange) * 100;
            
            // Calcular posición Y según modo
            let yPosition = '50%'; // Por defecto centrado
            
            if (isSeparatedLanes) {
              // Separar en 3 carriles
              if (event.type === 'photo') {
                yPosition = '25%'; // Carril superior
              } else if (event.type === 'letter') {
                yPosition = '50%'; // Carril medio
              } else if (event.type === 'trip') {
                yPosition = '75%'; // Carril inferior
              }
            }
            
            return (
              <div
                key={event.id}
                className="absolute -translate-y-1/2 group"
                style={{
                  left: `${x}%`,
                  top: yPosition,
                  zIndex: 10, // z-index base
                }}
              >
                <TimelineEvent2D
                  event={event}
                  onClick={() => setSelectedEvent(event)}
                  isDarkMode={isDarkMode}
                />
              </div>
            );
          })}
          
          {/* Indicador de posición en el scroll */}
          {scrollPercentage > 0 && scrollPercentage < 100 && (
            <div className={`fixed bottom-6 right-6 z-50 rounded-full px-3 py-1.5 shadow-lg border ${
              isDarkMode 
                ? 'bg-gray-800 text-gray-300 border-gray-700' 
                : 'bg-white text-gray-700 border-gray-200'
            }`}>
              <span className="text-xs font-medium">
                {scrollPercentage}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mini-mapa de navegación */}
      <div className={`flex-shrink-0 h-20 ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
      } border-t px-6 py-3`}>
        <div className="h-full flex flex-col justify-center">
          {/* Barra de progreso clickeable */}
          <div 
            className={`relative h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full overflow-hidden mb-2 cursor-pointer`}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const percentage = (x / rect.width) * 100;
              const targetYear = minYear + (yearRange * percentage / 100);
              
              // Scroll al año clickeado
              if (scrollContainerRef.current) {
                const targetX = (scrollContainerRef.current.scrollWidth * percentage) / 100;
                scrollContainerRef.current.scrollTo({ left: targetX, behavior: 'smooth' });
              }
            }}
          >
            {/* Marcadores de décadas */}
            {decades.map(decade => {
              const x = ((decade - minYear) / yearRange) * 100;
              return (
                <div
                  key={decade}
                  className={`absolute top-0 bottom-0 w-px ${
                    isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
                  }`}
                  style={{ left: `${x}%` }}
                />
              );
            })}

            {/* Indicadores de eventos con tooltip */}
            {events.map(event => {
              const year = event.date.getFullYear();
              const x = ((year - minYear) / yearRange) * 100;
              const dotColor = 
                event.type === 'photo' ? 'bg-purple-500' :
                event.type === 'letter' ? 'bg-blue-500' :
                'bg-orange-500';
              
              return (
                <div
                  key={event.id}
                  className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dotColor} cursor-pointer hover:scale-150 transition-transform group`}
                  style={{ left: `${x}%` }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Scroll al evento específico
                    if (scrollContainerRef.current) {
                      const targetX = (scrollContainerRef.current.scrollWidth * x) / 100;
                      scrollContainerRef.current.scrollTo({ left: targetX - scrollContainerRef.current.clientWidth / 2, behavior: 'smooth' });
                    }
                  }}
                >
                  {/* Tooltip */}
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                    isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-800 text-white'
                  } shadow-lg z-50`}>
                    <Icon 
                      name={event.type === 'letter' ? 'letter' : event.type === 'photo' ? 'photo' : event.type === 'trip' ? 'trip' : 'calendar'} 
                      className="text-blue-600 dark:text-blue-400 mr-2" 
                      size={20}
                    />
                    {event.title}
                    <div className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent ${
                      isDarkMode ? 'border-t-gray-700' : 'border-t-gray-800'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Labels de años */}
          <div className="flex justify-between text-xs">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {minYear}
            </span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              {maxYear}
            </span>
          </div>
        </div>
      </div>

      <EventModal 
        event={selectedEvent} 
        onClose={() => setSelectedEvent(null)}
        allEvents={events}
        onNavigateToEvent={(event) => {
          setSelectedEvent(event);
          // Scroll al evento
          const year = event.date.getFullYear();
          const x = ((year - minYear) / yearRange) * 100;
          const scrollContainer = document.querySelector('.overflow-x-auto') as HTMLElement;
          if (scrollContainer) {
            const targetX = (scrollContainer.scrollWidth * x) / 100;
            scrollContainer.scrollTo({ left: targetX - scrollContainer.clientWidth / 2, behavior: 'smooth' });
          }
        }}
      />
    </div>
  );
}
