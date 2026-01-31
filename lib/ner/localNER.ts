// lib/ner/localNER.ts
'use client';

let transformersModule: any = null;
let nerPipeline: any = null;

async function loadTransformers() {
  console.log('[NER] Loading Transformers.js...');
  
  if (transformersModule) {
    console.log('[NER] Already loaded (cached)');
    return transformersModule;
  }

  try {
    console.log('[NER] Attempting dynamic import...');
    const module = await import('@xenova/transformers');
    
    console.log('[NER] Import result:', module);
    console.log('[NER] Module type:', typeof module);
    
    if (!module) {
      throw new Error('Module is null or undefined');
    }
    
    const moduleAny = module as any;
    const pipeline = (module as any).pipeline || moduleAny.default?.pipeline;
    
    if (!pipeline) {
      console.error('[NER] Module structure:', module);
      throw new Error('Pipeline function not found in module');
    }
    
    transformersModule = moduleAny.default || (module as any);
    console.log('[NER] Transformers.js loaded successfully');
    
    return transformersModule;
  } catch (error) {
    console.error('[NER] Load failed:', error);
    throw new Error('Failed to load Transformers.js: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export interface Entity {
  text: string;
  label: 'PER' | 'LOC' | 'ORG' | 'MISC';
  score: number;
}

export interface ExtractedEntities {
  people: string[];
  places: string[];
  organizations: string[];
}

export async function initNER(onProgress?: (progress: number) => void): Promise<void> {
  console.log('[NER] ========================================');
  console.log('[NER] Starting initialization');
  console.log('[NER] ========================================');
  
  if (nerPipeline) {
    console.log('[NER] Already initialized');
    onProgress?.(100);
    return;
  }

  try {
    onProgress?.(10);
    console.log('[NER] Step 1/3: Loading module...');
    
    const transformers = await loadTransformers();
    onProgress?.(30);
    
    if (!transformers) {
      throw new Error('loadTransformers returned null');
    }
    
    console.log('[NER] Step 1/3: Module loaded');
    console.log('[NER] Step 2/3: Configuring environment...');
    
    if (transformers.env) {
      transformers.env.allowLocalModels = false;
      transformers.env.allowRemoteModels = true;
      transformers.env.useBrowserCache = true;
      console.log('[NER] Environment configured');
    } else {
      console.warn('[NER] transformers.env not available');
    }
    
    onProgress?.(40);
    console.log('[NER] Step 2/3: Environment ready');
    console.log('[NER] Step 3/3: Creating pipeline...');
    console.log('[NER] Model: Xenova/bert-base-NER');
    console.log('[NER] This may take 10-30 seconds on first load...');

    const transformersAny = transformers as any;
    const pipelineFunc = transformers.pipeline || transformersAny.default?.pipeline;
    
    if (!pipelineFunc) {
      throw new Error('Pipeline function not found');
    }

    const pipelinePromise = pipelineFunc(
      'token-classification',
      'Xenova/bert-base-NER',
      {
        progress_callback: (progress: any) => {
          if (progress?.progress !== undefined) {
            const percent = 40 + Math.round(progress.progress * 50);
            console.log('[NER] Download progress: ' + percent + '%');
            onProgress?.(percent);
          }
        },
      }
    );

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Model download timeout (60s)'));
      }, 60000);
    });

    nerPipeline = await Promise.race([pipelinePromise, timeoutPromise]);
    
    if (!nerPipeline) {
      throw new Error('Pipeline is null after creation');
    }
    
    onProgress?.(100);
    console.log('[NER] Step 3/3: Pipeline created');
    console.log('[NER] ========================================');
    console.log('[NER] Initialization COMPLETE');
    console.log('[NER] ========================================');
    
  } catch (error) {
    console.error('[NER] ========================================');
    console.error('[NER] INITIALIZATION FAILED');
    console.error('[NER] ========================================');
    console.error('[NER] Error:', error);
    console.error('[NER] Stack:', error instanceof Error ? error.stack : 'N/A');
    
    nerPipeline = null;
    throw error;
  }
}

// Función para detectar si un nombre es fragmento de otro
function isFragmentOf(short: string, long: string): boolean {
  const shortNorm = short.toLowerCase().trim();
  const longNorm = long.toLowerCase().trim();
  
  // No comparar consigo mismo
  if (shortNorm === longNorm) return false;
  
  // Caso 1: El corto está contenido en el largo
  if (longNorm.includes(shortNorm)) return true;
  
  // Caso 2: El corto es inicio del largo
  if (longNorm.startsWith(shortNorm)) return true;
  
  // Caso 3: El largo es inicio del corto (ej: "Paul Gau" es fragmento de "Gauguin" si aparece "Gauguin")
  if (shortNorm.startsWith(longNorm)) return true;
  
  // Caso 4: Distancia de Levenshtein pequeña (nombres similares)
  // "Gache" vs "Gachet" -> distancia 1
  if (Math.abs(shortNorm.length - longNorm.length) <= 2) {
    // Contar caracteres diferentes
    let differences = 0;
    const minLen = Math.min(shortNorm.length, longNorm.length);
    
    for (let i = 0; i < minLen; i++) {
      if (shortNorm[i] !== longNorm[i]) differences++;
    }
    
    differences += Math.abs(shortNorm.length - longNorm.length);
    
    // Si hay 2 o menos diferencias, considerar fragmento
    if (differences <= 2) return true;
  }
  
  // Caso 5: Uno contiene al otro con prefijos/sufijos (Paul Gau vs Gauguin)
  if (longNorm.includes(shortNorm.substring(0, Math.max(3, shortNorm.length - 2)))) {
    return true;
  }
  
  return false;
}

// Función para separar nombres pegados incorrectamente
function separateStuckNames(names: Set<string>): Set<string> {
  const separated = new Set<string>();
  
  for (const name of names) {
    // Detectar patrones de nombres pegados: "PaulGau", "TheoGacheP", etc
    // Patrón: MayúsculaMinúsculasMayúscula (sin espacio entre)
    const stuckPattern = /([A-Z][a-z]+)([A-Z][a-z]*)/g;
    const matches = [...name.matchAll(stuckPattern)];
    
    if (matches.length > 0 && name.length > 10) {
      // Probablemente nombres pegados, separar
      console.log(`[NER] Separating stuck name: "${name}"`);
      matches.forEach(match => {
        if (match[1] && match[1].length >= 3) separated.add(match[1]);
        if (match[2] && match[2].length >= 3) separated.add(match[2]);
      });
    } else {
      // Nombre normal
      separated.add(name);
    }
  }
  
  return separated;
}

// Función para limpiar conjunto de nombres
function cleanFragments(names: Set<string>): string[] {
  // Primero, separar nombres pegados
  const separatedNames = separateStuckNames(names);
  
  // Luego, limpiar fragmentos
  const nameArray = Array.from(separatedNames);
  const cleaned: string[] = [];
  
  for (const name of nameArray) {
    // Saltar nombres muy cortos (1 letra siempre, 2 letras si no capitalizadas)
    if (name.length === 1) continue;
    if (name.length === 2 && !/^[A-Z][a-z]$/.test(name)) continue;
    
    // Verificar si este nombre es fragmento de otro más largo
    const isFragment = nameArray.some(other => {
      if (other === name) return false;
      if (other.length <= name.length) return false;
      return isFragmentOf(name, other);
    });
    
    if (!isFragment) {
      cleaned.push(name);
    }
  }
  
  return cleaned;
}

export async function extractEntities(
  text: string,
  options?: {
    useDictionary?: boolean;
    dictionaryName?: 'vangogh';
  }
): Promise<ExtractedEntities> {
  console.log('[NER] extractEntities called with:', {
    textLength: text.length,
    useDictionary: options?.useDictionary,
    dictionaryName: options?.dictionaryName,
  });

  if (typeof window === 'undefined') {
    console.warn('[NER] Called on server, returning empty');
    return { people: [], places: [], organizations: [] };
  }
  
  if (!nerPipeline) {
    console.log('[NER] Pipeline not initialized, attempting init...');
    try {
      await initNER();
    } catch (error) {
      console.warn('[NER] Init failed, returning empty:', error);
      return { people: [], places: [], organizations: [] };
    }
  }
  
  if (!text || text.trim().length === 0) {
    return { people: [], places: [], organizations: [] };
  }
  
  try {
    const truncatedText = text.substring(0, 2000);
    const results = await nerPipeline(truncatedText) as any[];
    
    const people = new Set<string>();
    const places = new Set<string>();
    const organizations = new Set<string>();
    
    // Procesar resultados y combinar tokens
    let currentEntity: { text: string; label: string; score: number } | null = null;
    
    console.log('[NER] Processing', results.length, 'tokens from model');
    
    for (let i = 0; i < results.length; i++) {
      const entity = results[i];
      const entityLabel = entity.entity || entity.label || '';
      const word = entity.word || entity.text || '';
      const score = entity.score || 0;
      
      // LOG DETALLADO DE CADA TOKEN
      const isSubtoken = word.startsWith('##');
      const baseLabel = entityLabel.replace(/^[BI]-/, '');
      const isContinuation = entityLabel.startsWith('I-');
      
      console.log(`[NER Token ${i}]`, {
        word: word,
        label: entityLabel,
        score: score.toFixed(3),
        isSubtoken: isSubtoken,
        baseLabel: baseLabel,
        isContinuation: isContinuation,
        currentEntity: currentEntity ? { text: currentEntity.text, label: currentEntity.label } : null,
      });
      
      // Bajar threshold para capturar más tokens de nombres raros
      if (score < 0.5) {
        console.log(`[NER Token ${i}] Skipped: score too low (${score.toFixed(3)} < 0.5)`);
        continue;
      }
      
      // Extraer tipo base (B-PER, I-PER -> PER)
      // baseLabel ya calculado arriba
      
      // Determinar si es continuación
      // isContinuation ya calculado arriba
      
      // Preparar palabra limpia para evaluación
      const cleanWord = word.replace(/^##/, '');
      
      // Determinar si debemos combinar (lógica más estricta)
      // Solo combinar si es I- (continuación explícita) O es subtoken ##
      // NO combinar solo porque sea corto - eso causaba "PaulG"
      if (currentEntity && currentEntity.label === baseLabel && (isContinuation || isSubtoken)) {
        // REGLA SIMPLE Y CLARA:
        // 1. Si es subtoken (##): pegar SIN espacio
        // 2. Si NO es subtoken: pegar CON espacio
        
        if (isSubtoken) {
          // Subtoken: pegar directo (rap + ##pard = rappard)
          const beforeText = currentEntity.text;
          currentEntity.text += cleanWord;
          console.log(`[NER Token ${i}] Combined subtoken: "${beforeText}" + "${cleanWord}" = "${currentEntity.text}"`);
        } else {
          // Palabra completa: SIEMPRE con espacio
          const beforeText = currentEntity.text;
          currentEntity.text += ' ' + cleanWord;
          console.log(`[NER Token ${i}] Combined word: "${beforeText}" + " ${cleanWord}" = "${currentEntity.text}"`);
        }
        
        currentEntity.score = Math.max(currentEntity.score, score);
      } else {
        // Nueva entidad
        if (currentEntity && currentEntity.text.trim()) {
          console.log(`[NER Token ${i}] Saving previous entity: "${currentEntity.text}" (${currentEntity.label})`);
          addEntity(currentEntity.text, currentEntity.label, people, places, organizations);
        }
        
        const cleanWord = word.replace(/^##/, '');
        currentEntity = { 
          text: cleanWord, 
          label: baseLabel, 
          score 
        };
        console.log(`[NER Token ${i}] Starting new entity: "${cleanWord}" (${baseLabel})`);
      }
    }
    
    // No olvidar la última entidad
    if (currentEntity && currentEntity.text.trim()) {
      console.log('[NER] Saving final entity:', currentEntity.text, currentEntity.label);
      addEntity(currentEntity.text, currentEntity.label, people, places, organizations);
    }
    
    // Limpiar fragmentos usando la función inteligente
    console.log('[NER] Before cleaning:', {
      people: Array.from(people),
      places: Array.from(places),
      organizations: Array.from(organizations),
    });

    const cleanedPeople = cleanFragments(people);
    const cleanedPlaces = cleanFragments(places);
    const cleanedOrgs = cleanFragments(organizations);

    console.log('[NER] After cleaning:', {
      people: cleanedPeople,
      places: cleanedPlaces,
      organizations: cleanedOrgs,
    });

    // Filtrar entidades claramente incorrectas
    const blacklist = [
      'your honour', 'your honor', 'revue ine', 'independent',
      'dr', 'mr', 'mrs', 'ms', 'sir', 'madam',
      'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in',
      'v', 'van', 'de', 'du', 'la', 'le',  // Preposiciones comunes
    ];

    const finalPeople = cleanedPeople.filter(name => 
      !blacklist.includes(name.toLowerCase())
    );

    const finalPlaces = cleanedPlaces.filter(place => {
      const lower = place.toLowerCase();
      return !blacklist.includes(lower);
    });

    const finalOrgs = cleanedOrgs.filter(org => {
      const lower = org.toLowerCase();
      if (blacklist.includes(lower)) return false;
      if (org.length < 3) return false;
      return true;
    });

    console.log('[NER] After blacklist:', {
      people: finalPeople,
      places: finalPlaces,
      organizations: finalOrgs,
    });

    console.log('[NER] Extraction complete:', {
      people: { before: people.size, cleaned: cleanedPeople.length, final: finalPeople.length },
      places: { before: places.size, cleaned: cleanedPlaces.length, final: finalPlaces.length },
      organizations: { before: organizations.size, cleaned: cleanedOrgs.length, final: finalOrgs.length },
    });
    
    // ========== INTEGRACIÓN CON DICCIONARIO (solo si se solicita) ==========
    let combinedPeople: string[];
    let combinedPlaces: string[];
    let combinedOrgs: string[];

    if (options?.useDictionary && options?.dictionaryName === 'vangogh') {
      console.log('[NER] 🔵 Van Gogh dictionary ENABLED');
      try {
        const { findKnownEntities, normalizeDetectedEntity } = await import('./vanGoghDictionary');
        // 1. Normalizar entidades detectadas por NER
        const normalizedPeople = finalPeople.map(p => normalizeDetectedEntity(p, 'people') || p);
        const normalizedPlaces = finalPlaces.map(p => normalizeDetectedEntity(p, 'places') || p);
        const normalizedOrgs = finalOrgs.map(o => normalizeDetectedEntity(o, 'organizations') || o);
        // 2. Buscar entidades adicionales del diccionario
        const dictEntities = findKnownEntities(truncatedText);
        // 3. Combinar y deduplicar
        combinedPeople = Array.from(new Set([...normalizedPeople, ...dictEntities.people]));
        combinedPlaces = Array.from(new Set([...normalizedPlaces, ...dictEntities.places]));
        combinedOrgs = Array.from(new Set([...normalizedOrgs, ...dictEntities.organizations]));
        console.log('[NER] Final results (with dictionary):', {
          nerOnly: { people: finalPeople.length, places: finalPlaces.length, orgs: finalOrgs.length },
          dictionary: { people: dictEntities.people.length, places: dictEntities.places.length, orgs: dictEntities.organizations.length },
          combined: { people: combinedPeople.length, places: combinedPlaces.length, orgs: combinedOrgs.length },
        });
      } catch (dictError) {
        console.warn('[NER] Van Gogh dictionary failed, using NER only:', dictError);
        combinedPeople = finalPeople;
        combinedPlaces = finalPlaces;
        combinedOrgs = finalOrgs;
      }
    } else {
      console.log('[NER] 🟢 Van Gogh dictionary DISABLED (pure NER)');
      combinedPeople = finalPeople;
      combinedPlaces = finalPlaces;
      combinedOrgs = finalOrgs;
    }
    
    return {
      people: combinedPeople,
      places: combinedPlaces,
      organizations: combinedOrgs,
    };
  } catch (error) {
    console.error('[NER] Extraction failed:', error);
    return { people: [], places: [], organizations: [] };
  }
}

function addEntity(
  text: string,
  label: string,
  people: Set<string>,
  places: Set<string>,
  organizations: Set<string>
) {
  let cleanText = text.trim();
  
  // Remover prefijos de subtokens
  cleanText = cleanText.replace(/^##/g, '');
  cleanText = cleanText.trim();
  
  // Filtros básicos
  if (!cleanText) return;
  if (cleanText.length < 1) return;
  
  // Filtrar palabras comunes (pero NO nombres cortos como Jo, Al, Ed)
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'for', 'on', 'at', 'by', 'with', 'is', 'was', 'are', 'be', 'been', 'as', 'it', 'from'];
  if (commonWords.includes(cleanText.toLowerCase())) return;
  
  // Filtrar si es SOLO símbolos o números
  if (/^[^a-zA-Z]+$/.test(cleanText)) return;
  
  // Filtrar si contiene símbolos raros
  if (/[#@$%^&*()]/.test(cleanText)) return;
  
  // Para PERSONAS: permitir nombres cortos si empiezan con mayúscula
  const upperLabel = label.toUpperCase();
  
  if (upperLabel.includes('PER') || upperLabel === 'PERSON') {
    // Permitir si:
    // 1. Empieza con mayúscula (Jo, Al, Ed son válidos)
    // 2. O tiene al menos 3 letras
    if (!/^[A-Z]/.test(cleanText) && cleanText.length < 3) return;
    
    people.add(cleanText);
  } 
  else if (upperLabel.includes('LOC') || upperLabel === 'LOCATION') {
    // Para lugares: mínimo 2 letras con mayúscula inicial
    if (cleanText.length < 2) return;
    if (!/^[A-Z]/.test(cleanText)) return;
    
    places.add(cleanText);
  } 
  else if (upperLabel.includes('ORG') || upperLabel === 'ORGANIZATION') {
    // Para organizaciones: mínimo 2 letras
    if (cleanText.length < 2) return;
    
    organizations.add(cleanText);
  }
}

export async function extractEntitiesBatch(
  texts: string[],
  onProgress?: (current: number, total: number) => void
): Promise<ExtractedEntities[]> {
  const results: ExtractedEntities[] = [];
  
  for (let i = 0; i < texts.length; i++) {
    const entities = await extractEntities(texts[i]);
    results.push(entities);
    onProgress?.(i + 1, texts.length);
  }
  
  return results;
}

export function clearNERCache(): void {
  console.log('[NER] Clearing cache');
  nerPipeline = null;
  transformersModule = null;
}
