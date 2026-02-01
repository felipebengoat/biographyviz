# BiographyViz

A web-based tool for visualizing and analyzing biographical data through interactive timelines, network graphs, geographic maps, and statistical dashboards.

Creators: Lise Feringa, Christina Maliariti, Felipe Bengoa

## Overview

BiographyViz transforms biographical archives—letters, photographs, travel logs—into queryable, visual networks. Designed for digital humanities researchers, archivists, and historians, the tool enables pattern discovery and relational analysis at scale while maintaining researcher control over data interpretation.

## Key Features

### Four Integrated Visualizations

1. **Timeline View**: Chronological display of letters, photos, and travels with type-based filtering and date range selection
2. **Network View**: Interactive graph visualization revealing relationships between people, places, and organizations with hierarchical and force-directed layouts
3. **Map View**: Geographic plotting of correspondence origins, travel routes, and photo locations with cluster analysis
4. **Analytics Dashboard**: Statistical summaries including entity frequencies, temporal distributions, and activity patterns

### Privacy-First Architecture

- **Client-side processing**: All data remains in the browser (IndexedDB storage)
- **No external accounts**: No authentication or cloud storage required
- **Offline capability**: Works completely offline after initial model download
- **Local NER**: On-device Named Entity Recognition using Transformers.js

### Automated Entity Extraction

- **Hybrid NER approach**: Combines BERT-base model with domain-specific dictionaries
- **Multi-entity support**: Detects people, places, and organizations
- **Manual review interface**: Users validate and edit extracted entities before visualization
- **Accuracy**: Approximately 85-90% on historical correspondence

## Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Visualizations**: Leaflet (maps), vis.js (networks), Recharts (analytics)
- **NER**: Transformers.js (BERT-base-NER), custom Van Gogh dictionary
- **Storage**: IndexedDB (client-side persistence)
- **Internationalization**: English and Spanish

## Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/biographyviz.git
cd biographyviz
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Open browser at `http://localhost:3000`

### Build for Production
```bash
npm run build
npm start
```

## Usage

### Quick Start with Sample Data

BiographyViz includes two sample datasets for immediate exploration:

1. **Luis Mitrovic Balbontín**: Chilean architect and photographer (1911-2008), Bauhaus-trained professional
2. **Vincent van Gogh**: Dutch post-impressionist painter (1853-1890)

Click "Load Sample Data" buttons in the wizard's first step to load either dataset instantly.

### Custom Data Upload

#### Required CSV Format

**Letters** (`letters.csv`):
```csv
id,date,sender,recipient,place,content,mentioned_people,mentioned_places,mentioned_organizations
letter_1,1950-03-15,Luis Mitrovic,Nora Smith,Santiago,"Letter content here",John Doe,Paris,UNESCO
```

**Photos** (`photo-list.json`):
Photos are defined in a JSON file with metadata extracted from filenames:
```json
[
  { "filename": "Budapest, Fischerbastei 1936.jpg" },
  { "filename": "Viena, 1937.png" }
]
```
Filename format: `Title, Place, Year.ext` — metadata is automatically parsed from the filename.

**Trips** (optional, `trips.csv`):
```csv
id,startDate,endDate,from,to,purpose
trip_1,1935-01-10,1935-06-30,Santiago,Vienna,Study at Bauhaus
```
Note: Both `startDate`/`endDate` (camelCase) and `start_date`/`end_date` (snake_case) column names are supported.

#### Upload Workflow

1. Navigate to "Upload Data" wizard
2. Upload CSV files (drag-and-drop or file picker)
3. Review and validate extracted entities
4. Add trips data (optional, skipped for sample datasets)
5. Proceed to visualization dashboard

**Note**: When using sample data, the workflow automatically skips the trips step and redirects directly to the visualization.

### Entity Extraction

BiographyViz uses a hybrid Named Entity Recognition approach:

1. **Automated detection**: BERT-base NER model identifies entities in letter content
2. **Dictionary enhancement**: Domain-specific dictionaries (e.g., Van Gogh corpus) supplement model predictions
3. **Manual review**: Users validate, merge, or remove detected entities
4. **Selective activation**: Van Gogh dictionary only activates for Van Gogh datasets (automatic detection)

## Technical Architecture

### Design Decisions

#### Why Client-Side Processing?

Academic users often lack technical infrastructure (servers, databases, APIs). BiographyViz prioritizes:
- **Zero setup**: No Python, no databases, no API keys
- **Data sovereignty**: Sensitive archival material never leaves user's device
- **Accessibility**: Works on any modern browser without installation

#### Why Transformers.js Over spaCy?

While spaCy offers superior NER accuracy (95% vs 85-90%), it requires:
- Python runtime
- Backend server infrastructure
- Complex installation for non-technical users

Transformers.js enables:
- Pure JavaScript execution in browser
- No backend dependencies
- Acceptable accuracy trade-off for biographical data

The hybrid approach (model + dictionary) bridges the accuracy gap for domain-specific corpora.

#### Why Webpack Over Turbopack?

Next.js 15+ defaults to Turbopack, which has immature WebAssembly support. Transformers.js relies on ONNX runtime (WebAssembly), requiring stable WASM handling. We force Webpack mode for reliability:
```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },
};

export default nextConfig;
```

### File Structure
```
biographyviz/
├── app/
│   ├── (wizard)/           # Data upload wizard
│   │   └── upload/         # Wizard steps (basic, letters, photos, review-entities, trips)
│   ├── biography/[id]/     # Visualization dashboard
│   │   └── analytics/      # Analytics sub-page
│   └── layout.tsx
├── components/
│   ├── visualizations/
│   │   ├── Timeline/       # Timeline components
│   │   ├── Network/        # Network graph (vis.js)
│   │   └── Map/            # Geographic map (Leaflet)
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   └── wizard/             # Wizard-specific components
├── lib/
│   ├── ner/
│   │   ├── localNER.ts     # NER engine (Transformers.js)
│   │   └── vanGoghDictionary.ts
│   ├── i18n/               # Internationalization
│   │   ├── LanguageContext.tsx
│   │   └── translations.ts
│   ├── storage/
│   │   └── indexed-db.ts   # IndexedDB persistence
│   ├── sampleData.ts
│   └── photoParser.ts
├── public/
│   └── sample-data/        # Pre-loaded datasets (mitrovic, vangogh)
└── types/                  # TypeScript type definitions
```

## Known Limitations

### NER Accuracy

- **Historical names**: 19th-century names (Gauguin, Rappard) not in training data may be fragmented
- **Multilingual corpora**: Mixing Spanish, German, and English reduces accuracy. For this case study, majority of English letters were selected.
- **Compound entities**: "World Bank" occasionally split into separate entities

### Performance

- **First load**: NER model download (130MB) takes 10-30 seconds on first use
- **Large datasets**: Processing 500+ letters may take 2-3 minutes
- **Text truncation**: Letters truncated to 2000 characters for performance

### Browser Compatibility

- Requires modern browsers with WebAssembly support (Chrome 87+, Firefox 89+, Safari 15+)
- Not optimized for mobile devices (desktop recommended)

## Sample Datasets

### Luis Mitrovic Archive

**Source**: Fundacion Enterreno personal archive collection  
**Period**: 1911-2008  
**Content**: 19 letters, 15 photographs, travel logs  
**Languages**: Mostly English , some Spanish words.
**Note**: Sample represents approximately 0.5% of complete archive (3,500+ letters)

### Van Gogh Letters

**Source**: Public domain correspondence  
**Period**: 1872-1890  
**Content**: Selected letters to Theo van Gogh and fellow artists  
**Languages**: English translations  

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Van Gogh letters courtesy of [vangoghletters.org](https://vangoghletters.org)
- Luis Mitrovic archive provided by Enterreno.com
- NER models from Hugging Face Transformers
- Built with Next.js, vis.js, Leaflet, and Recharts

## Contact

For questions, suggestions, or collaboration inquiries, please open an issue on GitHub.