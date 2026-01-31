// lib/ner/vanGoghDictionary.ts

/**
 * Diccionario de entidades conocidas extraídas del corpus de cartas de Van Gogh
 * Generado automáticamente del CSV completo
 */

export const vanGoghKnownEntities = {
  people: [
    // Familia Van Gogh
    'Vincent van Gogh',
    'Theo van Gogh',
    'Theodorus van Gogh', // Padre
    'Anna Cornelia Carbentus', // Madre
    'Johanna van Gogh-Bonger',
    'Jo Bonger',
    'Jo',
    'Cor van Gogh',
    'Cor',
    'Willemien van Gogh',
    'Wil',
    'Anna van Gogh',
    'Lies van Gogh',
    'Vincent Willem van Gogh', // Sobrino
    
    // Artistas contemporáneos
    'Paul Gauguin',
    'Gauguin',
    'Émile Bernard',
    'Bernard',
    'Anthon van Rappard',
    'Rappard',
    'Paul Signac',
    'Signac',
    'Georges Seurat',
    'Seurat',
    'Camille Pissarro',
    'Pissarro',
    'Claude Monet',
    'Monet',
    'Pierre-Auguste Renoir',
    'Renoir',
    'Henri de Toulouse-Lautrec',
    'Toulouse-Lautrec',
    'Edgar Degas',
    'Degas',
    'Jean-François Millet',
    'Millet',
    'Charles Angrand',
    'Angrand',
    'Lucien Pissarro',
    'Eugène Boch',
    'Boch',
    'Anton Mauve',
    'Mauve',
    'Willem Roelofs',
    'Roelofs',
    
    // Amigos y conocidos
    'Joseph Roulin',
    'Roulin',
    'Augustine Roulin',
    'Armand Roulin',
    'Camille Roulin',
    'Marcelle Roulin',
    'Patience Escalier',
    'Joseph Ginoux',
    'Marie Ginoux',
    'Paul-Eugène Milliet',
    'Milliet',
    
    // Médicos
    'Dr. Paul Gachet',
    'Dr. Gachet',
    'Gachet',
    'Dr. Félix Rey',
    'Dr. Rey',
    'Dr. Théophile Peyron',
    'Dr. Peyron',
    
    // Marchantes de arte
    'Père Tanguy',
    'Tanguy',
    'Julien Tanguy',
    'Tersteeg',
    'Hermanus Tersteeg',
    'Theo van Gogh', // También marchante
    
    // Otros
    'Sien Hoornik',
    'Sien',
    'Christine Clasina Maria Hoornik',
    'Kee Vos',
    'Kee',
    'Margot Begemann',
    'Agostina Segatori',
  ],
  
  places: [
    // Países
    'France',
    'Netherlands',
    'Belgium',
    'England',
    'Holland',
    
    // Ciudades principales
    'Paris',
    'Arles',
    'Auvers-sur-Oise',
    'Auvers',
    'Saint-Rémy-de-Provence',
    'Saint-Rémy',
    'The Hague',
    'Amsterdam',
    'Antwerp',
    'London',
    'Brussels',
    
    // Pueblos holandeses
    'Nuenen',
    'Etten',
    'Zundert',
    'Drenthe',
    'Hoogeveen',
    'Nieuw-Amsterdam',
    'Zweeloo',
    'Helvoirt',
    'Tilburg',
    'Breda',
    
    // Lugares en Francia
    'Montmartre',
    'Provence',
    'Pont-Aven',
    'Saintes-Maries-de-la-Mer',
    'Tarascon',
    'Marseille',
    'Asnières',
    'Clichy',
    'Petit-Wasmes',
    'Borinage',
    
    // Lugares específicos
    'Yellow House', // Casa Amarilla
    'Café de la Gare',
    'Hospital of Arles',
    'Saint-Paul Asylum',
    'Saint-Paul-de-Mausole',
    'Ravoux Inn',
  ],
  
  organizations: [
    // Galerías y casas de arte
    'Goupil & Cie',
    'Goupil',
    'Boussod & Valadon',
    'Boussod, Valadon & Cie',
    
    // Salones y exposiciones
    'Salon des Indépendants',
    'Salon',
    'Société des Artistes Indépendants',
    'Petit Boulevard',
    
    // Instituciones educativas
    'Royal Academy',
    'École des Beaux-Arts',
    'Academy of Fine Arts',
    
    // Publicaciones
    'Le Figaro',
    'La Revue Indépendante',
    'Revue Indépendante',
    
    // Otros
    'Protestant Church',
    'Catholic Church',
  ],
};

/**
 * Función para encontrar entidades conocidas en un texto
 * Utiliza matching flexible para capturar variaciones
 */
export function findKnownEntities(text: string): {
  people: string[];
  places: string[];
  organizations: string[];
} {
  if (!text || text.trim().length === 0) {
    return { people: [], places: [], organizations: [] };
  }
  
  const found = {
    people: new Set<string>(),
    places: new Set<string>(),
    organizations: new Set<string>(),
  };
  
  const lowerText = text.toLowerCase();
  
  // Buscar personas
  for (const person of vanGoghKnownEntities.people) {
    // Crear variaciones del nombre
    const variants = new Set([person]);
    
    // Agregar apellido solo
    const parts = person.split(' ');
    if (parts.length > 1) {
      variants.add(parts[parts.length - 1]); // Último elemento (apellido)
      variants.add(parts[0]); // Primer elemento (nombre)
    }
    
    // Buscar cada variación
    for (const variant of variants) {
      if (variant.length < 3) continue; // Skip nombres muy cortos
      
      // Buscar como palabra completa (con límites de palabra)
      const pattern = new RegExp(`\\b${variant.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(lowerText)) {
        found.people.add(person);
        break; // Ya encontramos esta persona, pasar a la siguiente
      }
    }
  }
  
  // Buscar lugares
  for (const place of vanGoghKnownEntities.places) {
    const escapedPlace = place.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escapedPlace}\\b`, 'i');
    if (pattern.test(lowerText)) {
      found.places.add(place);
    }
  }
  
  // Buscar organizaciones
  for (const org of vanGoghKnownEntities.organizations) {
    // Para organizaciones, usar includes en vez de palabra completa
    // porque pueden aparecer con variaciones
    if (lowerText.includes(org.toLowerCase())) {
      found.organizations.add(org);
    }
  }
  
  return {
    people: Array.from(found.people),
    places: Array.from(found.places),
    organizations: Array.from(found.organizations),
  };
}

/**
 * Función para normalizar nombres detectados por NER
 * Corrige fragmentos detectados con sus versiones completas del diccionario
 */
export function normalizeDetectedEntity(
  entity: string, 
  type: 'people' | 'places' | 'organizations'
): string | null {
  const entityLower = entity.toLowerCase().trim();
  
  if (entityLower.length < 2) return null;
  
  const dictionary = vanGoghKnownEntities[type];
  
  // Buscar coincidencia exacta
  const exact = dictionary.find(item => item.toLowerCase() === entityLower);
  if (exact) return exact;
  
  // Buscar si la entidad es parte de un nombre más largo
  const longerMatch = dictionary.find(item => {
    const itemLower = item.toLowerCase();
    // "Gau" debería matchear con "Gauguin"
    return itemLower.includes(entityLower) || entityLower.includes(itemLower);
  });
  
  if (longerMatch) return longerMatch;
  
  // No hay match, devolver la entidad original
  return entity;
}
