export interface BiographyBasics {
  firstName: string;
  lastName: string;
  birthYear: number;
  deathYear?: number;
  shortBio: string;
  profilePhoto?: File;
}

export interface Photo {
  id: string;
  file?: File;  // ← Hacer opcional
  preview: string;  // Este será base64
  title: string;
  year: number;
  category: PhotoCategory;
  description?: string;
  location?: string;  // ✅ Campo para ubicación extraída del nombre
}

export type PhotoCategory = 
  | 'family' 
  | 'education' 
  | 'travel' 
  | 'work' 
  | 'achievement' 
  | 'other';

export interface Letter {
  filename: string;
  content: string;
  notes?: string;
  placeFrom?: string;
  placeTo?: string;
  personFrom?: string;
  personTo?: string;
  date: string;
  language: string;
  type: LetterType;
  // Campos NER opcionales
  mentionedPeople?: string[];
  mentionedPlaces?: string[];
  mentionedOrganizations?: string[];
  mentionedEvents?: string[];
  keywords?: string[];
}

export type LetterType = 
  | 'manuscript' 
  | 'typewritten' 
  | 'telegram' 
  | 'postcard' 
  | 'email';

export interface Trip {
  destination: string;
  country: string;
  startDate: string;
  endDate?: string;
  purpose?: string;
  companions?: string;
  notes?: string;
}

export interface WizardState {
  currentStep: number;
  basics?: BiographyBasics;
  photos: Photo[];
  letters: Letter[];
  trips: Trip[];
  isProcessing: boolean;
}

// Timeline types

export interface TimelineEvent {
  id: string;
  type: 'birth' | 'death' | 'photo' | 'letter' | 'trip';
  date: Date;
  title: string;
  description?: string;
  content?: string;  // ✅ Campo para contenido (usado en MapView)
  location?: string;  // ✅ Campo para ubicación (usado en MapView)
  icon?: string; // DEPRECATED - usar type para determinar icono
  color: string;
  data?: Photo | Letter | Trip;
  tags?: string[];
}

export interface TimelineConfig {
  startYear: number;
  endYear: number;
  zoom: 'decades' | 'years' | 'months';
}
