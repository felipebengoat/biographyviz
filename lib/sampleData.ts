// lib/sampleData.ts
'use client';

import Papa from 'papaparse';
import { listSamplePhotos } from './photoParser';

export interface SampleDataset {
  id: 'mitrovic' | 'vangogh';
  name: string;
  shortName: string;
  description: string;
  period: string;
  tags: string[];
  hasLetters: boolean;
  hasPhotos: boolean;
  hasTrips: boolean;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'mitrovic',
    name: 'Luis Mitrovic',
    shortName: 'Mitrovic',
    description: 'Chilean architect and photographer (1911-2008). Bauhaus-trained professional who documented architecture and urban life across Chile and international travels.',
    period: '1930-2000',
    tags: ['Architect', 'Photographer', 'Bauhaus', 'Chile'],
    hasLetters: true,
    hasPhotos: true,
    hasTrips: true,
  },
  {
    id: 'vangogh',
    name: 'Vincent van Gogh',
    shortName: 'Van Gogh',
    description: 'Dutch post-impressionist painter (1853-1890). Correspondence with family and fellow artists documenting his artistic journey across Europe.',
    period: '1872-1890',
    tags: ['Artist', 'Painter', 'France', 'Netherlands'],
    hasLetters: true,
    hasPhotos: true,
    hasTrips: false,
  },
];

interface ParsedData {
  letters?: any[];
  photos?: any[];
  trips?: any[];
}

export async function loadSampleDataset(datasetId: 'mitrovic' | 'vangogh'): Promise<ParsedData> {
  console.log(`[Sample Data] ========================================`);
  console.log(`[Sample Data] Loading dataset: ${datasetId}`);
  console.log(`[Sample Data] ========================================`);

  // Limpiar cualquier dato previo de sample
  console.log('[Sample Data] Cleaning previous sample data from localStorage...');
  localStorage.removeItem('biographyviz_sample_letters');
  localStorage.removeItem('biographyviz_sample_photos');
  localStorage.removeItem('biographyviz_sample_trips');
  localStorage.removeItem('biographyviz_is_sample');
  localStorage.removeItem('biographyviz_people');
  localStorage.removeItem('biographyviz_places');
  localStorage.removeItem('biographyviz_organizations');

  const dataset = SAMPLE_DATASETS.find(d => d.id === datasetId);
  if (!dataset) {
    throw new Error(`Dataset "${datasetId}" not found`);
  }

  console.log(`[Sample Data] Loading ${dataset.name}...`);
  
  const result: ParsedData = {};

  try {
    // 1. Cargar Letters CSV
    if (dataset.hasLetters) {
      console.log(`[Sample Data] Fetching letters.csv...`);
      const response = await fetch(`/sample-data/${datasetId}/letters.csv`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch letters: ${response.statusText}`);
      }
      
      const text = await response.text();
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });
      
      // Limpiar entidades concatenadas con |
      result.letters = parsed.data.map((letter: any) => {
        const cleanLetter = { ...letter };
        
        // Separar entidades concatenadas con |
        if (cleanLetter.mentioned_people && typeof cleanLetter.mentioned_people === 'string') {
          cleanLetter.mentioned_people = cleanLetter.mentioned_people
            .split('|')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
            .join(', ');  // Convertir a formato separado por comas
        }
        
        if (cleanLetter.mentioned_places && typeof cleanLetter.mentioned_places === 'string') {
          cleanLetter.mentioned_places = cleanLetter.mentioned_places
            .split('|')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
            .join(', ');
        }
        
        if (cleanLetter.mentioned_organizations && typeof cleanLetter.mentioned_organizations === 'string') {
          cleanLetter.mentioned_organizations = cleanLetter.mentioned_organizations
            .split('|')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
            .join(', ');
        }
        
        if (cleanLetter.mentioned_events && typeof cleanLetter.mentioned_events === 'string') {
          cleanLetter.mentioned_events = cleanLetter.mentioned_events
            .split('|')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0)
            .join(', ');
        }
        
        return cleanLetter;
      });
      
      console.log(`[Sample Data] ✅ Loaded ${result.letters.length} letters`);
    }

    // 2. Cargar Photos desde directorio (parsear filenames)
    if (dataset.hasPhotos) {
      console.log(`[Sample Data] Loading photos from /images/...`);
      result.photos = await listSamplePhotos(datasetId);
      console.log(`[Sample Data] ✅ Loaded ${result.photos.length} photos`);
    }

    // 3. Cargar Trips CSV (solo Mitrovic)
    if (dataset.hasTrips) {
      console.log(`[Sample Data] Fetching trips.csv...`);
      const response = await fetch(`/sample-data/${datasetId}/trips.csv`);
      
      if (!response.ok) {
        console.warn(`[Sample Data] trips.csv not found, skipping`);
      } else {
        const text = await response.text();
        const parsed = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
        });
        
        result.trips = parsed.data;
        console.log(`[Sample Data] ✅ Loaded ${result.trips.length} trips`);
      }
    }

    console.log(`[Sample Data] ✅ ${dataset.name} loaded successfully`);
    return result;
    
  } catch (error) {
    console.error(`[Sample Data] ❌ Error loading ${dataset.name}:`, error);
    throw error;
  }
}
