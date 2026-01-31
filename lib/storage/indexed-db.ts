// lib/storage/indexed-db.ts

import type { Letter } from '@/lib/types';

/**
 * Normalizar idioma a formato esperado
 */
function normalizeLanguage(lang: string | undefined): string {
  if (!lang) return 'Español';
  
  const langLower = lang.toLowerCase();
  
  if (langLower.includes('español') || langLower.includes('spanish')) {
    return 'Español';
  }
  if (langLower.includes('inglés') || langLower.includes('english')) {
    return 'English';
  }
  if (langLower.includes('francés') || langLower.includes('french')) {
    return 'Français';
  }
  if (langLower.includes('alemán') || langLower.includes('german')) {
    return 'Deutsch';
  }
  
  return 'Español'; // Fallback
}

const DB_NAME = 'BiographyViz';
const STORE_NAME = 'biographies';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveBiography(id: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.put(data, id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    throw error;
  }
}

export async function loadBiography(id: string): Promise<any | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
    return null;
  }
}

export async function getAllBiographyIds(): Promise<string[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result as string[]);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting keys from IndexedDB:', error);
    return [];
  }
}

/**
 * Importar cartas desde CSV procesado con NER
 */
export async function importLettersFromNER(biographyId: string, csvText: string): Promise<number> {
  // Cargar biografía existente
  let existingData = await loadBiography(biographyId);
  
  if (!existingData) {
    // Si no existe la biografía, crearla con datos mínimos
    existingData = {
      basics: {
        firstName: 'Luis',
        lastName: 'Mitrovic',
        birthYear: 1911,
        deathYear: 2008,
        shortBio: 'Arquitecto y fotógrafo chileno',
      },
      photos: [],
      letters: [],
      trips: [],
    };
  }
  
  // Asegurar que exista el objeto basics
  if (!existingData.basics) {
    existingData.basics = {
      firstName: 'Biografía',
      lastName: 'Importada',
      birthYear: 1900,
      shortBio: 'Biografía creada mediante importación de CSV',
    };
  }

  // Parsear CSV
  const lines = csvText.split('\n');
  const dataLines = lines.slice(1).filter(line => line.trim());
  
  const newLetters: Letter[] = [];
  
  for (const line of dataLines) {
    // Parse CSV con soporte para comillas
    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let char of line) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        // Limpiar valor: quitar comillas externas y normalizar saltos de línea
        let cleanValue = currentValue.trim()
          .replace(/^"|"$/g, '')           // Quitar comillas externas
          .replace(/""/g, '"')              // Reemplazar comillas dobles escapadas
          .replace(/\\n/g, '\n')            // Normalizar saltos de línea
          .replace(/\\t/g, '\t')            // Normalizar tabs
          .trim();
        
        values.push(cleanValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    // Limpiar valor final: quitar comillas externas y normalizar saltos de línea
    let cleanValue = currentValue.trim()
      .replace(/^"|"$/g, '')           // Quitar comillas externas
      .replace(/""/g, '"')              // Reemplazar comillas dobles escapadas
      .replace(/\\n/g, '\n')            // Normalizar saltos de línea
      .replace(/\\t/g, '\t')            // Normalizar tabs
      .trim();
    
    values.push(cleanValue);
    
    if (values.length < 10) continue;
    
    // Mapear campos del CSV a la estructura Letter
    const [
      id, sobre, title, dateStr, sender, recipient, location, content, preview,
      mentioned_people, mentioned_places, mentioned_organizations, 
      mentioned_events, keywords, language, type, num_pages, annotations
    ] = values;
    
    // Debug: Log de las primeras 3 filas para ver la estructura
    if (newLetters.length < 3) {
      console.log(`📋 Fila ${newLetters.length + 1} del CSV:`, {
        totalColumns: values.length,
        sender: sender || '(vacío)',
        recipient: recipient || '(vacío)',
        senderLength: sender?.length || 0,
        recipientLength: recipient?.length || 0,
        hasMentionedPeople: !!mentioned_people,
        mentionedPeoplePreview: mentioned_people?.substring(0, 100) || '(vacío)',
      });
    }
    
    // Parsear fecha y normalizar formato
    let date = '';
    if (dateStr && dateStr !== 'SIN DATOS') {
      try {
        // Limpiar timestamp si existe (1937-07-06 00:00:00 -> 1937-07-06)
        const cleanDateStr = dateStr.split(' ')[0];
        const d = new Date(cleanDateStr);
        
        if (!isNaN(d.getTime())) {
          // Formato YYYY-MM-DD
          date = d.toISOString().split('T')[0];
        } else {
          // Si falla, intentar extraer año al menos
          const yearMatch = dateStr.match(/\d{4}/);
          if (yearMatch) {
            date = `${yearMatch[0]}-01-01`;
          } else {
            date = '1900-01-01'; // Fecha fallback
          }
        }
      } catch (e) {
        date = '1900-01-01'; // Fecha fallback
      }
    } else {
      date = '1900-01-01'; // Fecha fallback si es SIN DATOS
    }
    
    // Parsear arrays
    const parseArray = (str: string) => 
      str ? str.split(';').map(s => s.trim()).filter(Boolean) : [];
    
    const mentionedPeople = parseArray(mentioned_people);
    const mentionedPlaces = parseArray(mentioned_places);
    const mentionedOrgs = parseArray(mentioned_organizations);
    const mentionedEvents = parseArray(mentioned_events);
    const keywordsArray = parseArray(keywords);
    
    // Crear objeto Letter compatible con el wizard
    newLetters.push({
      // ✅ Campos requeridos primero
      filename: `${sobre || id}.txt`,
      content: content || 'Contenido no disponible',
      fullContent: content, // Guardar contenido completo en campo separado
      date: date,
      language: normalizeLanguage(language),
      type: (type?.toLowerCase().includes('mecanograf') ? 'typewritten' : 'manuscript') as Letter['type'],
      
      // ✅ Campos opcionales básicos
      placeFrom: location || sender || 'Desconocido',
      placeTo: location || recipient || 'Desconocido',
      personFrom: sender || 'Desconocido',
      personTo: recipient || 'Desconocido',
      
      // ✅ Campos NER adicionales (al final)
      mentionedPeople: mentionedPeople.length > 0 ? mentionedPeople : undefined,
      mentionedPlaces: mentionedPlaces.length > 0 ? mentionedPlaces : undefined,
      mentionedOrganizations: mentionedOrgs.length > 0 ? mentionedOrgs : undefined,
      mentionedEvents: mentionedEvents.length > 0 ? mentionedEvents : undefined,
      keywords: keywordsArray.length > 0 ? keywordsArray : undefined,
      annotations: annotations || undefined,
      sobre: sobre,
      preview: preview,
    } as Letter & {
      mentionedPeople?: string[];
      mentionedPlaces?: string[];
      mentionedOrganizations?: string[];
      mentionedEvents?: string[];
      keywords?: string[];
      annotations?: string;
      sobre?: string;
      preview?: string;
    });
  }
  
  // Combinar con cartas existentes (evitar duplicados por 'sobre')
  const existingLetters = existingData.letters || [];
  const existingSobres = new Set(existingLetters.map((l: any) => l.sobre).filter(Boolean));
  
  const uniqueNewLetters = newLetters.filter(l => !existingSobres.has(l.sobre));
  const combinedLetters = [...existingLetters, ...uniqueNewLetters];
  
  // Guardar biografía actualizada
  await saveBiography(biographyId, {
    ...existingData,
    letters: combinedLetters
  });
  
  return uniqueNewLetters.length;
}

