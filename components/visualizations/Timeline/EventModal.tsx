'use client';

import { TimelineEvent } from '@/lib/types';
import { Icon } from '@/lib/icons';
import { useEffect, useMemo, useState } from 'react';

interface EventModalProps {
  event: TimelineEvent | null;
  onClose: () => void;
  allEvents?: TimelineEvent[];
  onNavigateToEvent?: (event: TimelineEvent) => void;
}

export default function EventModal({ event, onClose, allEvents = [], onNavigateToEvent }: EventModalProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [event]);

  // Reset selected tag when event changes
  useEffect(() => {
    setSelectedTag(null);
  }, [event]);

  // Encontrar eventos relacionados
  const relatedEvents = useMemo(() => {
    if (!event) return { sameYear: [], samePeriod: [], sameType: [] };
    
    const year = event.date.getFullYear();
    const decade = Math.floor(year / 10) * 10;
    
    return {
      // Mismo año
      sameYear: allEvents.filter(e => 
        e.id !== event.id && 
        e.date.getFullYear() === year
      ).slice(0, 6),
      
      // Misma década (±5 años)
      samePeriod: allEvents.filter(e => 
        e.id !== event.id && 
        Math.abs(e.date.getFullYear() - year) <= 5 &&
        e.date.getFullYear() !== year
      ).slice(0, 6),
      
      // Mismo tipo
      sameType: allEvents.filter(e => 
        e.id !== event.id && 
        e.type === event.type &&
        Math.abs(e.date.getFullYear() - year) > 5
      ).slice(0, 6),
    };
  }, [event, allEvents]);

  const handleNavigate = (targetEvent: TimelineEvent) => {
    if (onNavigateToEvent) {
      onNavigateToEvent(targetEvent);
    }
  };

  if (!event) return null;

  const isPhoto = event.type === 'photo' && event.data && 'preview' in event.data;
  const isLetter = event.type === 'letter';
  const isTrip = event.type === 'trip';

  const typeColors: Record<string, string> = {
    photo: 'border-purple-500 bg-purple-50 dark:bg-purple-950',
    letter: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
    trip: 'border-orange-500 bg-orange-50 dark:bg-orange-950',
    birth: 'border-green-500 bg-green-50 dark:bg-green-950',
    death: 'border-gray-500 bg-gray-50 dark:bg-gray-950',
  };

  const typeLabels: Record<string, string> = {
    photo: 'Photo',
    letter: 'Letter',
    trip: 'Trip',
    birth: 'Birth',
    death: 'Death',
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-start justify-between p-6 border-b-2 ${typeColors[event.type] || 'border-gray-500 bg-gray-50 dark:bg-gray-950'}`}>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Icon 
                name={event.type === 'letter' ? 'letter' : event.type === 'photo' ? 'photo' : event.type === 'trip' ? 'trip' : 'calendar'} 
                className="text-blue-600 dark:text-blue-400" 
                size={48}
              />
              <div>
                <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {typeLabels[event.type] || event.type}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {event.type === 'letter' && event.data && (event.data as any).sender && (event.data as any).recipient
                    ? `Carta de ${(event.data as any).sender} a ${(event.data as any).recipient}, ${event.date.getFullYear()}`
                    : event.title
                  }
                </h2>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {event.date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Contenido principal */}
          <div className="mb-6">
            {isPhoto && event.data && 'preview' in event.data && event.data.preview && (
              <div className="mb-4">
                <img 
                  src={event.data.preview} 
                  alt={event.title}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            )}
            
            {event.description && (
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Contenido de la carta */}
          {event.type === 'letter' && event.data && 'content' in event.data && (event.data as any).content && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                Contenido
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg max-h-96 overflow-y-auto">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {(event.data as any).content}
                </p>
              </div>
            </div>
          )}

          {/* Metadata de la carta */}
          {event.type === 'letter' && event.data && (
            <div className="mb-6 grid grid-cols-2 gap-4">
              {(event.data as any).personFrom && (event.data as any).personFrom !== 'Desconocido' && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">De:</p>
                  <p className="font-medium text-gray-900 dark:text-white">{(event.data as any).personFrom}</p>
                </div>
              )}
              
              {(event.data as any).personTo && (event.data as any).personTo !== 'Desconocido' && (
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Para:</p>
                  <p className="font-medium text-gray-900 dark:text-white">{(event.data as any).personTo}</p>
                </div>
              )}
            </div>
          )}

          {/* Personas mencionadas (NER) - CLICKEABLES */}
          {event.type === 'letter' && event.data && (event.data as any).mentionedPeople && Array.isArray((event.data as any).mentionedPeople) && (event.data as any).mentionedPeople.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Personas Mencionadas
              </h3>
              <div className="flex flex-wrap gap-2">
                {(event.data as any).mentionedPeople.map((person: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTag(selectedTag === person ? null : person)}
                    className={`px-3 py-1 text-sm rounded-full transition-all cursor-pointer ${
                      selectedTag === person
                        ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                        : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800'
                    }`}
                  >
                    {person}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lugares mencionados (NER) - CLICKEABLES */}
          {event.type === 'letter' && event.data && (event.data as any).mentionedPlaces && Array.isArray((event.data as any).mentionedPlaces) && (event.data as any).mentionedPlaces.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Lugares Mencionados
              </h3>
              <div className="flex flex-wrap gap-2">
                {(event.data as any).mentionedPlaces.map((place: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTag(selectedTag === place ? null : place)}
                    className={`px-3 py-1 text-sm rounded-full transition-all cursor-pointer ${
                      selectedTag === place
                        ? 'bg-green-600 text-white ring-2 ring-green-400'
                        : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                    }`}
                  >
                    {place}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Eventos históricos (NER) */}
          {event.type === 'letter' && event.data && (event.data as any).mentionedEvents && Array.isArray((event.data as any).mentionedEvents) && (event.data as any).mentionedEvents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Contexto Histórico
              </h3>
              <div className="space-y-2">
                {(event.data as any).mentionedEvents.map((histEvent: string, idx: number) => (
                  <div key={idx} className="px-3 py-2 text-sm rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                    {histEvent}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {(isLetter && event.data && 'location' in event.data) || (isTrip && event.data && 'destination' in event.data) ? (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Details</h3>
              <div className="space-y-2">
                {isLetter && event.data && 'location' in event.data && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{String((event.data as any).location || '')}</span>
                  </div>
                )}
                {isTrip && event.data && 'destination' in event.data && (
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700 dark:text-gray-300">{String((event.data as any).destination || '')}</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Eventos Relacionados */}
          <div className="space-y-6">
            {/* Mismo año */}
            {relatedEvents.sameYear.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Same Year ({event.date.getFullYear()})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {relatedEvents.sameYear.map(relEvent => (
                    <RelatedEventCard 
                      key={relEvent.id} 
                      event={relEvent} 
                      onClick={() => handleNavigate(relEvent)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Misma década */}
            {relatedEvents.samePeriod.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Around This Time (±5 years)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {relatedEvents.samePeriod.map(relEvent => (
                    <RelatedEventCard 
                      key={relEvent.id} 
                      event={relEvent} 
                      onClick={() => handleNavigate(relEvent)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Mismo tipo */}
            {relatedEvents.sameType.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  More {typeLabels[event.type] || event.type}s
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {relatedEvents.sameType.map(relEvent => (
                    <RelatedEventCard 
                      key={relEvent.id} 
                      event={relEvent} 
                      onClick={() => handleNavigate(relEvent)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No hay eventos relacionados */}
            {relatedEvents.sameYear.length === 0 && 
             relatedEvents.samePeriod.length === 0 && 
             relatedEvents.sameType.length === 0 && !selectedTag && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">No related events found</p>
              </div>
            )}

            {/* Eventos relacionados por tag seleccionado */}
            {selectedTag && allEvents && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Contenido relacionado con "{selectedTag}"
                  </h3>
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Limpiar filtro
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {allEvents
                    .filter(e => 
                      e.id !== event.id && 
                      (e.tags?.includes(selectedTag) || 
                       (e.data && typeof e.data === 'object' && 'content' in e.data && String((e.data as any).content || '').toLowerCase().includes(selectedTag.toLowerCase())) ||
                       (e.data && typeof e.data === 'object' && 'location' in e.data && String((e.data as any).location || '').toLowerCase().includes(selectedTag.toLowerCase())))
                    )
                    .slice(0, 9)
                    .map(relEvent => (
                      <RelatedEventCard 
                        key={relEvent.id} 
                        event={relEvent} 
                        onClick={() => {
                          setSelectedTag(null);
                          if (onNavigateToEvent) onNavigateToEvent(relEvent);
                        }}
                      />
                    ))
                  }
                </div>
                
                {allEvents.filter(e => 
                  e.id !== event.id && 
                  (e.tags?.includes(selectedTag) || 
                   (e.data && typeof e.data === 'object' && 'content' in e.data && String((e.data as any).content || '').toLowerCase().includes(selectedTag.toLowerCase())) ||
                   (e.data && typeof e.data === 'object' && 'location' in e.data && String((e.data as any).location || '').toLowerCase().includes(selectedTag.toLowerCase())))
                ).length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
                    No se encontraron eventos relacionados
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para tarjetas de eventos relacionados
function RelatedEventCard({ event, onClick }: { event: TimelineEvent; onClick: () => void }) {
  const isPhoto = event.type === 'photo' && event.data && 'preview' in event.data;
  
  const colors: Record<string, string> = {
    photo: 'border-purple-400 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950 dark:hover:bg-purple-900',
    letter: 'border-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900',
    trip: 'border-orange-400 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950 dark:hover:bg-orange-900',
    birth: 'border-green-400 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900',
    death: 'border-gray-400 bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900',
  };

  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-lg border-2 ${colors[event.type] || 'border-gray-400 bg-gray-50 hover:bg-gray-100 dark:bg-gray-950 dark:hover:bg-gray-900'} transition-all hover:scale-105 cursor-pointer`}
    >
      {isPhoto && event.data && 'preview' in event.data && event.data.preview ? (
        <div className="mb-2">
          <img 
            src={event.data.preview} 
            alt={event.title}
            className="w-full h-20 object-cover rounded"
          />
        </div>
      ) : (
        <div className="text-2xl mb-2">{event.icon}</div>
      )}
      <p className="text-xs font-medium text-gray-900 dark:text-white line-clamp-2">
        {event.title}
      </p>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {event.date.getFullYear()}
      </p>
    </button>
  );
}
