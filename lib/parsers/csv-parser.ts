// lib/parsers/csv-parser.ts

import Papa from 'papaparse';
import { Letter, Trip } from '../types';

interface ParseResult<T> {
  data: T[];
  errors: string[];
}

export async function parseLettersCSV(file: File): Promise<ParseResult<Letter>> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"',
      complete: (results) => {
        const errors: string[] = [];
        const data: Letter[] = [];

        // Add parsing errors if any
        if (results.errors && results.errors.length > 0) {
          results.errors.forEach(error => {
            errors.push(`Error de parsing: ${error.message} (fila ${error.row})`);
          });
        }

        results.data.forEach((row, index) => {
          // Skip completely empty rows
          if (Object.values(row).every(val => !val || val.trim() === '')) {
            return;
          }

          // Validate required fields (only date is required)
          const requiredFields = ['date'];
          const missingFields = requiredFields.filter(field => !row[field] || row[field].trim() === '');

          if (missingFields.length > 0) {
            errors.push(`Fila ${index + 2}: ${missingFields.map(f => `Campo "${f}" es requerido`).join('; ')}`);
            return;
          }

          // Parsear y normalizar fecha de manera flexible
          const dateStr = row.date.trim();
          let normalizedDate = '';
          
          if (!dateStr || dateStr === 'SIN DATOS' || dateStr === '') {
            normalizedDate = '1900-01-01'; // Fecha fallback
          } else {
            try {
              // Limpiar timestamp si existe (1937-07-06 00:00:00 -> 1937-07-06)
              const cleanDateStr = dateStr.split(' ')[0];
              
              // Intentar parsear con Date
              const d = new Date(cleanDateStr);
              
              if (!isNaN(d.getTime())) {
                // Formato YYYY-MM-DD
                normalizedDate = d.toISOString().split('T')[0];
              } else {
                // Si falla, intentar formatos conocidos
                // YYYY-MM-DD
                if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDateStr)) {
                  normalizedDate = cleanDateStr;
                }
                // DD-MM-YYYY o DD/MM/YYYY
                else if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(cleanDateStr)) {
                  const parts = cleanDateStr.split(/[-\/]/);
                  normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                // Solo año (YYYY)
                else if (/^\d{4}$/.test(cleanDateStr)) {
                  normalizedDate = `${cleanDateStr}-01-01`;
                }
                // Intentar extraer año
                else {
                  const yearMatch = cleanDateStr.match(/\d{4}/);
                  if (yearMatch) {
                    normalizedDate = `${yearMatch[0]}-01-01`;
                  } else {
                    normalizedDate = '1900-01-01'; // Fecha fallback
                  }
                }
              }
            } catch (e) {
              // Si todo falla, intentar extraer año
              const yearMatch = dateStr.match(/\d{4}/);
              if (yearMatch) {
                normalizedDate = `${yearMatch[0]}-01-01`;
              } else {
                normalizedDate = '1900-01-01'; // Fecha fallback
              }
            }
          }

          // Parsear arrays de entidades NER (separados por |)
          const parseNERArray = (str: string) => 
            str ? str.split('|').map(s => s.trim()).filter(Boolean) : [];

          // === DEBUGGING ROW ===
          console.log('=== DEBUGGING ROW ===');
          console.log('Raw mentioned_people:', row.mentioned_people);
          console.log('Raw mentioned_places:', row.mentioned_places);
          console.log('Raw mentioned_organizations:', row.mentioned_organizations);
          console.log('Raw mentioned_events:', row.mentioned_events);
          console.log('Raw keywords:', row.keywords);

          // Extraer campos NER si existen en el CSV (usando snake_case como en el CSV)
          const mentionedPeople = row.mentioned_people ? parseNERArray(row.mentioned_people) : [];
          const mentionedPlaces = row.mentioned_places ? parseNERArray(row.mentioned_places) : [];
          const mentionedOrgs = row.mentioned_organizations ? parseNERArray(row.mentioned_organizations) : [];
          const mentionedEvents = row.mentioned_events ? parseNERArray(row.mentioned_events) : [];
          const keywords = row.keywords ? parseNERArray(row.keywords) : [];

          console.log('Parsed mentionedPeople:', mentionedPeople);
          console.log('Parsed mentionedPlaces:', mentionedPlaces);
          console.log('Parsed mentionedOrganizations:', mentionedOrgs);
          console.log('Parsed mentionedEvents:', mentionedEvents);
          console.log('Parsed keywords:', keywords);

          const letter: Letter = {
            filename: row.filename?.trim() || `letter_${index + 1}`,
            content: row.content?.trim() || '',
            notes: row.notes?.trim() || '',
            // ✅ NUEVOS CAMPOS DE UBICACIÓN: usar placeFrom/placeTo (con variantes snake_case)
            placeFrom: row.placeFrom?.trim() || row.place_from?.trim() || '',
            placeTo: row.placeTo?.trim() || row.place_to?.trim() || '',
            // ✅ CORREGIR: El CSV usa 'sender' y 'recipient', no 'personFrom' y 'personTo'
            personFrom: row.sender?.trim() || row.personFrom?.trim() || '',
            personTo: row.recipient?.trim() || row.personTo?.trim() || '',
            date: normalizedDate,
            language: row.language?.trim() || 'Unknown',
            type: (row.type?.trim() as Letter['type']) || 'manuscript',
          };

          // Agregar campos NER al objeto Letter
          if (mentionedPeople.length > 0) letter.mentionedPeople = mentionedPeople;
          if (mentionedPlaces.length > 0) letter.mentionedPlaces = mentionedPlaces;
          if (mentionedOrgs.length > 0) letter.mentionedOrganizations = mentionedOrgs;
          if (mentionedEvents.length > 0) letter.mentionedEvents = mentionedEvents;
          if (keywords.length > 0) letter.keywords = keywords;

          console.log('Letter object:', letter);
          console.log('===================');

          data.push(letter);
        });

        resolve({ data, errors });
      },
      error: (error) => {
        resolve({ data: [], errors: [error.message] });
      }
    });
  });
}

export async function parseTripsCSV(file: File): Promise<ParseResult<Trip>> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"',
      complete: (results) => {
        const errors: string[] = [];
        const data: Trip[] = [];

        // Add parsing errors if any
        if (results.errors && results.errors.length > 0) {
          results.errors.forEach(error => {
            errors.push(`Error de parsing: ${error.message} (fila ${error.row})`);
          });
        }

        results.data.forEach((row, index) => {
          // Skip completely empty rows
          if (Object.values(row).every(val => !val || val.trim() === '')) {
            return;
          }

          // Validate required fields
          const requiredFields = ['destination', 'country', 'startDate'];
          const missingFields = requiredFields.filter(field => !row[field] || row[field].trim() === '');

          if (missingFields.length > 0) {
            errors.push(`Fila ${index + 2}: ${missingFields.map(f => `Campo "${f}" es requerido`).join('; ')}`);
            return;
          }

          // Validate date formats
          const startDateStr = row.startDate.trim();
          const isValidStartDate = /^\d{4}-\d{2}-\d{2}$/.test(startDateStr) || 
                                  /^\d{2}-\d{2}-\d{4}$/.test(startDateStr) ||
                                  /^\d{2}\/\d{2}\/\d{4}$/.test(startDateStr);

          if (!isValidStartDate) {
            errors.push(`Fila ${index + 2}: Formato de startDate inválido (use YYYY-MM-DD, DD-MM-YYYY o DD/MM/YYYY)`);
            return;
          }

          // Convert DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD
          let normalizedStartDate = startDateStr;
          if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(startDateStr)) {
            const parts = startDateStr.split(/[-\/]/);
            normalizedStartDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }

          let normalizedEndDate: string | undefined;
          if (row.endDate && row.endDate.trim()) {
            const endDateStr = row.endDate.trim();
            const isValidEndDate = /^\d{4}-\d{2}-\d{2}$/.test(endDateStr) || 
                                  /^\d{2}-\d{2}-\d{4}$/.test(endDateStr) ||
                                  /^\d{2}\/\d{2}\/\d{4}$/.test(endDateStr);

            if (!isValidEndDate) {
              errors.push(`Fila ${index + 2}: Formato de endDate inválido (use YYYY-MM-DD, DD-MM-YYYY o DD/MM/YYYY)`);
              return;
            }

            if (/^\d{2}[-\/]\d{2}[-\/]\d{4}$/.test(endDateStr)) {
              const parts = endDateStr.split(/[-\/]/);
              normalizedEndDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            } else {
              normalizedEndDate = endDateStr;
            }
          }

          data.push({
            destination: row.destination.trim(),
            country: row.country.trim(),
            startDate: normalizedStartDate,
            endDate: normalizedEndDate,
            purpose: row.purpose?.trim() || '',
            companions: row.companions?.trim() || '',
            notes: row.notes?.trim() || ''
          });
        });

        resolve({ data, errors });
      },
      error: (error) => {
        resolve({ data: [], errors: [error.message] });
      }
    });
  });
}