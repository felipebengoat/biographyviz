'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TimelineEvent } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { DualRangeSlider } from '@/components/ui/DualRangeSlider';
import { Icons, Icon } from '@/lib/icons';
import React from 'react';

// Fix para iconos de Leaflet en Next.js - CRÍTICO
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  events: TimelineEvent[];
  isDarkMode: boolean;
}

interface GeocodedEvent extends TimelineEvent {
  coordinates?: [number, number];
  locationLabel?: string;
  isOrigin?: boolean;
  isDestination?: boolean;
  originCoords?: [number, number];
}

// Diccionario de lugares comunes (offline, rápido)
const LOCATION_COORDINATES: Record<string, [number, number]> = {
  // Lugares de Luis Mitrovic (alta prioridad)
  'Vienna': [48.2082, 16.3738],
  'Viena': [48.2082, 16.3738],
  'Wien': [48.2082, 16.3738],
  'Santiago': [-33.4489, -70.6693],
  'Santiago de Chile': [-33.4489, -70.6693],
  'Chile': [-35.6751, -71.5430],
  'Afghanistan': [33.9391, 67.7100],
  'Afganistán': [33.9391, 67.7100],
  'Iran': [32.4279, 53.6880],
  'Irán': [32.4279, 53.6880],
  'Lebanon': [33.8547, 35.8623],
  'Líbano': [33.8547, 35.8623],
  'Washington': [38.9072, -77.0369],
  'Washington D.C.': [38.9072, -77.0369],
  'Italy': [41.8719, 12.5674],
  'Italia': [41.8719, 12.5674],
  'England': [52.3555, -1.1743],
  'Inglaterra': [52.3555, -1.1743],
  'Spain': [40.4637, -3.7492],
  'España': [40.4637, -3.7492],
  'France': [46.2276, 2.2137],
  'Francia': [46.2276, 2.2137],
  'Europe': [50.0, 10.0],
  'Europa': [50.0, 10.0],
  'Bremen': [53.0793, 8.8017],
  'Dalmatia': [43.5, 16.5],
  'Dalmacia': [43.5, 16.5],
  'Zurich': [47.3769, 8.5417],
  'Zúrich': [47.3769, 8.5417],
  'Talcahuano': [-36.7249, -73.1169],
  
  // Ciudades europeas comunes
  'Paris': [48.8566, 2.3522],
  'París': [48.8566, 2.3522],
  'London': [51.5074, -0.1278],
  'Londres': [51.5074, -0.1278],
  'Rome': [41.9028, 12.4964],
  'Roma': [41.9028, 12.4964],
  'Berlin': [52.5200, 13.4050],
  'Berlín': [52.5200, 13.4050],
  'Madrid': [40.4168, -3.7038],
  'Barcelona': [41.3851, 2.1734],
  'Amsterdam': [52.3676, 4.9041],
  'Brussels': [50.8503, 4.3517],
  'Bruselas': [50.8503, 4.3517],
  
  // Américas
  'Buenos Aires': [-34.6037, -58.3816],
  'Lima': [-12.0464, -77.0428],
  'Bogotá': [4.7110, -74.0721],
  'Mexico City': [19.4326, -99.1332],
  'Ciudad de México': [19.4326, -99.1332],
  'New York': [40.7128, -74.0060],
  'Nueva York': [40.7128, -74.0060],
  'Los Angeles': [34.0522, -118.2437],
  'San Francisco': [37.7749, -122.4194],
  'Chicago': [41.8781, -87.6298],
  'Miami': [25.7617, -80.1918],
  'Valparaíso': [-33.0472, -71.6127],
  'Concepción': [-36.8201, -73.0444],
  
  // Asia
  'Tokyo': [35.6762, 139.6503],
  'Tokio': [35.6762, 139.6503],
  'Beijing': [39.9042, 116.4074],
  'Pekín': [39.9042, 116.4074],
  'Shanghai': [31.2304, 121.4737],
  'Hong Kong': [22.3193, 114.1694],
  'Singapore': [1.3521, 103.8198],
  'Singapur': [1.3521, 103.8198],
  'Delhi': [28.7041, 77.1025],
  'Mumbai': [19.0760, 72.8777],
  'Bangkok': [13.7563, 100.5018],
  'Seoul': [37.5665, 126.9780],
  'Seúl': [37.5665, 126.9780],
  
  // Medio Oriente
  'Dubai': [25.2048, 55.2708],
  'Tehran': [35.6892, 51.3890],
  'Teherán': [35.6892, 51.3890],
  // Lugares de Irán (corregir Bandar)
  'Bandar': [27.1832, 56.2808],  // Bandar Abbas, Iran
  'Bandar Abbas': [27.1832, 56.2808],
  'Bandar, Iran': [27.1832, 56.2808],
  'Bandar-e Abbas': [27.1832, 56.2808],
  'Isfahan': [32.6546, 51.6680],
  'Isfahán': [32.6546, 51.6680],
  'Shiraz': [29.5918, 52.5836],
  'Mashhad': [36.2974, 59.6067],
  'Tabriz': [38.0800, 46.2919],
  'Istanbul': [41.0082, 28.9784],
  'Estambul': [41.0082, 28.9784],
  'Jerusalem': [31.7683, 35.2137],
  'Jerusalén': [31.7683, 35.2137],
  'Cairo': [30.0444, 31.2357],
  'El Cairo': [30.0444, 31.2357],
  'Beirut': [33.8938, 35.5018],
  'Kabul': [34.5553, 69.2075],
  
  // África
  'Johannesburg': [-26.2041, 28.0473],
  'Cape Town': [-33.9249, 18.4241],
  'Ciudad del Cabo': [-33.9249, 18.4241],
  'Nairobi': [-1.2864, 36.8172],
  
  // Oceanía
  'Sydney': [-33.8688, 151.2093],
  'Sídney': [-33.8688, 151.2093],
  'Melbourne': [-37.8136, 144.9631],
  'Auckland': [-36.8485, 174.7633],
  'New Zealand': [-40.9006, 174.8860],
  'Nueva Zelanda': [-40.9006, 174.8860],
  'Australia': [-25.2744, 133.7751],
};

// Geocoding cache en localStorage
const GEOCODING_CACHE_KEY = 'geocoding_cache';

async function getGeocodingCache(): Promise<Record<string, [number, number]>> {
  try {
    const stored = localStorage.getItem(GEOCODING_CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

async function setGeocodingCache(cache: Record<string, [number, number]>) {
  try {
    localStorage.setItem(GEOCODING_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Error saving geocoding cache:', e);
  }
}

// Geocodificar usando Nominatim (OpenStreetMap) - GRATIS
async function geocodeLocation(location: string): Promise<[number, number] | null> {
  try {
    // Rate limiting: esperar 1 segundo entre requests (requisito de Nominatim)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'BiographyViz/1.0' // Nominatim REQUIERE User-Agent
        }
      }
    );
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      return [lat, lon];
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error for', location, error);
    return null;
  }
}

// Componente para ajustar el mapa a los marcadores
function FitBounds({ coordinates }: { coordinates: [number, number][] }) {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [coordinates, map]);
  
  return null;
}

// Componente para capturar la instancia del mapa y actualizar estilos
function MapInstanceHandler({ 
  mapRef, 
  isDarkMode 
}: { 
  mapRef: React.MutableRefObject<L.Map | null>;
  isDarkMode: boolean;
}) {
  const map = useMap();
  
  // Guardar referencia del mapa
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  
  // Actualizar estilos cuando cambia dark mode (sin recrear el mapa)
  useEffect(() => {
    const container = map.getContainer();
    if (container) {
      if (isDarkMode) {
        container.classList.add('dark');
        // Aplicar filtro a tiles para oscurecer
        const tiles = container.querySelectorAll('.leaflet-tile-container img');
        tiles.forEach((img: any) => {
          img.style.filter = 'brightness(0.7) contrast(1.1)';
        });
      } else {
        container.classList.remove('dark');
        // Remover filtros
        const tiles = container.querySelectorAll('.leaflet-tile-container img');
        tiles.forEach((img: any) => {
          img.style.filter = '';
        });
      }
    }
  }, [isDarkMode, map]);
  
  return null;
}

export default function MapView({ events, isDarkMode }: MapViewProps) {
  const { t } = useLanguage();
  const [geocodedEvents, setGeocodedEvents] = useState<GeocodedEvent[]>([]);
  const [filters, setFilters] = useState({
    showLetters: true,
    showPhotos: true,
    showTrips: true,
    showTravelRoutes: true,
  });
  const [selectedEvent, setSelectedEvent] = useState<GeocodedEvent | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });
  const selectedEventRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null); // Ref para mantener referencia del mapa
  
  // Estado para el rango de años
  const [yearRange, setYearRange] = useState<[number, number]>([1900, 2030]);
  const [minYear, setMinYear] = useState(1900);
  const [maxYear, setMaxYear] = useState(2030);

  // Geocodificar eventos con sistema híbrido (diccionario + API + cache)
  useEffect(() => {
    const geocodeEvents = async () => {
      console.log('🗺️ === INICIO GEOCODING ===');
      console.log('Total eventos recibidos:', events.length);
      console.log('Eventos por tipo:', {
        letters: events.filter(e => e.type === 'letter').length,
        photos: events.filter(e => e.type === 'photo').length,
        trips: events.filter(e => e.type === 'trip').length,
      });
      
      // EXPANDIR ESTRUCTURA COMPLETA
      const sampleLetter = events.find(e => e.type === 'letter');
      const samplePhoto = events.find(e => e.type === 'photo');
      const sampleTrip = events.find(e => e.type === 'trip');

      console.log('📧 ESTRUCTURA COMPLETA DE CARTA:', {
        ...sampleLetter,
        data: sampleLetter?.data,
      });

      console.log('📷 ESTRUCTURA COMPLETA DE FOTO:', {
        ...samplePhoto,
        data: samplePhoto?.data,
      });

      console.log('✈️ ESTRUCTURA COMPLETA DE VIAJE:', {
        ...sampleTrip,
        data: sampleTrip?.data,
      });
      
      const cache = await getGeocodingCache();
      let cacheUpdated = false;
      
      const eventsWithCoords: GeocodedEvent[] = [];
      const totalEvents = events.length;
      
      // Helper function para obtener coordenadas
      const getCoordinates = async (location: string): Promise<[number, number] | null> => {
        if (!location) return null;
        
        // 1. Diccionario
        let coords = LOCATION_COORDINATES[location] || LOCATION_COORDINATES[location.trim()];
        
        // 2. Cache
        if (!coords && cache[location]) {
          coords = cache[location];
        }
        
        // 3. Búsqueda parcial en diccionario
        if (!coords) {
          const partialMatch = Object.entries(LOCATION_COORDINATES).find(([key]) => 
            location.toLowerCase().includes(key.toLowerCase()) ||
            key.toLowerCase().includes(location.toLowerCase())
          );
          if (partialMatch) coords = partialMatch[1];
        }
        
        // 4. API (solo si no está en diccionario ni caché)
        if (!coords) {
          console.log(`Geocoding "${location}" via Nominatim...`);
          coords = await geocodeLocation(location);
          
          if (coords) {
            // Validar que las coordenadas tengan sentido
            const [lat, lon] = coords;
            
            // Verificar que están dentro de rangos válidos
            if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
              console.warn(`⚠️ Coordenadas inválidas para "${location}": [${lat}, ${lon}]`);
              return null;
            }
            
            console.log(`✅ Geocodificado "${location}": [${lat}, ${lon}]`);
            cache[location] = coords;
            cacheUpdated = true;
          }
        }
        
        return coords;
      };
      
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        setGeocodingProgress({ current: i + 1, total: totalEvents });
        
        if (event.type === 'letter') {
          const eventData = event.data as any;
          
          // Obtener placeFrom y placeTo
          const placeFrom = eventData?.placeFrom;
          const placeTo = eventData?.placeTo;
          
          console.log(`📧 "${event.title}":`, { placeFrom, placeTo });
          
          // Geocodificar ORIGEN
          if (placeFrom) {
            const coordsFrom = await getCoordinates(placeFrom);
            if (coordsFrom) {
              eventsWithCoords.push({
                ...event,
                coordinates: coordsFrom,
                locationLabel: placeFrom,
                isOrigin: true,
              });
              console.log(`  ✅ Origen: ${placeFrom}`);
            }
          }
          
          // Geocodificar DESTINO (si es diferente del origen)
          if (placeTo && placeTo !== placeFrom) {
            const coordsTo = await getCoordinates(placeTo);
            const coordsFrom = placeFrom ? await getCoordinates(placeFrom) : null;
            
            if (coordsTo) {
              eventsWithCoords.push({
                ...event,
                coordinates: coordsTo,
                locationLabel: placeTo,
                isDestination: true,
                originCoords: coordsFrom || undefined,
              });
              console.log(`  ✅ Destino: ${placeTo}`);
            }
          }
          
          // Si origen y destino son iguales, solo crear un marcador
          if (placeFrom && placeTo && placeFrom === placeTo) {
            console.log(`  ℹ️ Origen y destino son iguales: ${placeFrom}`);
          }
          
        } else if (event.type === 'photo') {
          const eventData = event.data as any;
          
          // PROBAR TODOS LOS POSIBLES CAMPOS DE UBICACIÓN
          const possibleLocations = [
            eventData?.location,
            eventData?.place,
            eventData?.lugar,
            event.location,
          ].filter(Boolean);
          
          console.log(`📷 Foto "${event.title}":`, {
            possibleLocations,
            eventData: eventData,
          });
          
          const location = possibleLocations[0];
          if (location) {
            const coords = await getCoordinates(location);
            if (coords) {
              eventsWithCoords.push({
                ...event,
                coordinates: coords,
                locationLabel: location,
              });
              console.log(`  ✅ Foto geocodificada: ${location}`);
            } else {
              console.log(`  ❌ No se pudo geocodificar foto: ${location}`);
            }
          } else {
            console.log(`  ⚠️ Foto sin campo de ubicación`);
          }
          
        } else if (event.type === 'trip') {
          // VIAJES: usar destination
          const destination = (event.data as any)?.destination || event.location;
          
          if (destination) {
            const coords = await getCoordinates(destination);
            if (coords) {
              eventsWithCoords.push({
                ...event,
                coordinates: coords,
                locationLabel: destination,
              });
            }
          }
        }
      }
      
      // Guardar caché actualizado
      if (cacheUpdated) {
        await setGeocodingCache(cache);
      }
      
      console.log(`✅ Geocodificados ${eventsWithCoords.length} eventos de ${totalEvents} totales`);
      console.log('Cartas:', eventsWithCoords.filter(e => e.type === 'letter').length);
      console.log('Fotos:', eventsWithCoords.filter(e => e.type === 'photo').length);
      console.log('Viajes:', eventsWithCoords.filter(e => e.type === 'trip').length);
      
      setGeocodedEvents(eventsWithCoords);
      setMapReady(true);
    };
    
    if (events.length > 0) {
      geocodeEvents();
    } else {
      setMapReady(true);
    }
  }, [events]); // ✅ Solo depende de events, NO de isDarkMode

  // NOTA: El efecto de dark mode ahora se maneja dentro de MapInstanceHandler
  // para evitar recrear el mapa completo

  // Scroll automático cuando se selecciona un evento
  useEffect(() => {
    if (selectedEvent && selectedEventRef.current) {
      selectedEventRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedEvent]);

  // Calcular rango de años de los eventos
  useEffect(() => {
    if (events.length === 0) return;
    
    const years = events
      .map(e => e.date.getFullYear())
      .filter(y => !isNaN(y));
    
    if (years.length > 0) {
      const min = Math.min(...years);
      const max = Math.max(...years);
      setMinYear(min);
      setMaxYear(max);
      setYearRange([min, max]);
    }
  }, [events]);

  // Filtrar eventos (incluyendo filtro por año)
  const filteredEvents = useMemo(() => {
    return geocodedEvents.filter(event => {
      // Filtros existentes
      if (!event.coordinates) return false;
      if (event.type === 'letter' && !filters.showLetters) return false;
      if (event.type === 'photo' && !filters.showPhotos) return false;
      if (event.type === 'trip' && !filters.showTrips) return false;
      
      // NUEVO: Filtro por año
      const eventYear = event.date.getFullYear();
      if (eventYear < yearRange[0] || eventYear > yearRange[1]) return false;
      
      return true;
    });
  }, [geocodedEvents, filters, yearRange]);

  // Agrupar por ubicación (para marcadores con múltiples eventos)
  const groupedByLocation = filteredEvents.reduce((acc, event) => {
    if (!event.coordinates) return acc;
    const key = event.coordinates.join(',');
    if (!acc[key]) {
      acc[key] = {
        coordinates: event.coordinates,
        events: [],
      };
    }
    acc[key].events.push(event);
    return acc;
  }, {} as Record<string, { coordinates: [number, number]; events: GeocodedEvent[] }>);

  // Crear rutas de viaje (conectar eventos cronológicamente)
  const travelRoutes = filters.showTravelRoutes
    ? filteredEvents
        .filter(e => e.type === 'trip' && e.coordinates)
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map(e => e.coordinates!)
    : [];

  // Obtener coordenadas para centrar el mapa
  const allCoordinates = filteredEvents
    .filter(e => e.coordinates)
    .map(e => e.coordinates!);

  // Iconos personalizados por tipo de evento usando SVG
  const createCustomIcon = (type: string, count: number) => {
    const iconConfigs: Record<string, { Icon: any; color: string; bgColor: string; shape: string }> = {
      letter: { 
        Icon: Icons.letter, 
        color: '#3b82f6', 
        bgColor: '#dbeafe',
        shape: 'circle' 
      },
      photo: { 
        Icon: Icons.photo, 
        color: '#a855f7', 
        bgColor: '#f3e8ff',
        shape: 'square' 
      },
      trip: { 
        Icon: Icons.trip, 
        color: '#f97316', 
        bgColor: '#fed7aa',
        shape: 'diamond' 
      },
    };
    
    const config = iconConfigs[type] || iconConfigs.letter;
    const { Icon: LucideIcon, color, bgColor, shape } = config;
    
    const size = count > 1 ? 36 : 28;
    const iconSize = count > 1 ? 16 : 14;
    
    // Si hay múltiples eventos, mostrar solo el número
    if (count > 1) {
      return L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: ${bgColor};
            border: 2px solid ${color};
            border-radius: ${shape === 'circle' ? '50%' : '4px'};
            ${shape === 'diamond' ? 'transform: rotate(45deg);' : ''}
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            font-weight: bold;
            font-size: 12px;
            color: ${color};
          ">
            <div style="${shape === 'diamond' ? 'transform: rotate(-45deg);' : ''}">
              ${count}
            </div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }
    
    // Crear icono SVG usando paths de Lucide React
    // Los iconos de Lucide tienen viewBox="0 0 24 24" por defecto
    const iconSvgPaths: Record<string, string> = {
      letter: `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><polyline points="22,6 12,13 2,6" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      photo: `<rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.5" fill="${color}"/><polyline points="21 15 16 10 5 21" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
      trip: `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="3" stroke="${color}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    };
    
    const svgPath = iconSvgPaths[type] || iconSvgPaths.letter;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${bgColor};
          border: 2px solid ${color};
          border-radius: ${shape === 'circle' ? '50%' : '4px'};
          ${shape === 'diamond' ? 'transform: rotate(45deg);' : ''}
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          <div style="${shape === 'diamond' ? 'transform: rotate(-45deg);' : ''}">
            <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
              ${svgPath}
            </svg>
          </div>
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Loading state con progreso
  if (!mapReady) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">{t('common.loading')}</p>
          {geocodingProgress.total > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {t('map.geocoding')}: {geocodingProgress.current}/{geocodingProgress.total}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Calcular centro y zoom del mapa
  const mapCenter: [number, number] = allCoordinates.length > 0 
    ? allCoordinates[0] 
    : [-33.4489, -70.6693]; // Santiago como default

  const mapZoom = allCoordinates.length > 0 ? 2 : 4;

  return (
    <div className="h-full flex flex-col">
      {/* NUEVO: Year range slider */}
      <div className="bg-white dark:bg-gray-900 border-b dark:border-gray-700 shadow-sm z-[1000]">
        <DualRangeSlider
          min={minYear}
          max={maxYear}
          value={yearRange}
          onChange={setYearRange}
          step={1}
          label={t('wizard.yearRange')}
        />
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar con filtros */}
        <div className="w-80 bg-white dark:bg-gray-900 border-r dark:border-gray-700 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            {t('map.title')}
          </h2>

          {/* Sección de Filtros */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
              {t('map.filters')}
            </h3>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showLetters}
                  onChange={(e) => setFilters({ ...filters, showLetters: e.target.checked })}
                  className="rounded"
                />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Icons.letter className="w-4 h-4" /> {t('map.showLetters')}
              </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showPhotos}
                  onChange={(e) => setFilters({ ...filters, showPhotos: e.target.checked })}
                  className="rounded"
                />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Icons.photo className="w-4 h-4" /> {t('map.showPhotos')}
              </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showTrips}
                  onChange={(e) => setFilters({ ...filters, showTrips: e.target.checked })}
                  className="rounded"
                />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Icons.trip className="w-4 h-4" /> {t('map.showTrips')}
              </span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showTravelRoutes}
                  onChange={(e) => setFilters({ ...filters, showTravelRoutes: e.target.checked })}
                  className="rounded"
                />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Icons.map className="w-4 h-4" /> {t('map.showRoutes')}
              </span>
              </label>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white text-sm">
              {t('map.stats')}
            </h3>
            <div className="space-y-1 text-xs">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">{t('map.eventsMapped')}:</span> {filteredEvents.length}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">{t('map.uniqueLocations')}:</span> {Object.keys(groupedByLocation).length}
              </p>
            </div>
          </div>

          {/* Evento seleccionado */}
          {selectedEvent && (
            <div 
              ref={selectedEventRef}
              className="border-t pt-4 mt-4 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {t('map.selectedEvent')}
                </h4>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              {/* Contenido del evento - MEJORAR CONTRASTE */}
              <div className="text-sm space-y-2">
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Icon 
                    name={selectedEvent.type === 'letter' ? 'letter' : selectedEvent.type === 'photo' ? 'photo' : selectedEvent.type === 'trip' ? 'trip' : 'calendar'} 
                    className="text-blue-600 dark:text-blue-400" 
                    size={20}
                  />
                  {selectedEvent.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Icons.calendar className="w-3 h-3" /> {selectedEvent.date.toLocaleDateString()}
                </p>
                
                {selectedEvent.type === 'letter' && (
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-3 rounded">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('timeline.sender')}:</p>
                        <p className="text-gray-600 dark:text-gray-400">{(selectedEvent.data as any)?.sender || (selectedEvent.data as any)?.personFrom || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">{t('timeline.recipient')}:</p>
                        <p className="text-gray-600 dark:text-gray-400">{(selectedEvent.data as any)?.recipient || (selectedEvent.data as any)?.personTo || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-2 dark:border-gray-600">
                      {(selectedEvent.data as any)?.placeFrom && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                          <span className="font-medium flex items-center gap-1"><Icons.place className="w-3 h-3" /> {t('map.origin')}:</span> {(selectedEvent.data as any).placeFrom}
                        </p>
                      )}
                      {(selectedEvent.data as any)?.placeTo && (
                        <p className="text-xs text-purple-600 dark:text-purple-400">
                          <span className="font-medium flex items-center gap-1"><Icons.place className="w-3 h-3" /> {t('map.destination')}:</span> {(selectedEvent.data as any).placeTo}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Contenido con mejor contraste */}
                {selectedEvent.content && (
                  <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded max-h-48 overflow-y-auto">
                    <p className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {selectedEvent.content.substring(0, 500)}
                      {selectedEvent.content.length > 500 && '...'}
                    </p>
                  </div>
                )}
                
                {/* Personas mencionadas */}
                {(selectedEvent.data as any)?.mentionedPeople && (selectedEvent.data as any).mentionedPeople.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 text-xs mb-1">{t('analytics.mentionedPeople')}:</p>
                    <div className="flex flex-wrap gap-1">
                      {(selectedEvent.data as any).mentionedPeople.map((person: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                          {person}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Lugares mencionados */}
                {(selectedEvent.data as any)?.mentionedPlaces && (selectedEvent.data as any).mentionedPlaces.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300 text-xs mb-1">{t('analytics.mentionedPlaces')}:</p>
                    <div className="flex flex-wrap gap-1">
                      {(selectedEvent.data as any).mentionedPlaces.map((place: string, idx: number) => (
                        <span key={idx} className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                          {place}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Map container */}
        <div className="flex-1 relative">
          {filteredEvents.length === 0 && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-yellow-100 dark:bg-yellow-900 px-4 py-2 rounded-lg shadow-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {t('map.adjustFilters')}
              </p>
            </div>
          )}
          
          <MapContainer
            key="map-container" // Key estable para evitar recreación
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            {/* Handler para capturar instancia del mapa y actualizar dark mode */}
            <MapInstanceHandler mapRef={mapRef} isDarkMode={isDarkMode} />
            
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {allCoordinates.length > 0 && (
              <FitBounds coordinates={allCoordinates} />
            )}

            {/* Rutas de viaje */}
            {travelRoutes.length > 1 && (
              <Polyline
                positions={travelRoutes}
                color="#f97316"
                weight={2}
                opacity={0.6}
                dashArray="5, 10"
              />
            )}

            {/* Líneas origen-destino de cartas */}
            {filteredEvents
              .filter(e => e.type === 'letter' && e.isDestination && e.originCoords)
              .map((event, idx) => (
                <Polyline
                  key={`letter-route-${idx}`}
                  positions={[event.originCoords!, event.coordinates!]}
                  color="#3b82f6"
                  weight={1.5}
                  opacity={0.5}
                  dashArray="3, 6"
                />
              ))}

            {/* Marcadores agrupados */}
            {Object.entries(groupedByLocation).map(([key, { coordinates, events }]) => {
              const mainEvent = events[0];
              
              return (
                <Marker
                  key={key}
                  position={coordinates}
                  icon={createCustomIcon(mainEvent.type, events.length)}
                  eventHandlers={{
                    click: () => setSelectedEvent(mainEvent),
                  }}
                >
                  <Popup maxWidth={400}>
                    <div className="min-w-[250px] max-w-[400px]">
                      <h3 className="font-bold mb-2 text-base text-gray-900 dark:text-white">{mainEvent.locationLabel || mainEvent.location || 'Ubicación'}</h3>
                      <div className="space-y-3">
                        {events.slice(0, 3).map((event, idx) => (
                          <div key={idx} className="text-sm border-b pb-2 last:border-b-0 border-gray-200 dark:border-gray-700">
                            <p className="font-medium text-base mb-1 text-gray-900 dark:text-white flex items-center gap-2">
                              <Icon 
                                name={event.type === 'letter' ? 'letter' : event.type === 'photo' ? 'photo' : event.type === 'trip' ? 'trip' : 'calendar'} 
                                className="text-blue-600 dark:text-blue-400" 
                                size={18}
                              />
                              {event.title}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 text-xs mb-1 flex items-center gap-1">
                              <Icons.calendar className="w-3 h-3" /> {event.date.toLocaleDateString()}
                            </p>
                            
                            {/* Mostrar origen y destino para cartas */}
                            {event.type === 'letter' && (
                              <div className="text-xs space-y-1 mb-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                {(event.data as any)?.sender && (
                                  <p className="text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">{t('map.from')}:</span> {(event.data as any).sender}
                                  </p>
                                )}
                                {(event.data as any)?.placeFrom && (
                                  <p className="text-blue-600 dark:text-blue-400">
                                    <span className="font-medium flex items-center gap-1"><Icons.place className="w-3 h-3" /> {t('map.origin')}:</span> {(event.data as any).placeFrom}
                                  </p>
                                )}
                                {(event.data as any)?.recipient && (
                                  <p className="text-gray-700 dark:text-gray-300">
                                    <span className="font-medium">{t('map.to')}:</span> {(event.data as any).recipient}
                                  </p>
                                )}
                                {(event.data as any)?.placeTo && (
                                  <p className="text-purple-600 dark:text-purple-400">
                                    <span className="font-medium flex items-center gap-1"><Icons.place className="w-3 h-3" /> {t('map.destination')}:</span> {(event.data as any).placeTo}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Preview del contenido */}
                            {event.content && (
                              <p className="text-gray-700 dark:text-gray-300 text-xs mt-1 line-clamp-2">
                                {event.content}
                              </p>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                              }}
                              className="text-blue-600 dark:text-blue-400 text-xs mt-1 hover:underline font-medium"
                            >
                              {t('map.viewDetails')}
                            </button>
                          </div>
                        ))}
                        {events.length > 3 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            +{events.length - 3} eventos más
                          </p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })} 
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
