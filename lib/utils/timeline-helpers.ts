import type { BiographyBasics, Photo, Letter, Trip, TimelineEvent } from '../types';

export function createTimelineEvents(
  basics: BiographyBasics | undefined,
  photos: Photo[],
  letters: Letter[],
  trips: Trip[],
  t?: (key: string, params?: Record<string, string | number>) => string
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Create birth event
  if (basics) {
    const birthDate = new Date(basics.birthYear, 0, 1); // January 1st of birth year
    const birthTitle = t 
      ? t('timeline.birthTitle', { name: `${basics.firstName} ${basics.lastName}` })
      : `Birth of ${basics.firstName} ${basics.lastName}`;
    events.push({
      id: 'birth',
      type: 'birth',
      date: birthDate,
      title: birthTitle,
      description: basics.shortBio,
      // icon removed - using type-based icons now
      color: '#10b981',
    });

    // Create death event if deathYear exists
    if (basics.deathYear) {
      const deathDate = new Date(basics.deathYear, 0, 1); // January 1st of death year
      const deathTitle = t
        ? t('timeline.deathTitle', { name: `${basics.firstName} ${basics.lastName}` })
        : `Death of ${basics.firstName} ${basics.lastName}`;
      events.push({
        id: 'death',
        type: 'death',
        date: deathDate,
        title: deathTitle,
        // icon removed - using type-based icons now
        color: '#6b7280',
      });
    }
  }

  // Convert photos to events
  photos.forEach((photo) => {
    const year = parseInt(photo.year.toString()) || new Date().getFullYear();
    events.push({
      id: photo.id || `photo-${events.length}`,
      type: 'photo',
      // icon removed - using type-based icons now
      date: new Date(year, 0, 1),
      title: photo.title || photo.name || 'Foto',
      description: photo.description,
      content: photo.description,
      location: photo.location,  // ✅ Usar el campo location de la foto
      color: '#8b5cf6',
      data: photo,  // ✅ Pasar TODO el objeto
    });
  });

  // Convert letters to events
  letters.forEach((letter, index) => {
    // Parse the date string - assuming format like "YYYY-MM-DD" or similar
    let letterDate: Date;
    try {
      letterDate = new Date(letter.date);
      // If date is invalid, use a fallback
      if (isNaN(letterDate.getTime())) {
        letterDate = new Date();
      }
    } catch {
      letterDate = new Date();
    }

    // Generar título descriptivo con año
    let title: string;
    const year = letterDate.getFullYear();
    
    // Obtener sender y recipient (pueden venir como sender/recipient o personFrom/personTo)
    const sender = (letter as any).sender || letter.personFrom || '';
    const recipient = (letter as any).recipient || letter.personTo || '';
    
    if (t) {
      // Usar traducciones
      if (sender && recipient && sender !== 'Desconocido' && recipient !== 'Desconocido') {
        title = t('timeline.letterTitle', { sender, recipient, year: year.toString() });
      } else if (sender && sender !== 'Desconocido') {
        title = t('timeline.letterFromTitle', { sender, year: year.toString() });
      } else if (recipient && recipient !== 'Desconocido') {
        title = t('timeline.letterToTitle', { recipient, year: year.toString() });
      } else {
        title = t('timeline.letterGenericTitle', { year: year.toString() });
      }
    } else {
      // Fallback en inglés
      if (sender && recipient && sender !== 'Desconocido' && recipient !== 'Desconocido') {
        title = `Letter from ${sender} to ${recipient}, ${year}`;
      } else if (sender && sender !== 'Desconocido') {
        title = `Letter from ${sender}, ${year}`;
      } else if (recipient && recipient !== 'Desconocido') {
        title = `Letter to ${recipient}, ${year}`;
      } else {
        title = letter.filename || `Letter, ${year}`;
      }
    }
    // Descripción traducida
    let description: string;
    if (t) {
      if (letter.placeFrom && letter.placeTo) {
        description = t('timeline.letterDescription', { from: letter.placeFrom, to: letter.placeTo });
      } else {
        description = letter.notes || letter.placeFrom || letter.placeTo || '';
      }
    } else {
      description = letter.notes || (letter.placeFrom && letter.placeTo 
        ? `From ${letter.placeFrom} to ${letter.placeTo}`
        : letter.placeFrom || letter.placeTo || '');
    }

    // Extract NER fields from letter (if they exist as additional properties)
    const letterWithNER = letter as Letter & {
      mentionedPeople?: string[];
      mentionedPlaces?: string[];
      mentionedOrganizations?: string[];
      mentionedEvents?: string[];
      keywords?: string[];
    };

    // Combine all NER fields into tags
    const tags: string[] = [];
    if (letterWithNER.mentionedPeople) {
      tags.push(...letterWithNER.mentionedPeople);
    }
    if (letterWithNER.mentionedPlaces) {
      tags.push(...letterWithNER.mentionedPlaces);
    }
    if (letterWithNER.mentionedOrganizations) {
      tags.push(...letterWithNER.mentionedOrganizations);
    }
    if (letterWithNER.mentionedEvents) {
      tags.push(...letterWithNER.mentionedEvents);
    }
    if (letterWithNER.keywords) {
      tags.push(...letterWithNER.keywords);
    }

    // Crear objeto data con todos los campos NER
    const letterData = {
      ...letter,
      preview: letter.content?.substring(0, 150) + (letter.content && letter.content.length > 150 ? '...' : ''),
      sender: letter.sender || letter.personFrom, // ✅ Usar sender si existe, sino personFrom
      recipient: letter.recipient || letter.personTo, // ✅ Usar recipient si existe, sino personTo
      placeFrom: letter.placeFrom, // ✅ Asegurar que placeFrom esté en data
      placeTo: letter.placeTo, // ✅ Asegurar que placeTo esté en data
      place_from: letter.placeFrom, // ✅ Alias para compatibilidad
      place_to: letter.placeTo, // ✅ Alias para compatibilidad
      location: letter.placeFrom || letter.placeTo, // ✅ Campo location genérico
      mentionedPeople: letterWithNER.mentionedPeople,
      mentionedPlaces: letterWithNER.mentionedPlaces,
      mentionedEvents: letterWithNER.mentionedEvents,
      mentionedOrganizations: letterWithNER.mentionedOrganizations,
      keywords: letterWithNER.keywords,
    };
    
    // Debug: Log de la primera carta para verificar datos
    if (index === 0) {
      console.log('📧 Procesando carta:', {
        ...letter,
        letterData: letterData,
      });
    }
    
    events.push({
      id: letter.id || `letter-${events.length}`,
      type: 'letter',
      // icon removed - using type-based icons now
      date: letterDate,
      title: title || letter.filename || 'Carta',
      description: description || letter.content?.substring(0, 200) || '',
      content: letter.content || letter.preview,
      location: letter.placeFrom || letter.placeTo || 'Desconocido',  // Usar placeFrom como location principal
      color: '#3b82f6',
      data: letterData,  // ✅ Pasar TODO el objeto (incluye placeFrom y placeTo)
      tags: tags.length > 0 ? tags : undefined,
    });
  });

  // Convert trips to events
  trips.forEach((trip) => {
    // Parse the startDate string
    let tripDate: Date;
    try {
      tripDate = new Date(trip.startDate);
      // If date is invalid, use a fallback
      if (isNaN(tripDate.getTime())) {
        tripDate = new Date();
      }
    } catch {
      tripDate = new Date();
    }

    // Extraer año de startDate si no está disponible
    const year = tripDate.getFullYear() || new Date().getFullYear();

    // Título de viaje traducido
    const tripTitle = t && trip.destination && trip.country
      ? t('timeline.tripTitle', { destination: trip.destination, country: trip.country })
      : trip.destination && trip.country
        ? `Trip to ${trip.destination}, ${trip.country}`
        : trip.destination || 'Trip';
    const tripDescription = trip.purpose || trip.notes || trip.companions;

    events.push({
      id: trip.id || `trip-${events.length}`,
      type: 'trip',
      // icon removed - using type-based icons now
      date: tripDate,
      title: tripTitle,
      description: tripDescription,
      content: trip.notes || trip.observations || trip.purpose,
      location: trip.destination,
      color: '#f59e0b',
      data: trip,  // ✅ Pasar TODO el objeto
    });
  });

  // Sort events by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return events;
}

