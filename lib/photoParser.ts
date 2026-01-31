// lib/photoParser.ts

export interface PhotoMetadata {
  id: string;
  date: string;
  place?: string;
  title?: string;
  description?: string;
  mentioned_people?: string;
  mentioned_places?: string;
  mentioned_organizations?: string;
  image_path: string;
  filename: string;
}

/**
 * Lista todas las fotos de un dataset y extrae metadata desde filename
 */
export async function listSamplePhotos(datasetId: 'mitrovic' | 'vangogh'): Promise<PhotoMetadata[]> {
  try {
    // Cargar lista de archivos desde JSON pre-generado
    const response = await fetch(`/sample-data/${datasetId}/photo-list.json`);
    
    if (!response.ok) {
      console.warn(`[Photo Parser] No photo-list.json found for ${datasetId}`);
      return [];
    }
    
    const filenames: string[] = await response.json();
    
    // Parsear metadata de cada filename
    const photos: PhotoMetadata[] = filenames.map((filename, index) => {
      const metadata = parsePhotoFilename(filename);
      
      return {
        id: `photo_${index + 1}`,
        image_path: `/sample-data/${datasetId}/images/${filename}`,
        filename,
        ...metadata,
      };
    });
    
    console.log(`[Photo Parser] Loaded ${photos.length} photos for ${datasetId}`);
    return photos;
    
  } catch (error) {
    console.error('[Photo Parser] Error:', error);
    return [];
  }
}

/**
 * Extrae metadata desde filename
 * Soporta múltiples formatos:
 * - "1975_Paris_UNESCO_Conference.jpg" → year: 1975, place: Paris, title: UNESCO Conference
 * - "Budapest, Fischerbastei 1936.jpg" → year: 1936, place: Budapest, title: Fischerbastei
 * - "Beach at Scheveningen in Stormy Weather, Scheveningen, 1882.jpg" → year: 1882, place: Scheveningen, title: Beach at Scheveningen in Stormy Weather
 * - "Farellones Ski, 1943.jpg" → year: 1943, title: Farellones Ski
 */
function parsePhotoFilename(filename: string): Omit<PhotoMetadata, 'id' | 'image_path' | 'filename'> {
  // Remover extensión
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|gif)$/i, '');
  
  // Patrón 1: Buscar año al final (formato más común: "Título, Lugar, AÑO" o "Título, AÑO")
  const yearAtEndMatch = nameWithoutExt.match(/(.+?),\s*([^,]+?),\s*(\d{4})$|(.+?),\s*(\d{4})$/);
  if (yearAtEndMatch) {
    // Formato: "Título, Lugar, AÑO"
    if (yearAtEndMatch[3]) {
      return {
        date: yearAtEndMatch[3],
        place: yearAtEndMatch[2].trim(),
        title: yearAtEndMatch[1].trim(),
        description: yearAtEndMatch[1].trim(),
      };
    }
    // Formato: "Título, AÑO"
    if (yearAtEndMatch[5]) {
      return {
        date: yearAtEndMatch[5],
        title: yearAtEndMatch[4].trim(),
        description: yearAtEndMatch[4].trim(),
      };
    }
  }
  
  // Patrón 2: Buscar año en cualquier posición (4 dígitos)
  const yearMatch = nameWithoutExt.match(/(\d{4})/);
  if (yearMatch) {
    const year = yearMatch[1];
    const yearIndex = nameWithoutExt.indexOf(year);
    
    // Si el año está al inicio: "AÑO_Lugar_Título" o "AÑO Lugar Título"
    if (yearIndex === 0) {
      const rest = nameWithoutExt.substring(4).trim();
      const parts = rest.split(/[,\s_-]+/).filter(Boolean);
      const place = parts[0] || '';
      const title = parts.slice(1).join(' ') || rest;
      
      return {
        date: year,
        place: place,
        title: title || 'Untitled',
        description: title || rest,
      };
    }
    
    // Si el año está en el medio o al final
    const beforeYear = nameWithoutExt.substring(0, yearIndex).trim();
    const afterYear = nameWithoutExt.substring(yearIndex + 4).trim();
    
    // Intentar separar lugar y título
    // Si hay comas antes del año, probablemente es "Lugar, Título AÑO"
    if (beforeYear.includes(',')) {
      const parts = beforeYear.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        // Última parte antes del año es probablemente el lugar
        const place = parts[parts.length - 1];
        const title = parts.slice(0, -1).join(', ') || beforeYear;
        
        return {
          date: year,
          place: place,
          title: title,
          description: title,
        };
      }
    }
    
    // Sin comas, usar todo antes del año como título
    return {
      date: year,
      title: beforeYear || 'Untitled',
      description: beforeYear || nameWithoutExt,
    };
  }
  
  // Patrón 3: Formato con guiones bajos "YEAR_PLACE_TITLE"
  const underscoreParts = nameWithoutExt.split(/[_-]/);
  if (underscoreParts.length >= 2 && /^\d{4}$/.test(underscoreParts[0])) {
    return {
      date: underscoreParts[0],
      place: underscoreParts[1] || '',
      title: underscoreParts.slice(2).join(' ') || underscoreParts[1] || 'Untitled',
      description: underscoreParts.slice(1).join(' '),
    };
  }
  
  // Fallback: usar todo el nombre como título
  return {
    date: '',
    title: nameWithoutExt.replace(/[_-]/g, ' '),
    description: nameWithoutExt.replace(/[_-]/g, ' '),
  };
}
