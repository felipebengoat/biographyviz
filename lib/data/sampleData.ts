import { TimelineEvent, Photo, Trip, Letter } from '@/lib/types';

// Tipo para datos de biografía
interface BiographyData {
  id: string;
  name: string;
  birthDate: Date;
  deathDate: Date;
  description: string;
  events: TimelineEvent[];
}

/**
 * Cargar datos de una biografía específica
 */
export async function loadBiographyData(biographyId: string): Promise<BiographyData> {
  // Por ahora solo tenemos datos de Luis Mitrovic
  if (biographyId === 'luis-mitrovic') {
    return loadLuisMitrovicData();
  }
  
  throw new Error(`Biography not found: ${biographyId}`);
}

/**
 * Cargar datos de Luis Mitrovic
 */
async function loadLuisMitrovicData(): Promise<BiographyData> {
  const [photos, trips, letters] = await Promise.all([
    loadPhotosData(),
    loadTripsData(),
    loadLettersData(),
  ]);

  const allEvents = [...photos, ...trips, ...letters].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  return {
    id: 'luis-mitrovic',
    name: 'Luis Mitrovic',
    birthDate: new Date('1911-11-07'),
    deathDate: new Date('2008-01-01'),
    description: 'Hijo de un inmigrante croata y una porteña, Luis Mitrovic Balbontín, fue un destacado arquitecto y fotógrafo chileno.',
    events: allEvents,
  };
}

/**
 * Cargar fotos desde CSV
 */
async function loadPhotosData(): Promise<TimelineEvent[]> {
  try {
    const response = await fetch('/data/photos-clean.csv');
    const text = await response.text();
    const lines = text.split('\n');
    
    const photoEvents: TimelineEvent[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const [nombre, anio, lugar, tags] = lines[i].split(',').map(s => s.trim());
      
      if (!anio || anio === 'Año') continue;
      
      const year = parseInt(anio);
      if (isNaN(year)) continue;
      
      photoEvents.push({
        id: `photo-${i}`,
        type: 'photo',
        icon: '📷',
        date: new Date(year, 0, 1),
        title: nombre || 'Fotografía sin título',
        description: `Fotografía tomada en ${lugar || 'ubicación desconocida'}`,
        color: '#8b5cf6',
        location: lugar || undefined,
        tags: tags ? tags.split(';').map(t => t.trim()) : undefined,
        data: {
          id: `photo-${i}`,
          preview: `/photos/${nombre}.jpg`, // Ruta placeholder
          title: nombre || 'Fotografía sin título',
          year: year,
          category: 'other',
        } as Photo,
      } as any);
    }
    
    console.log(`✅ Loaded ${photoEvents.length} photos from CSV`);
    return photoEvents;
    
  } catch (error) {
    console.error('Error loading photos:', error);
    return [];
  }
}

/**
 * Cargar viajes desde CSV
 */
async function loadTripsData(): Promise<TimelineEvent[]> {
  try {
    const response = await fetch('/data/trips-clean.csv');
    const text = await response.text();
    const lines = text.split('\n');
    
    const tripEvents: TimelineEvent[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const parts = lines[i].split(',').map(s => s.trim());
      
      if (parts.length < 3) continue;
      
      const [anio, lugar, fecha_llegada, fecha_partida, observaciones] = parts;
      
      if (!anio || anio === 'Año') continue;
      
      const year = parseInt(anio);
      if (isNaN(year)) continue;
      
      // Intentar parsear fecha de llegada
      let date = new Date(year, 0, 1);
      if (fecha_llegada) {
        try {
          // Formato esperado: "Enero 27" o fecha completa
          const monthMatch = fecha_llegada.match(/(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre)\s+(\d+)/i);
          if (monthMatch) {
            const months: { [key: string]: number } = {
              'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
              'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
            };
            const month = months[monthMatch[1].toLowerCase()];
            const day = parseInt(monthMatch[2]);
            date = new Date(year, month, day);
          }
        } catch (e) {
          // Usar fecha por defecto
        }
      }
      
      const title = lugar || 'Viaje sin destino';
      const content = observaciones || `Viaje a ${lugar}`;
      
      tripEvents.push({
        id: `trip-${i}`,
        type: 'trip',
        icon: '✈️',
        date: date,
        title: title,
        description: content,
        color: '#f59e0b',
        location: lugar || undefined,
        data: {
          destination: lugar,
          country: lugar,
          startDate: fecha_llegada || `${year}-01-01`,
          endDate: fecha_partida || undefined,
          notes: observaciones || undefined,
        } as Trip,
      } as any);
    }
    
    console.log(`✅ Loaded ${tripEvents.length} trips from CSV`);
    return tripEvents;
    
  } catch (error) {
    console.error('Error loading trips:', error);
    return [];
  }
}

/**
 * Cargar cartas desde CSV procesado con NER
 */
async function loadLettersData(): Promise<TimelineEvent[]> {
  try {
    const response = await fetch('/data/letters-full-processed.csv');
    const text = await response.text();
    const lines = text.split('\n');
    
    // Saltar la primera línea (headers) y la última si está vacía
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    const letterEvents: TimelineEvent[] = [];
    
    for (const line of dataLines) {
      // Parse CSV con soporte para campos con comas dentro de comillas
      const values: string[] = [];
      let currentValue = '';
      let insideQuotes = false;
      
      for (let char of line) {
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim().replace(/^"|"$/g, '')); // Remover comillas
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim().replace(/^"|"$/g, ''));
      
      if (values.length < 10) continue;
      
      // Mapear índices (según el CSV generado)
      const [
        id, sobre, title, dateStr, sender, recipient, location, content, preview,
        mentioned_people, mentioned_places, mentioned_organizations, 
        mentioned_events, keywords, language, type, num_pages, annotations
      ] = values;
      
      // Parsear fecha
      let date = new Date();
      if (dateStr && dateStr !== 'SIN DATOS') {
        try {
          date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            // Intentar extraer solo el año si falla
            const yearMatch = dateStr.match(/\d{4}/);
            if (yearMatch) {
              date = new Date(parseInt(yearMatch[0]), 0, 1);
            } else {
              date = new Date();
            }
          }
        } catch (e) {
          console.warn(`Error parsing date: ${dateStr}`);
          date = new Date();
        }
      }
      
      // Parsear arrays separados por ;
      const parseArray = (str: string) => 
        str ? str.split(';').map(s => s.trim()).filter(Boolean) : [];
      
      const mentionedPeople = parseArray(mentioned_people);
      const mentionedPlaces = parseArray(mentioned_places);
      const mentionedOrgs = parseArray(mentioned_organizations);
      const mentionedEvents = parseArray(mentioned_events);
      const keywordsArray = parseArray(keywords);
      
      // Combinar todas las entidades en tags
      const allTags = [
        ...mentionedPeople,
        ...mentionedPlaces,
        ...mentionedOrgs,
        ...mentionedEvents,
        ...keywordsArray
      ].filter(Boolean);
      
      letterEvents.push({
        id: id || `letter-${sobre}`,
        type: 'letter',
        icon: '✉️',
        date: date,
        title: title || 'Carta sin título',
        description: content || '',
        color: '#3b82f6',
        content: content || '',
        location: location || undefined,
        tags: allTags.length > 0 ? allTags : undefined,
        data: {
          filename: id || `letter-${sobre}`,
          content: content || '',
          placeFrom: location || '',
          placeTo: recipient || '',
          personFrom: sender || '',
          personTo: recipient || '',
          date: dateStr || '',
          language: language || 'Español',
          type: (type || 'Manuscrito') as any,
          preview: preview || content?.substring(0, 150) + '...',
          sender: sender || undefined,
          recipient: recipient || undefined,
          mentionedPeople: mentionedPeople.length > 0 ? mentionedPeople : undefined,
          mentionedPlaces: mentionedPlaces.length > 0 ? mentionedPlaces : undefined,
          mentionedOrganizations: mentionedOrgs.length > 0 ? mentionedOrgs : undefined,
          mentionedEvents: mentionedEvents.length > 0 ? mentionedEvents : undefined,
          keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
          numPages: num_pages ? parseInt(num_pages) : 1,
          annotations: annotations || undefined,
        } as any,
      } as any);
    }
    
    console.log(`✅ Loaded ${letterEvents.length} letters from CSV`);
    return letterEvents;
    
  } catch (error) {
    console.error('Error loading letters:', error);
    return [];
  }
}

/**
 * Listar biografías disponibles
 */
export async function listBiographies() {
  return [
    {
      id: 'luis-mitrovic',
      name: 'Luis Mitrovic',
      birthYear: 1911,
      deathYear: 2008,
      thumbnail: '/thumbnails/luis-mitrovic.jpg',
      eventCount: 0, // Se calculará dinámicamente
    },
  ];
}
