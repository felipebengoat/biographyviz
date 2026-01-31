export const translations = {
  en: {
    // Common
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      continue: 'Continue',
      back: 'Back',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      download: 'Download',
      upload: 'Upload',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
    },
    
    // Navigation
    nav: {
      home: 'Home',
      timeline: 'Timeline',
      network: 'Network',
      map: 'Map',
      analytics: 'Analytics',
      settings: 'Settings',
    },
    
    // Wizard
    wizard: {
      basicInfo: 'Basic Information',
      photos: 'Photos',
      letters: 'Letters',
      trips: 'Trips',
          reviewEntities: 'Review Entities',
          reviewEntitiesDescription: 'Select the entities you want to include in the biography',
          preview: 'Preview',
      
      // Letters page
      lettersTitle: 'Upload Letters',
      lettersDescription: 'Upload a CSV file with your letters collection',
      downloadTemplate: 'Download Template',
      downloadInstructions: 'Download Instructions',
      templateWithInstructions: 'Template with Instructions',
      emptyTemplate: 'Empty Template',
      detailedInstructions: 'Detailed Instructions',
      
      helpTitle: 'First time? Download the template',
      helpDescription: 'The CSV file must have specific columns. Download our template with instructions and examples.',
      
      columnsSummary: 'View column summary (19 total)',
      columnsYouFill: 'Columns YOU must fill (9)',
      columnsSystemFills: 'Columns SYSTEM fills (6)',
      columnsOptional: 'Optional columns (4)',
      
      // Photos page
      photosTitle: 'Upload Photos',
      photosDescription: 'Upload photos from your collection. The location and year will be extracted from the filename.',
      photoFormatHelp: 'Recommended filename format: "Location_Year.jpg" (e.g., "Santiago_1990.jpg")',
      photosLoaded: 'Photos loaded',
      location: 'Location',
      year: 'Year',
      description: 'Description',
      
      // Stats
      totalLetters: 'Total letters',
      withOrigin: 'With origin (placeFrom)',
      withDestination: 'With destination (placeTo)',
      withDates: 'With dates',
      languages: 'Languages',
      uniquePeople: 'Unique people',
      uniquePlaces: 'Unique places',
      
      // Letters additional
      viewRequiredColumns: 'View required columns (19 total)',
      requiredColumns: 'Required columns',
      systemColumns: 'System fills automatically',
      optionalColumns: 'Optional columns',
      leaveEmpty: 'Leave these empty - the system fills them automatically',
      fileProcessedSuccess: 'File processed successfully',
      processingFile: 'Processing file...',
      processingFileDescription: 'Please wait while we process your CSV file.',
      validationErrors: 'Validation errors',
      validationErrorsDescription: 'The following errors were found:',
      emptyFile: 'Empty file',
      emptyFileDescription: 'The CSV file does not contain valid data. Please check the format and try again.',
      skipReview: 'Skip review',
      fileProcessingError: 'Error processing file: {error}',
      unknownError: 'Unknown error',
      unknown: 'Unknown',
      
      // Column descriptions
      columnDescriptions: {
        id: 'Unique identifier (e.g., letter-001)',
        sobre: 'Envelope code (optional)',
        title: 'Descriptive title',
        date: 'Date in YYYY-MM-DD format',
        sender: 'Who wrote the letter',
        recipient: 'Who received the letter',
        placeFrom: 'City where letter was sent FROM',
        placeTo: 'City where letter was sent TO',
        content: 'Full letter text',
      },
      
      // Tooltip
      tooltip: {
        csvFile: 'CSV file with 19 columns',
        requiredColumns: 'Required columns: id, title, date, sender, recipient, placeFrom, placeTo, content',
        dateFormat: 'Date format: YYYY-MM-DD',
        encoding: 'Encoding: UTF-8',
      },
      
      // Basic info
      basicInfoTitle: 'Basic Information',
      basicInfoDescription: 'Enter the personal information of the biographee',
      firstName: 'First Name',
      lastName: 'Last Name',
      birthYear: 'Birth Year',
      deathYear: 'Death Year (optional)',
      shortBio: 'Short Biography',
      profilePhoto: 'Profile Photo (optional)',
      bioCharCount: 'characters',
      
      // Trips
      tripsTitle: 'Upload Trips',
      tripsDescription: 'Upload a CSV file with trip information',
      downloadTemplate: 'Download Template CSV',
      uniqueCountries: 'Unique countries',
      uniqueDestinations: 'Unique destinations',
      
      // Trip columns
      tripColumns: {
        id: 'Unique identifier (e.g., trip-001)',
        destination: 'Destination city or country',
        startDate: 'Start date (YYYY-MM-DD)',
        endDate: 'End date (YYYY-MM-DD)',
        purpose: 'Trip purpose',
      },
      
      // Basic info additional
      basicSubtitle: 'Create interactive biography visualizations step by step',
      biographyPlaceholder: 'Write a brief biography (maximum 500 characters)',
      dragPhotoHere: 'Drag photo here or click to select',
      allowedFormats: 'Allowed formats',
      yearExample: 'E.g.: 1920',
      yearRange: 'Year Range',
      present: 'Present',
      noBasicInfo: 'No basic information',
      errorSavingBiography: 'Error saving biography. Please try again.',
      
      // Validation errors
      errors: {
        firstNameRequired: 'First name is required',
        lastNameRequired: 'Last name is required',
        birthYearRequired: 'Birth year is required',
        invalidYear: 'Enter a valid year ({min}-{max})',
        deathYearBeforeBirth: 'Death year must be after birth year',
        shortBioRequired: 'Short biography is required',
        shortBioTooLong: 'Biography cannot exceed 500 characters',
      },
      
      // Photos additional
      dragFilesHere: 'Drag files here or click to select',
      dropFilesHere: 'Drop files here',
      filesUploaded: 'Files uploaded',
      filesCount: '{current} of {max} files',
      fileTypeNotAllowed: 'File type not allowed',
      fileLimitReached: 'File limit reached',
      rejectedFiles: 'Rejected files',
      removeFile: 'Remove file',
      editPhoto: 'Edit photo',
      photoTitlePlaceholder: 'Photo title',
      photoDescriptionPlaceholder: 'Photo description',
      locationExample: 'E.g.: Santiago, Vienna',
      category: 'Category',
      
      // Photo categories
      photoCategories: {
        family: 'Family',
        education: 'Education',
        travel: 'Travel',
        work: 'Work',
        achievement: 'Achievement',
        other: 'Other',
      },
      
      // NER
      nerLoadingModel: 'Loading AI model for entity detection...',
      nerFirstLoad: 'First load only, model will be cached',
      nerLocalAI: 'Local AI Entity Detection',
      nerDescription: 'Using on-device AI to detect people, places, and organizations mentioned in your letters.',
      nerFeature1: 'Works completely offline after first load',
      nerFeature2: 'No API keys or accounts needed',
      nerFeature3: 'Your data never leaves your device',
      nerFeature4: 'Free and open-source',
      nerAutoDetect: 'Auto-detect Entities (Local AI)',
      nerProcessing: 'Processing',
    },
    
    // Timeline
    timeline: {
      title: 'Biography Timeline',
      filters: 'Filters',
      showLetters: 'Show Letters',
      showPhotos: 'Show Photos',
      showTrips: 'Show Trips',
      dateRange: 'Date Range',
      searchPlaceholder: 'Search events...',
      layout: 'Layout',
      singleLane: 'Single Lane',
      doubleLane: 'Double Lane',
      tripleLane: 'Triple Lane',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      
      eventTypes: {
        letter: 'Letter',
        photo: 'Photo',
        trip: 'Trip',
      },
      
      mentionedPeople: 'Mentioned people',
      mentionedPlaces: 'Mentioned places',
      sender: 'From',
      recipient: 'To',
      closeDetails: 'Close details',
      
      // Event titles
      birthTitle: 'Birth of {{name}}',
      deathTitle: 'Death of {{name}}',
      letterTitle: 'Letter from {{sender}} to {{recipient}}, {{year}}',
      letterFromTitle: 'Letter from {{sender}}, {{year}}',
      letterToTitle: 'Letter to {{recipient}}, {{year}}',
      letterGenericTitle: 'Letter, {{year}}',
      letterDescription: 'From {{from}} to {{to}}',
      tripTitle: 'Trip to {{destination}}, {{country}}',
    },
    
    // Network
    network: {
      title: 'Network Analysis',
      filters: 'Filters',
      showPeople: 'Show People',
      showPlaces: 'Show Places',
      highlightActive: 'Highlight Active Only',
      minConnections: 'Minimum Connections',
      
      visualization: 'Visualization',
      sizeByDegree: 'Size by Degree',
      sizeByBetweenness: 'Size by Betweenness',
      colorByTime: 'Color by Time Period',
      
      physics: 'Physics',
      enablePhysics: 'Enable Physics',
      gravity: 'Gravity',
      
      metrics: 'Network Metrics',
      totalNodes: 'Total Nodes',
      totalEdges: 'Total Edges',
      avgDegree: 'Average Degree',
      density: 'Density',
      
      topByDegree: 'Top by Degree',
      topByBetweenness: 'Top by Betweenness',
      
      egoNetwork: 'Ego Network',
      selectPerson: 'Select a person to view their network',
      
      export: 'Export',
      exportGEXF: 'Export GEXF (Gephi)',
      exportJSON: 'Export JSON',
      exportCSV: 'Export CSV',
      exportPNG: 'Export PNG',
      
      fitView: 'Fit View',
      
      // Panel sections
      mentionedPeople: 'Mentioned People',
      participants: 'Participants',
      mentioned: 'Mentioned',
      both: 'Both',
      mentionedPlaces: 'Mentioned Places',
      showPlaces: 'Show Places',
      
      visualizationOptions: 'Visualization Options',
      colorByDate: 'Color letters by date',
      hierarchicalLayout: 'Hierarchical layout',
      fixCentralPerson: 'Fix {name} at center',
      
      networkHierarchy: 'Network Hierarchy',
      level1: 'LEVEL 1: Central Person',
      level2: 'LEVEL 2: Correspondents',
      level3: 'LEVEL 3: Letters',
      level4: 'LEVEL 4: Mentioned Entities',
      
      centralPerson: 'Central person',
      correspondents: 'Correspondents (wrote/received letters)',
      letters: 'Letters (connection points)',
      mentionedEntities: 'Mentioned entities',
      
      connectionTypes: 'CONNECTIONS',
      letterSent: 'Letter sent',
      mentionedIn: 'Mentioned',
      
      // Stats
      people: 'People',
      places: 'Places',
      organizations: 'Organizations',
    },
    
    // Map
    map: {
      title: 'Geographic Map',
      filters: 'Filters',
      showLetters: 'Show Letters',
      showPhotos: 'Show Photos',
      showTrips: 'Show Trips',
      showRoutes: 'Show Travel Routes',
      
      stats: 'Statistics',
      eventsMapped: 'Events mapped',
      uniqueLocations: 'Unique locations',
      
      geocoding: 'Geocoding locations',
      selectedEvent: 'Selected Event',
      
      from: 'From',
      to: 'To',
      origin: 'Origin',
      destination: 'Destination',
      viewDetails: 'View more details →',
      
      noEvents: 'No events with geographic location',
      noEventsDescription: 'Events need location information to appear on the map',
      adjustFilters: 'No visible events. Adjust filters to see the map.',
      loading: 'Loading map...',
    },
    
    // Analytics
    analytics: {
      title: 'Analytics Dashboard',
      overview: 'Overview',
      totalEvents: 'Total Events',
      dateRange: 'Date Range',
      correspondence: 'Correspondence',
      totalLetters: 'Total Letters',
      totalPhotos: 'Total Photos',
      totalTrips: 'Total Trips',
      
      network: 'Network',
      totalPeople: 'Total People',
      topCorrespondents: 'Top Correspondents',
      
      geography: 'Geography',
      totalPlaces: 'Total Places',
      topDestinations: 'Top Destinations',
      
      eventsPerDecade: 'Events by Decade',
      activityTimeline: 'Activity Timeline',
      languageDistribution: 'Language Distribution',
      
      mentions: 'Mentions',
      mentionedPeople: 'Mentioned People',
      mentionedPlaces: 'Mentioned Places',
      mentionedOrganizations: 'Mentioned Organizations',
      
      mention: 'mention',
      mentions_plural: 'mentions',
    },
    
    // Errors
    errors: {
      fileUploadFailed: 'File upload failed',
      invalidCSV: 'Invalid CSV file',
      invalidDate: 'Invalid date format. Use YYYY-MM-DD',
      requiredField: 'This field is required',
      geocodingFailed: 'Geocoding failed for some locations',
    },
  },
  
  es: {
    // Common
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar',
      continue: 'Continuar',
      back: 'Atrás',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      download: 'Descargar',
      upload: 'Subir',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      selectAll: 'Seleccionar Todo',
      deselectAll: 'Deseleccionar Todo',
    },
    
    // Navigation
    nav: {
      home: 'Inicio',
      timeline: 'Línea de Tiempo',
      network: 'Red',
      map: 'Mapa',
      analytics: 'Análisis',
      settings: 'Configuración',
    },
    
    // Wizard
    wizard: {
      basicInfo: 'Información Básica',
      photos: 'Fotografías',
      letters: 'Cartas',
      trips: 'Viajes',
          reviewEntities: 'Revisar Entidades',
          reviewEntitiesDescription: 'Selecciona las entidades que quieres incluir en la biografía',
          preview: 'Vista Previa',
      
      // Letters page
      lettersTitle: 'Subir Cartas',
      lettersDescription: 'Sube un archivo CSV con tu colección de cartas',
      downloadTemplate: 'Descargar Plantilla',
      downloadInstructions: 'Descargar Instrucciones',
      templateWithInstructions: 'Plantilla con Instrucciones',
      emptyTemplate: 'Plantilla Vacía',
      detailedInstructions: 'Instrucciones Detalladas',
      
      helpTitle: '¿Primera vez? Descarga la plantilla',
      helpDescription: 'El archivo CSV debe tener columnas específicas. Descarga nuestra plantilla con instrucciones y ejemplos.',
      
      columnsSummary: 'Ver resumen de columnas (19 total)',
      columnsYouFill: 'Columnas que DEBES llenar (9)',
      columnsSystemFills: 'Columnas que el SISTEMA llena (6)',
      columnsOptional: 'Columnas opcionales (4)',
      
      // Photos page
      photosTitle: 'Subir Fotografías',
      photosDescription: 'Sube fotografías de tu colección. La ubicación y el año se extraerán del nombre del archivo.',
      photoFormatHelp: 'Formato de nombre recomendado: "Ubicación_Año.jpg" (ej: "Santiago_1990.jpg")',
      photosLoaded: 'Fotografías cargadas',
      location: 'Ubicación',
      year: 'Año',
      description: 'Descripción',
      
      // Stats
      totalLetters: 'Cartas totales',
      withOrigin: 'Con origen (placeFrom)',
      withDestination: 'Con destino (placeTo)',
      withDates: 'Con fechas',
      languages: 'Idiomas',
      uniquePeople: 'Personas únicas',
      uniquePlaces: 'Lugares únicos',
      
      // Letters additional
      viewRequiredColumns: 'Ver columnas requeridas (19 total)',
      requiredColumns: 'Columnas requeridas',
      systemColumns: 'El sistema llena automáticamente',
      optionalColumns: 'Columnas opcionales',
      leaveEmpty: 'Dejar vacías - el sistema las llena automáticamente',
      fileProcessedSuccess: 'Archivo procesado exitosamente',
      processingFile: 'Procesando archivo...',
      processingFileDescription: 'Por favor espera mientras procesamos tu archivo CSV.',
      validationErrors: 'Errores de validación',
      validationErrorsDescription: 'Se encontraron los siguientes errores:',
      emptyFile: 'Archivo vacío',
      emptyFileDescription: 'El archivo CSV no contiene datos válidos. Por favor verifica el formato y vuelve a intentar.',
      skipReview: 'Saltar revisión',
      fileProcessingError: 'Error al procesar el archivo: {error}',
      unknownError: 'Error desconocido',
      unknown: 'Desconocido',
      
      // Column descriptions
      columnDescriptions: {
        id: 'Identificador único (ej: letter-001)',
        sobre: 'Código del sobre (opcional)',
        title: 'Título descriptivo',
        date: 'Fecha en formato YYYY-MM-DD',
        sender: 'Quién escribió la carta',
        recipient: 'Quién recibió la carta',
        placeFrom: 'Ciudad DESDE donde se envió',
        placeTo: 'Ciudad HACIA donde se envió',
        content: 'Texto completo de la carta',
      },
      
      // Tooltip
      tooltip: {
        csvFile: 'Archivo CSV con 19 columnas',
        requiredColumns: 'Columnas requeridas: id, title, date, sender, recipient, placeFrom, placeTo, content',
        dateFormat: 'Formato de fecha: YYYY-MM-DD',
        encoding: 'Codificación: UTF-8',
      },
      
      // Basic info
      basicInfoTitle: 'Información Básica',
      basicInfoDescription: 'Ingresa los datos personales del biografiado',
      firstName: 'Nombre',
      lastName: 'Apellido',
      birthYear: 'Año de Nacimiento',
      deathYear: 'Año de Fallecimiento (opcional)',
      shortBio: 'Biografía Breve',
      profilePhoto: 'Foto de Perfil (opcional)',
      bioCharCount: 'caracteres',
      
      // Trips
      tripsTitle: 'Subir Viajes',
      tripsDescription: 'Sube un archivo CSV con información de viajes',
      downloadTemplate: 'Descargar Plantilla CSV',
      uniqueCountries: 'Países únicos',
      uniqueDestinations: 'Destinos únicos',
      
      // Trip columns
      tripColumns: {
        id: 'Identificador único (ej: trip-001)',
        destination: 'Ciudad o país de destino',
        startDate: 'Fecha de inicio (YYYY-MM-DD)',
        endDate: 'Fecha de fin (YYYY-MM-DD)',
        purpose: 'Propósito del viaje',
      },
      
      // Basic info additional
      basicSubtitle: 'Crea visualizaciones interactivas de biografías paso a paso',
      biographyPlaceholder: 'Escribe una breve biografía (máximo 500 caracteres)',
      dragPhotoHere: 'Arrastra la foto aquí o haz clic para seleccionar',
      allowedFormats: 'Formatos permitidos',
      yearExample: 'Ej: 1920',
      yearRange: 'Rango de Años',
      present: 'Presente',
      noBasicInfo: 'No hay información básica',
      errorSavingBiography: 'Error al guardar la biografía. Por favor, inténtalo de nuevo.',
      
      // Validation errors
      errors: {
        firstNameRequired: 'El nombre es requerido',
        lastNameRequired: 'El apellido es requerido',
        birthYearRequired: 'El año de nacimiento es requerido',
        invalidYear: 'Ingresa un año válido ({min}-{max})',
        deathYearBeforeBirth: 'El año de fallecimiento debe ser posterior al de nacimiento',
        shortBioRequired: 'La biografía breve es requerida',
        shortBioTooLong: 'La biografía no puede exceder 500 caracteres',
      },
      
      // Photos additional
      dragFilesHere: 'Arrastra archivos aquí o haz clic para seleccionar',
      dropFilesHere: 'Suelta los archivos aquí',
      filesUploaded: 'Archivos subidos',
      filesCount: '{current} de {max} archivos',
      fileTypeNotAllowed: 'Tipo de archivo no permitido',
      fileLimitReached: 'Límite de archivos alcanzado',
      rejectedFiles: 'Archivos rechazados',
      removeFile: 'Eliminar archivo',
      editPhoto: 'Editar foto',
      photoTitlePlaceholder: 'Título de la foto',
      photoDescriptionPlaceholder: 'Descripción de la foto',
      locationExample: 'Ej: Santiago, Vienna',
      category: 'Categoría',
      
      // Photo categories
      photoCategories: {
        family: 'Familia',
        education: 'Educación',
        travel: 'Viajes',
        work: 'Trabajo',
        achievement: 'Logros',
        other: 'Otro',
      },
      
      // NER
      nerLoadingModel: 'Cargando modelo de IA para detección de entidades...',
      nerFirstLoad: 'Solo primera carga, el modelo se guardará en caché',
      nerLocalAI: 'Detección de Entidades con IA Local',
      nerDescription: 'Usando IA en el dispositivo para detectar personas, lugares y organizaciones mencionadas en tus cartas.',
      nerFeature1: 'Funciona completamente offline después de la primera carga',
      nerFeature2: 'No se necesitan claves de API ni cuentas',
      nerFeature3: 'Tus datos nunca salen de tu dispositivo',
      nerFeature4: 'Gratis y de código abierto',
      nerAutoDetect: 'Auto-detectar Entidades (IA Local)',
      nerProcessing: 'Procesando',
    },
    
    // Timeline
    timeline: {
      title: 'Línea de Tiempo Biográfica',
      filters: 'Filtros',
      showLetters: 'Mostrar Cartas',
      showPhotos: 'Mostrar Fotos',
      showTrips: 'Mostrar Viajes',
      dateRange: 'Rango de Fechas',
      searchPlaceholder: 'Buscar eventos...',
      layout: 'Diseño',
      singleLane: 'Carril Único',
      doubleLane: 'Doble Carril',
      tripleLane: 'Triple Carril',
      darkMode: 'Modo Oscuro',
      lightMode: 'Modo Claro',
      
      eventTypes: {
        letter: 'Carta',
        photo: 'Foto',
        trip: 'Viaje',
      },
      
      mentionedPeople: 'Personas mencionadas',
      mentionedPlaces: 'Lugares mencionados',
      sender: 'De',
      recipient: 'Para',
      closeDetails: 'Cerrar detalles',
      
      // Event titles
      birthTitle: 'Nacimiento de {{name}}',
      deathTitle: 'Muerte de {{name}}',
      letterTitle: 'Carta de {{sender}} a {{recipient}}, {{year}}',
      letterFromTitle: 'Carta de {{sender}}, {{year}}',
      letterToTitle: 'Carta a {{recipient}}, {{year}}',
      letterGenericTitle: 'Carta, {{year}}',
      letterDescription: 'De {{from}} a {{to}}',
      tripTitle: 'Viaje a {{destination}}, {{country}}',
    },
    
    // Network
    network: {
      title: 'Análisis de Red',
      filters: 'Filtros',
      showPeople: 'Mostrar Personas',
      showPlaces: 'Mostrar Lugares',
      highlightActive: 'Resaltar Solo Activos',
      
      // Panel sections
      mentionedPeople: 'Personas Mencionadas',
      participants: 'Participantes',
      mentioned: 'Mencionados',
      both: 'Ambos',
      mentionedPlaces: 'Lugares Mencionados',
      showPlaces: 'Mostrar Lugares',
      
      visualizationOptions: 'Opciones de Visualización',
      colorByDate: 'Colorear cartas por fecha',
      hierarchicalLayout: 'Layout jerárquico',
      fixCentralPerson: 'Fijar a {name} en el centro',
      
      networkHierarchy: 'Jerarquía de Red',
      level1: 'NIVEL 1: Persona Central',
      level2: 'NIVEL 2: Correspondientes',
      level3: 'NIVEL 3: Cartas',
      level4: 'NIVEL 4: Entidades Mencionadas',
      
      centralPerson: 'Persona central',
      correspondents: 'Correspondientes (escribieron/recibieron cartas)',
      letters: 'Cartas (puntos de conexión)',
      mentionedEntities: 'Entidades mencionadas',
      
      connectionTypes: 'CONEXIONES',
      letterSent: 'Carta enviada',
      mentionedIn: 'Mencionado',
      
      // Stats
      people: 'Personas',
      places: 'Lugares',
      organizations: 'Organizaciones',
      minConnections: 'Conexiones Mínimas',
      
      visualization: 'Visualización',
      sizeByDegree: 'Tamaño por Grado',
      sizeByBetweenness: 'Tamaño por Intermediación',
      colorByTime: 'Color por Período',
      
      physics: 'Física',
      enablePhysics: 'Habilitar Física',
      gravity: 'Gravedad',
      
      metrics: 'Métricas de Red',
      totalNodes: 'Nodos Totales',
      totalEdges: 'Enlaces Totales',
      avgDegree: 'Grado Promedio',
      density: 'Densidad',
      
      topByDegree: 'Top por Grado',
      topByBetweenness: 'Top por Intermediación',
      
      egoNetwork: 'Red Ego',
      selectPerson: 'Selecciona una persona para ver su red',
      
      export: 'Exportar',
      exportGEXF: 'Exportar GEXF (Gephi)',
      exportJSON: 'Exportar JSON',
      exportCSV: 'Exportar CSV',
      exportPNG: 'Exportar PNG',
      
      fitView: 'Ajustar Vista',
    },
    
    // Map
    map: {
      title: 'Mapa Geográfico',
      filters: 'Filtros',
      showLetters: 'Mostrar Cartas',
      showPhotos: 'Mostrar Fotos',
      showTrips: 'Mostrar Viajes',
      showRoutes: 'Mostrar Rutas de Viaje',
      
      stats: 'Estadísticas',
      eventsMapped: 'Eventos mapeados',
      uniqueLocations: 'Ubicaciones únicas',
      
      geocoding: 'Geocodificando ubicaciones',
      selectedEvent: 'Evento Seleccionado',
      
      from: 'De',
      to: 'Para',
      origin: 'Origen',
      destination: 'Destino',
      viewDetails: 'Ver más detalles →',
      
      noEvents: 'No hay eventos con ubicación geográfica',
      noEventsDescription: 'Los eventos necesitan información de lugar para aparecer en el mapa',
      adjustFilters: 'No hay eventos visibles. Ajusta los filtros para ver el mapa.',
      loading: 'Cargando mapa...',
    },
    
    // Analytics
    analytics: {
      title: 'Panel de Análisis',
      overview: 'Resumen',
      totalEvents: 'Eventos Totales',
      dateRange: 'Rango de Fechas',
      correspondence: 'Correspondencia',
      totalLetters: 'Cartas Totales',
      totalPhotos: 'Fotos Totales',
      totalTrips: 'Viajes Totales',
      
      network: 'Red',
      totalPeople: 'Personas Totales',
      topCorrespondents: 'Principales Corresponsales',
      
      geography: 'Geografía',
      totalPlaces: 'Lugares Totales',
      topDestinations: 'Principales Destinos',
      
      eventsPerDecade: 'Eventos por Década',
      activityTimeline: 'Línea de Tiempo de Actividad',
      languageDistribution: 'Distribución de Idiomas',
      
      mentions: 'Menciones',
      mentionedPeople: 'Personas Mencionadas',
      mentionedPlaces: 'Lugares Mencionados',
      mentionedOrganizations: 'Organizaciones Mencionadas',
      
      mention: 'mención',
      mentions_plural: 'menciones',
    },
    
    // Errors
    errors: {
      fileUploadFailed: 'Error al subir archivo',
      invalidCSV: 'Archivo CSV inválido',
      invalidDate: 'Formato de fecha inválido. Use YYYY-MM-DD',
      requiredField: 'Este campo es obligatorio',
      geocodingFailed: 'Geocodificación falló para algunas ubicaciones',
    },
  },
};

export type Language = 'en' | 'es';
export type TranslationKey = keyof typeof translations.en;
