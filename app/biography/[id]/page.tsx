'use client';

import { use, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { loadBiography } from '@/lib/storage/indexed-db';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import Timeline from '@/components/visualizations/Timeline/Timeline';
import NetworkView from '@/components/visualizations/Network/NetworkView';
import { createTimelineEvents } from '@/lib/utils/timeline-helpers';
import { TimelineEvent, BiographyBasics, Photo, Letter, Trip } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// Dynamic import para MapView (CRÍTICO para Leaflet - no funciona en SSR)
// El componente de loading se define dentro del componente para tener acceso a t()

interface BiographyData {
  basics: BiographyBasics;
  photos: Photo[];
  letters: Letter[];
  trips: Trip[];
}

export default function BiographyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const { t } = useLanguage();
  
  // Dynamic import para MapView (debe estar dentro del componente para tener acceso a t)
  const MapView = dynamic(() => import('@/components/visualizations/Map/MapView'), {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('map.loading')}</p>
        </div>
      </div>
    ),
  });
  
  const [activeView, setActiveView] = useState<'timeline' | 'map' | 'network'>('timeline');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('biographyviz_dark_mode');
      return saved !== null ? saved === 'true' : true;  // true por default
    }
    return true;
  });
  const [biographyData, setBiographyData] = useState<BiographyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Guardar preferencia de dark mode en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('biographyviz_dark_mode', isDarkMode.toString());
    }
  }, [isDarkMode]);

  useEffect(() => {
    const loadData = async () => {
      console.log('[Biography] Loading data for id:', unwrappedParams.id);
      const data = await loadBiography(unwrappedParams.id);

      if (data) {
        console.log('[Biography] Data loaded:', {
          hasBasics: !!data.basics,
          lettersCount: data.letters?.length ?? 0,
          photosCount: data.photos?.length ?? 0,
          tripsCount: data.trips?.length ?? 0,
        });
        if (data.trips?.length) {
          console.log('[Biography] Trips:', data.trips.slice(0, 5).map((t: any) => ({
            startDate: t.startDate,
            endDate: t.endDate,
            destination: t.destination,
          })));
        }
        // ✅ Asegurar que exista el objeto basics
        if (!data.basics) {
          data.basics = {
            firstName: 'Biografía',
            lastName: 'Importada',
            birthYear: 1900,
            shortBio: 'Biografía creada mediante importación de CSV',
          };
        }
        
        // ✅ Asegurar campos requeridos
        if (!data.basics.firstName) data.basics.firstName = 'Sin';
        if (!data.basics.lastName) data.basics.lastName = 'Nombre';
        if (!data.basics.birthYear) data.basics.birthYear = 1900;
        
        // ✅ Asegurar que existan arrays vacíos si no están presentes
        if (!data.photos) data.photos = [];
        if (!data.letters) data.letters = [];
        if (!data.trips) data.trips = [];
        
        try {
          setBiographyData(data);
        } catch (error) {
          console.error('Error loading biography data:', error);
          router.push('/upload/basic');
        }
      } else {
        router.push('/upload/basic');
      }
      
      setIsLoading(false);
    };

    loadData();
  }, [unwrappedParams.id, router]);

  const events: TimelineEvent[] = useMemo(() => {
    if (!biographyData) return [];
    return createTimelineEvents(
      biographyData.basics,
      biographyData.photos,
      biographyData.letters,
      biographyData.trips,
      t // Pasar función de traducción
    );
  }, [biographyData, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!biographyData) {
    return null;
  }

  const { basics: bio } = biographyData;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header compacto */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Info básica compacta */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-3">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  {bio.firstName} {bio.lastName}
                </h1>
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  {bio.birthYear}{bio.deathYear ? ` - ${bio.deathYear}` : ''}
                </span>
                <div className="hidden md:flex items-center gap-3 text-xs text-gray-500">
                  <span>📷 {biographyData.photos.length}</span>
                  <span>✉️ {biographyData.letters.length}</span>
                  <span>✈️ {biographyData.trips.length}</span>
                </div>
              </div>
              {bio.shortBio && (
                <p className="text-sm text-gray-600 truncate mt-0.5">
                  {bio.shortBio}
                </p>
              )}
            </div>
            
            {/* Controles */}
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex gap-1">
                <Button
                  variant={activeView === 'timeline' ? 'default' : 'outline'}
                  onClick={() => setActiveView('timeline')}
                  size="sm"
                >
                  {t('nav.timeline')}
                </Button>
                <Button
                  variant={activeView === 'map' ? 'default' : 'outline'}
                  onClick={() => setActiveView('map')}
                  size="sm"
                >
                  {t('nav.map')}
                </Button>
                <Button
                  variant={activeView === 'network' ? 'default' : 'outline'}
                  onClick={() => setActiveView('network')}
                  size="sm"
                >
                  {t('nav.network')}
                </Button>
                <button
                  onClick={() => router.push(`/biography/${unwrappedParams.id}/analytics`)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {t('nav.analytics')}
                </button>
              </div>

              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Dark Mode Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="ml-2"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </Button>
              
              {/* Create Another */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/upload/basic')}
                className="whitespace-nowrap"
              >
                + {t('common.continue')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content - ocupa todo el espacio restante */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'timeline' && (
          <Timeline 
            events={events} 
            isDarkMode={isDarkMode}
          />
        )}
        
        {activeView === 'map' && (
          <MapView 
            key="map-view" // Key estable para evitar recreación
            events={events} 
            isDarkMode={isDarkMode}
          />
        )}
        
        {activeView === 'network' && (
          <div className="h-full w-full">
            <NetworkView 
              events={events} 
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </div>
    </div>
  );
}