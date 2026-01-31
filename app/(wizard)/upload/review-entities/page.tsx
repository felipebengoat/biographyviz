'use client';

import { useRouter } from 'next/navigation';
import { useWizard } from '@/components/wizard/WizardContext';
import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AlertCircle, Check, Database, Zap, Loader2 } from 'lucide-react';
import { saveBiography } from '@/lib/storage/indexed-db';

interface EntityStats {
  name: string;
  count: number;
  selected: boolean;
  sources: string[];
}

export default function ReviewEntitiesPage() {
  const router = useRouter();
  const { letters, setLetters, photos, addPhoto, trips, setTrips, basics } = useWizard();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'people' | 'places' | 'organizations' | 'events'>('people');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelProgress, setModelProgress] = useState(0);
  const [processProgress, setProcessProgress] = useState({ current: 0, total: 0 });
  const [modelError, setModelError] = useState<string | null>(null);
  const [nerAvailable, setNerAvailable] = useState(false);
  const [autoDetectRan, setAutoDetectRan] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [isVanGoghDetected, setIsVanGoghDetected] = useState(false);
  const [useVanGoghDictionary, setUseVanGoghDictionary] = useState(false);
  const [sampleDataLoaded, setSampleDataLoaded] = useState(false);
  
  // Función para separar entidades que vienen concatenadas con | o ,
  function splitEntityString(entityString: string | string[] | undefined): string[] {
    if (!entityString) return [];
    
    // Si ya es un array, retornarlo
    if (Array.isArray(entityString)) {
      return entityString;
    }
    
    // Si es string, separar por | o , o ;
    const separators = /[|,;]/;
    return entityString
      .split(separators)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);
  }

  // Parseo seguro de fechas (evita 2026 y formatos incorrectos)
  function parseSafeDate(dateString: any): Date {
    if (!dateString) {
      console.warn('[Date Parser] No date provided');
      return new Date('1900-01-01');
    }

    const dateStr = String(dateString).trim();
    console.log(`[Date Parser] Parsing: "${dateStr}"`);

    // 1. ISO: 2024-01-30 o 2024-01-30T00:00:00Z
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        console.log(`[Date Parser] ✅ Parsed as ISO: ${parsed.toISOString()}`);
        return parsed;
      }
    }

    // 2. Solo año: "1975"
    if (/^\d{4}$/.test(dateStr)) {
      const year = parseInt(dateStr);
      if (year >= 1800 && year <= 2025) {
        const date = new Date(`${year}-01-01`);
        console.log(`[Date Parser] ✅ Parsed as year: ${date.toISOString()}`);
        return date;
      }
    }

    // 3. DD/MM/YYYY
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      const date = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(date.getTime())) {
        console.log(`[Date Parser] ✅ Parsed as DD/MM/YYYY: ${date.toISOString()}`);
        return date;
      }
    }

    // 4. YYYY-MM
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      const date = new Date(`${dateStr}-01`);
      if (!isNaN(date.getTime())) {
        console.log(`[Date Parser] ✅ Parsed as YYYY-MM: ${date.toISOString()}`);
        return date;
      }
    }

    // 5. Fallback: Date.parse
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 1800 && parsed.getFullYear() <= 2025) {
      console.log(`[Date Parser] ✅ Parsed with Date(): ${parsed.toISOString()}`);
      return parsed;
    }

    console.warn(`[Date Parser] ❌ Failed to parse: "${dateStr}", using fallback 1900-01-01`);
    return new Date('1900-01-01');
  }

  // Cargar sample data si existe
  useEffect(() => {
    console.log('[Review] ================================================');
    console.log('[Review] PAGE LOADED - Checking for sample data...');
    console.log('[Review] ================================================');

    const isSample = localStorage.getItem('biographyviz_is_sample');
    const sampleLetters = localStorage.getItem('biographyviz_sample_letters');
    const samplePhotos = localStorage.getItem('biographyviz_sample_photos');
    const sampleTrips = localStorage.getItem('biographyviz_sample_trips');

    console.log('[Review] localStorage check:', {
      isSample,
      hasLetters: !!sampleLetters,
      hasPhotos: !!samplePhotos,
      hasTrips: !!sampleTrips,
    });

    if (!isSample || !sampleLetters || letters.length > 0) {
      console.log('[Review] No sample data to load (or letters already loaded)');
      console.log('[Review] ================================================');
      return;
    }

    if (sampleDataLoaded) {
      console.log('[Review] Sample data already loaded, skipping');
      console.log('[Review] ================================================');
      return;
    }

    console.log(`[Review] ✅ Sample data found: ${isSample}`);
    console.log(`[Review] Will use Van Gogh dictionary: ${isSample === 'vangogh'}`);

    try {
      const lettersData = JSON.parse(sampleLetters);
      console.log(`[Review] Raw letters data (first item):`, lettersData[0]);

      const processedLetters = lettersData.map((l: any, index: number) => {
        const safeDate = parseSafeDate(l.date);
        const dateStr = safeDate.toISOString().split('T')[0];
        return {
          ...l,
          id: l.id || `letter_${index + 1}`,
          filename: l.filename || l.id || `letter_${index + 1}`,
          content: l.content || l.preview || '',
          date: dateStr,
          language: l.language || 'Unknown',
          type: l.type || 'manuscript',
          sender: l.sender || l.personFrom || 'Unknown',
          recipient: l.recipient || l.personTo || 'Unknown',
          mentionedPeople: splitEntityString(l.mentioned_people),
          mentionedPlaces: splitEntityString(l.mentioned_places),
          mentionedOrganizations: splitEntityString(l.mentioned_organizations),
          mentionedEvents: splitEntityString(l.mentioned_events),
        };
      });

      setLetters(processedLetters);
      console.log(`[Review] ✅ Processed ${processedLetters.length} letters`);
      if (processedLetters.length > 0) {
        const dates = processedLetters.map((l: any) => new Date(l.date).getTime()).filter((t: number) => !isNaN(t));
        if (dates.length > 0) {
          console.log('[Review] Date range:', {
            oldest: new Date(Math.min(...dates)).toISOString().split('T')[0],
            newest: new Date(Math.max(...dates)).toISOString().split('T')[0],
          });
        }
        console.log('[Review] Sample letters (first 3):', processedLetters.slice(0, 3).map((l: any) => ({
          id: l.id,
          date: l.date,
          sender: l.sender,
          recipient: l.recipient,
        })));
      }

      // Parsear photos
      if (samplePhotos && photos.length === 0) {
        const photosData = JSON.parse(samplePhotos);
        photosData.forEach((p: any, index: number) => {
          const dateObj = parseSafeDate(p.date);
          const year = dateObj.getFullYear();
          const safeYear = year === 1900 ? 1950 : Math.min(year, 2025);
          addPhoto({
            id: p.id || `photo_${index + 1}`,
            preview: p.image_path || p.preview || '',
            title: p.title || p.description || 'Untitled',
            year: safeYear,
            category: 'other',
            description: p.description,
            location: p.place,
          });
        });
        console.log(`[Review] ✅ Processed ${photosData.length} photos`);
        if (photosData.length > 0) {
          console.log('[Review] Sample photos (first 3):', photosData.slice(0, 3).map((p: any) => ({
            id: p.id,
            date: p.date,
            filename: p.filename,
          })));
        }
      }

      // Parsear trips (CSV puede tener startDate/endDate en camelCase o start_date en snake_case)
      if (sampleTrips && trips.length === 0) {
        const tripsData = JSON.parse(sampleTrips);
        console.log('[Review] Raw trips data (first item):', tripsData[0]);
        console.log('[Review] Trips columns:', Object.keys(tripsData[0] || {}));

        const processedTrips = tripsData.map((t: any, index: number) => {
          const startDateStr = t.start_date || t.startDate || t.date || t.year;
          const endDateStr = t.end_date || t.endDate;
          const startDateParsed = parseSafeDate(startDateStr);
          const endDateParsed = endDateStr ? parseSafeDate(endDateStr) : undefined;
          const trip = {
            destination: t.destination || t.place || '',
            country: t.country || t.destination || '',
            startDate: startDateParsed.toISOString().split('T')[0],
            endDate: endDateParsed ? endDateParsed.toISOString().split('T')[0] : undefined,
            purpose: t.purpose || t.description || undefined,
            companions: t.companions || undefined,
            notes: t.notes || t.observations || undefined,
          };
          console.log(`[Review] Trip ${index + 1}:`, {
            original_start: startDateStr,
            parsed_start: trip.startDate,
            destination: trip.destination,
          });
          return trip;
        });
        setTrips(processedTrips);
        console.log(`[Review] ✅ Processed ${processedTrips.length} trips`);
      }

      const isVanGogh = isSample === 'vangogh';
      console.log(`[Review] Is Van Gogh dataset? ${isVanGogh}`);
      console.log(`[Review] Dictionary will be: ${isVanGogh ? 'ENABLED' : 'DISABLED'}`);
      setIsVanGoghDetected(isVanGogh);
      setUseVanGoghDictionary(isVanGogh);

      localStorage.removeItem('biographyviz_sample_letters');
      localStorage.removeItem('biographyviz_sample_photos');
      localStorage.removeItem('biographyviz_sample_trips');

      setSampleDataLoaded(true);
      console.log(`[Review] ✅ Sample data loaded successfully`);
    } catch (error) {
      console.error('[Review] ❌ Error loading sample data:', error);
      alert(`Error loading sample data: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    console.log('[Review] ================================================');
    console.log('[Review] PAGE LOAD COMPLETE');
    console.log('[Review] ================================================');
  }, [setLetters, addPhoto, setTrips, photos.length, trips.length, letters.length, sampleDataLoaded]);
  
  // Pre-cargar el modelo al montar el componente
  useEffect(() => {
    let mounted = true;
    
    const loadModel = async () => {
      try {
        setModelLoading(true);
        setModelError(null);
        
        console.log('📦 Starting NER model load...');
        
        // Dynamic import para evitar problemas con SSR
        const { initNER } = await import('@/lib/ner/localNER');
        await initNER((progress) => {
          if (mounted) {
            setModelProgress(progress);
          }
        });
        
        if (mounted) {
          console.log('✅ Model loaded, ready to extract entities');
          setModelLoading(false);
          setNerAvailable(true);
        }
      } catch (error) {
        console.error('❌ Model load error:', error);
        
        if (mounted) {
          setModelLoading(false);
          setNerAvailable(false);
          setModelError(
            error instanceof Error 
              ? error.message 
              : 'Failed to load AI model. Please refresh the page and try again.'
          );
        }
      }
    };
    
    loadModel();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-ejecutar detección solo cuando NO hay entidades ya (evita doble extracción / mezcla Van Gogh con Mitrovic)
  useEffect(() => {
    const hasExistingEntities = letters.some(
      (l) => (l.mentionedPeople?.length ?? 0) > 0 || (l.mentionedPlaces?.length ?? 0) > 0
    );
    if (nerAvailable && !loading && !autoDetectRan && letters.length > 0 && !hasExistingEntities) {
      console.log('[Auto-detect] Model ready, no entities in letters yet, starting NER extraction...');
      setAutoDetectRan(true);
      handleAutoDetect();
    } else if (letters.length > 0 && hasExistingEntities) {
      console.log('[Review] Letters already have entities (e.g. from CSV), skipping NER extraction');
    }
  }, [nerAvailable, loading, autoDetectRan, letters.length]);

  // Función para auto-detección de entidades
  const handleAutoDetect = async () => {
    if (letters.length === 0) return;
    
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return;
    
    // Verificar si NER está disponible
    if (!nerAvailable && !modelLoading) {
      return; // El botón ya está deshabilitado, esto es solo una precaución
    }
    
    // Si aún se está cargando, esperar
    if (modelLoading) {
      return; // El botón ya está deshabilitado
    }
    
    setLoading(true);
    setExtractionProgress(0);
    setProcessProgress({ current: 0, total: letters.length });
    
    try {
      // Dynamic import para evitar problemas con SSR
      const { extractEntities } = await import('@/lib/ner/localNER');
      
      console.log('[Auto-detect] Starting entity extraction for', letters.length, 'letters');
      
      // Procesar carta por carta para actualizar progreso
      for (let i = 0; i < letters.length; i++) {
        const letter = letters[i];
        const content = letter.content || letter.preview || '';
        
        // Extraer entidades (solo Van Gogh usa diccionario)
        const entities = await extractEntities(content, {
          useDictionary: useVanGoghDictionary,
          dictionaryName: useVanGoghDictionary ? 'vangogh' : undefined,
        });
        
        // Actualizar cartas con entidades detectadas
        const updatedLetter = {
          ...letter,
          mentionedPeople: [...(letter.mentionedPeople || []), ...entities.people],
          mentionedPlaces: [...(letter.mentionedPlaces || []), ...entities.places],
          mentionedOrganizations: [...(letter.mentionedOrganizations || []), ...entities.organizations],
        };
        
        // Actualizar la carta en el array
        setLetters(prev => prev.map((l, idx) => idx === i ? updatedLetter : l));
        
        // Actualizar progreso
        const progress = Math.round(((i + 1) / letters.length) * 100);
        setExtractionProgress(progress);
        setProcessProgress({ current: i + 1, total: letters.length });
      }
      
      console.log('[Auto-detect] Extraction complete');
      
    } catch (error) {
      console.error('[Auto-detect] Error:', error);
      alert('Error during entity extraction. Please try again.');
    } finally {
      setLoading(false);
      setExtractionProgress(100);
      setProcessProgress({ current: 0, total: 0 });
    }
  };

  // Extraer y contar entidades
  const entities = useMemo(() => {
    const people = new Map<string, EntityStats>();
    const places = new Map<string, EntityStats>();
    const organizations = new Map<string, EntityStats>();
    const events = new Map<string, EntityStats>();

    letters.forEach((letter) => {
      const source = letter.filename || 'Carta sin nombre';

      // Personas
      letter.mentionedPeople?.forEach((person) => {
        const existing = people.get(person) || { name: person, count: 0, selected: true, sources: [] };
        existing.count++;
        if (!existing.sources.includes(source)) {
          existing.sources.push(source);
        }
        people.set(person, existing);
      });

      // Lugares
      letter.mentionedPlaces?.forEach((place) => {
        const existing = places.get(place) || { name: place, count: 0, selected: true, sources: [] };
        existing.count++;
        if (!existing.sources.includes(source)) {
          existing.sources.push(source);
        }
        places.set(place, existing);
      });

      // Organizaciones
      letter.mentionedOrganizations?.forEach((org) => {
        const existing = organizations.get(org) || { name: org, count: 0, selected: true, sources: [] };
        existing.count++;
        if (!existing.sources.includes(source)) {
          existing.sources.push(source);
        }
        organizations.set(org, existing);
      });

      // Eventos
      letter.mentionedEvents?.forEach((event) => {
        const existing = events.get(event) || { name: event, count: 0, selected: true, sources: [] };
        existing.count++;
        if (!existing.sources.includes(source)) {
          existing.sources.push(source);
        }
        events.set(event, existing);
      });
    });

    return { people, places, organizations, events };
  }, [letters]);

  // Convertir a arrays y sincronizar con entities
  const [peopleList, setPeopleList] = useState<EntityStats[]>([]);
  const [placesList, setPlacesList] = useState<EntityStats[]>([]);
  const [orgsList, setOrgsList] = useState<EntityStats[]>([]);
  const [eventsList, setEventsList] = useState<EntityStats[]>([]);

  // Sincronizar listas cuando entities cambia
  useEffect(() => {
    setPeopleList(Array.from(entities.people.values()));
    setPlacesList(Array.from(entities.places.values()));
    setOrgsList(Array.from(entities.organizations.values()));
    setEventsList(Array.from(entities.events.values()));
  }, [entities]);

  // Toggle individual
  const toggleEntity = (list: EntityStats[], setList: (list: EntityStats[]) => void, index: number) => {
    const newList = [...list];
    newList[index].selected = !newList[index].selected;
    setList(newList);
  };

  // Toggle todos
  const toggleAll = (list: EntityStats[], setList: (list: EntityStats[]) => void, selected: boolean) => {
    setList(list.map(e => ({ ...e, selected })));
  };

  // Filtrar lista actual
  const currentList = 
    activeTab === 'people' ? peopleList :
    activeTab === 'places' ? placesList :
    activeTab === 'organizations' ? orgsList :
    eventsList;

  const setCurrentList = 
    activeTab === 'people' ? setPeopleList :
    activeTab === 'places' ? setPlacesList :
    activeTab === 'organizations' ? setOrgsList :
    setEventsList;

  const filteredList = currentList
    .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.count - a.count);

  // Contar seleccionados
  const totalSelected = 
    peopleList.filter(e => e.selected).length +
    placesList.filter(e => e.selected).length +
    orgsList.filter(e => e.selected).length +
    eventsList.filter(e => e.selected).length;

  // Aplicar filtros y continuar (NO re-extraer NER; usar entidades ya detectadas)
  const handleContinue = async () => {
    console.log('[Review] Continue button clicked');

    const selectedPeople = new Set(peopleList.filter(e => e.selected).map(e => e.name));
    const selectedPlaces = new Set(placesList.filter(e => e.selected).map(e => e.name));
    const selectedOrgs = new Set(orgsList.filter(e => e.selected).map(e => e.name));
    const selectedEvents = new Set(eventsList.filter(e => e.selected).map(e => e.name));

    console.log('[Review] Saving selected entities:', {
      people: selectedPeople.size,
      places: selectedPlaces.size,
      orgs: selectedOrgs.size,
    });

    const filteredLetters = letters.map(letter => ({
      ...letter,
      mentionedPeople: letter.mentionedPeople?.filter(p => selectedPeople.has(p)),
      mentionedPlaces: letter.mentionedPlaces?.filter(p => selectedPlaces.has(p)),
      mentionedOrganizations: letter.mentionedOrganizations?.filter(o => selectedOrgs.has(o)),
      mentionedEvents: letter.mentionedEvents?.filter(e => selectedEvents.has(e)),
    }));

    setLetters(filteredLetters);

    const isSample = localStorage.getItem('biographyviz_is_sample');
    console.log('[Review] Is sample data?', isSample);

    if (isSample && basics) {
      console.log('[Review] Skipping trips step, saving and going to visualization...');
      try {
        const biographyId = Date.now().toString();
        const serializedPhotos = photos.map(({ file, ...rest }) => rest);
        await saveBiography(biographyId, {
          basics,
          photos: serializedPhotos,
          letters: filteredLetters,
          trips: trips || [],
        });
        localStorage.removeItem('biographyviz_is_sample');
        router.push(`/biography/${biographyId}`);
      } catch (error) {
        console.error('[Review] Error saving sample data biography:', error);
        alert('Error saving biography. Please try again.');
        router.push('/upload/trips');
      }
    } else {
      console.log('[Review] Going to trips step');
      router.push('/upload/trips');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-between w-full">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('wizard.reviewEntities')}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('wizard.reviewEntities')}
                </p>
              </div>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              📧 {letters.length} {t('wizard.letters')}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              ✓ {totalSelected} {t('analytics.mentions')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { key: 'people', label: t('analytics.mentionedPeople'), icon: '👤', count: peopleList.length, selected: peopleList.filter(e => e.selected).length },
              { key: 'places', label: t('analytics.mentionedPlaces'), icon: '📍', count: placesList.length, selected: placesList.filter(e => e.selected).length },
              { key: 'organizations', label: t('analytics.mentionedOrganizations'), icon: '🏢', count: orgsList.length, selected: orgsList.filter(e => e.selected).length },
              { key: 'events', label: t('timeline.eventTypes.trip'), icon: '📅', count: eventsList.length, selected: eventsList.filter(e => e.selected).length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.key
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {tab.selected}/{tab.count}
                </span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6 pb-24">
        {/* Estado de carga del modelo */}
        {modelLoading && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              🤖 {t('wizard.nerLoadingModel')}
            </p>
            <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${modelProgress}%` }}
              />
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {modelProgress}% - {t('wizard.nerFirstLoad')}
            </p>
          </div>
        )}
        
        {/* Info sobre detección automática */}
        {!modelLoading && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  Automatic Entity Detection
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Hybrid approach: Named Entity Recognition (NER) model + domain-specific dictionary.
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li className="flex items-center gap-1">
                    <Check size={12} /> Works completely offline after first load
                  </li>
                  <li className="flex items-center gap-1">
                    <Check size={12} /> No API keys or accounts needed
                  </li>
                  <li className="flex items-center gap-1">
                    <Check size={12} /> Your data never leaves your device
                  </li>
                  <li className="flex items-center gap-1">
                    <Check size={12} /> Free and open-source
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Mensaje de error del modelo */}
        {modelError && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  AI Entity Detection Unavailable
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                  {modelError}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => {
                      // Continuar sin NER
                      setModelError(null);
                      setModelLoading(false);
                    }}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                  >
                    Continue Without AI
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botón de auto-detección */}
        {!modelLoading && (
          <div className="mb-6">
            <button
              onClick={handleAutoDetect}
              disabled={loading || letters.length === 0 || !nerAvailable}
              className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                loading || letters.length === 0 || !nerAvailable
                  ? 'bg-gray-400 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Detecting entities... ({extractionProgress}% complete)
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Auto-detect Entities
                </>
              )}
            </button>

            {/* Barra de progreso visual */}
            {loading && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Processing {letters.length} letters...
                  </span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {extractionProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${extractionProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 text-center">
                  This may take a few moments depending on the number of letters
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* Search and actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={() => toggleAll(currentList, setCurrentList, true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
            >
              {t('common.selectAll')}
            </button>

            <button
              onClick={() => toggleAll(currentList, setCurrentList, false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {t('common.deselectAll')}
            </button>
          </div>
        </div>

        {/* Entity list */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredList.length === 0 ? (
              <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                {searchTerm ? t('common.search') : t('wizard.reviewEntities')}
              </div>
            ) : (
              filteredList.map((entity, idx) => {
                const originalIndex = currentList.findIndex(e => e.name === entity.name);
                return (
                  <div
                    key={entity.name}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <label className="flex items-start gap-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entity.selected}
                        onChange={() => toggleEntity(currentList, setCurrentList, originalIndex)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {entity.name}
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {entity.count} {entity.count === 1 ? t('analytics.mention') : t('analytics.mentions_plural')}
                          </span>
                        </div>

                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{t('analytics.mentions')}:</span>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {entity.sources.slice(0, 3).map((source, idx) => (
                              <span key={idx} className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs">
                                {source}
                              </span>
                            ))}
                            {entity.sources.length > 3 && (
                              <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs">
                                +{entity.sources.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {totalSelected} {t('analytics.mentions')}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="px-6 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('common.back')}
            </button>

            <button
              onClick={handleContinue}
              className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
            >
              {t('common.continue')}: {t('wizard.trips')}
            </button>
          </div>
        </div>
      </div>

      {/* Debug panel - remover en producción */}
      <div className="fixed bottom-20 right-4 p-4 bg-red-100 dark:bg-red-900/80 rounded-lg shadow-lg z-50 flex gap-2">
        <button
          type="button"
          onClick={() => {
            console.log('========== 🐛 DEBUG SNAPSHOT ==========');
            console.log('Dataset:', localStorage.getItem('biographyviz_is_sample'));
            console.log('Letters:', letters.length);
            console.log('Photos:', photos.length);
            console.log('Trips:', trips.length);
            console.log('---');
            console.log('First letter:', letters[0]);
            console.log('First photo:', photos[0]);
            console.log('First trip:', trips[0]);
            console.log('---');
            console.log('People (first 5):', peopleList.slice(0, 5).map(p => p.name));
            console.log('Use Van Gogh dict?', useVanGoghDictionary);
            console.log('Van Gogh detected?', isVanGoghDetected);
            console.log('=====================================');
          }}
          className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          🐛 Debug
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('Clear ALL data?')) {
              Object.keys(localStorage)
                .filter(k => k.startsWith('biographyviz'))
                .forEach(k => localStorage.removeItem(k));
              if (typeof indexedDB !== 'undefined') {
                indexedDB.deleteDatabase('BiographyViz');
              }
              window.location.reload();
            }
          }}
          className="px-3 py-1.5 bg-red-800 text-white rounded text-sm hover:bg-red-900"
        >
          🗑️ Reset
        </button>
      </div>
    </div>
  );
}

