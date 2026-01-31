'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWizard } from '@/components/wizard/WizardContext';
import { saveBiography } from '@/lib/storage/indexed-db';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CheckCircle,
  User,
  ImageIcon,
  Mail,
  Plane,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// CATEGORY_LABELS se obtendrá dinámicamente usando traducciones

export default function PreviewPage() {
  const router = useRouter();
  const { basics, photos, letters, trips } = useWizard();
  const { t } = useLanguage();
  
  // Categorías traducidas
  const CATEGORY_LABELS: Record<string, string> = {
    family: t('wizard.photoCategories.family'),
    education: t('wizard.photoCategories.education'),
    travel: t('wizard.photoCategories.travel'),
    work: t('wizard.photoCategories.work'),
    achievement: t('wizard.photoCategories.achievement'),
    other: t('wizard.photoCategories.other'),
  };

  const stats = useMemo(() => {
    // Basic Info Stats
    const basicInfo = basics
      ? {
          name: `${basics.firstName} ${basics.lastName}`,
          years: basics.deathYear
            ? `${basics.birthYear} - ${basics.deathYear}`
            : `${basics.birthYear} - ${t('wizard.present')}`,
          bio: basics.shortBio,
        }
      : null;

    // Photos Stats
    const photoCategories = new Set(photos.map((p) => p.category));
    const photoYears = photos.map((p) => p.year).filter((y) => !isNaN(y));
    const photoYearRange =
      photoYears.length > 0
        ? `${Math.min(...photoYears)} - ${Math.max(...photoYears)}`
        : 'N/A';

    const photosStats = {
      count: photos.length,
      categories: Array.from(photoCategories).map((cat) => CATEGORY_LABELS[cat] || cat),
      yearRange: photoYearRange,
    };

    // Correspondence Stats
    // Contar personas únicas (de campos estándar + NER)
    const allPeople = new Set<string>();

    letters.forEach(letter => {
      if (letter.personFrom) allPeople.add(letter.personFrom);
      if (letter.personTo) allPeople.add(letter.personTo);
      
      // ✅ Incluir personas del análisis NER
      if (letter.mentionedPeople) {
        letter.mentionedPeople.forEach(person => allPeople.add(person));
      }
    });

    const totalPeople = allPeople.size;

    // Contar lugares únicos (de campos estándar + NER)
    const allPlaces = new Set<string>();

    letters.forEach(letter => {
      if (letter.placeFrom) allPlaces.add(letter.placeFrom);
      if (letter.placeTo) allPlaces.add(letter.placeTo);
      
      // ✅ Incluir lugares del análisis NER
      if (letter.mentionedPlaces) {
        letter.mentionedPlaces.forEach(place => allPlaces.add(place));
      }
    });

    trips.forEach(trip => {
      if (trip.destination) allPlaces.add(trip.destination);
      if (trip.country) allPlaces.add(trip.country);
    });

    const totalPlaces = allPlaces.size;

    // Contar idiomas únicos
    const uniqueLanguages = new Set<string>();
    letters.forEach((letter) => {
      if (letter.language) {
        uniqueLanguages.add(letter.language);
      }
    });

    const correspondenceStats = {
      count: letters.length,
      persons: totalPeople,
      places: totalPlaces,
      languages: uniqueLanguages.size,
    };

    // Travel Stats
    const uniqueCountries = new Set(trips.map((t) => t.country));
    const uniqueDestinations = new Set(trips.map((t) => t.destination));

    const travelStats = {
      count: trips.length,
      countries: uniqueCountries.size,
      destinations: uniqueDestinations.size,
    };

    // Total Events
    const totalEvents = photos.length + letters.length + trips.length;

    return {
      basicInfo,
      photos: photosStats,
      correspondence: correspondenceStats,
      travel: travelStats,
      totalEvents,
    };
  }, [basics, photos, letters, trips]);

  const handleGenerate = async () => {
    const biographyId = Date.now().toString();
    
    // Serializar fotos sin el objeto File
    const serializedPhotos = photos.map(({ file, ...rest }) => rest);
    
    try {
      await saveBiography(biographyId, {
        basics,
        photos: serializedPhotos,
        letters,
        trips
      });
      
      router.push(`/biography/${biographyId}`);
    } catch (error) {
      console.error('Error saving biography:', error);
      alert(t('wizard.errorSavingBiography'));
    }
  };

  const handleBack = () => {
    router.push('/upload/trips');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('wizard.preview')}</h2>
            <p className="text-muted-foreground">
              {t('wizard.preview')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle>{t('wizard.basicInfoTitle')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.basicInfo ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('wizard.firstName')}</p>
                    <p className="text-lg font-semibold">{stats.basicInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('wizard.year')}</p>
                    <p className="text-base">{stats.basicInfo.years}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t('wizard.shortBio')}</p>
                    <p className="text-sm line-clamp-3">{stats.basicInfo.bio}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t('wizard.noBasicInfo')}</p>
              )}
            </CardContent>
          </Card>

          {/* Photos Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <CardTitle>{t('wizard.photosTitle')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('analytics.totalEvents')}</p>
                <p className="text-2xl font-bold">{stats.photos.count}</p>
              </div>
              {stats.photos.categories.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('wizard.category')}</p>
                  <p className="text-sm">{stats.photos.categories.join(', ')}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('wizard.yearRange')}</p>
                <p className="text-sm">{stats.photos.yearRange}</p>
              </div>
            </CardContent>
          </Card>

          {/* Correspondence Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <CardTitle>{t('analytics.correspondence')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('analytics.totalEvents')}</p>
                <p className="text-2xl font-bold">{stats.correspondence.count}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t('analytics.totalPeople')}</p>
                  <p className="text-lg font-semibold">{stats.correspondence.persons}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('analytics.totalPlaces')}</p>
                  <p className="text-lg font-semibold">{stats.correspondence.places}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('wizard.languages')}</p>
                  <p className="text-lg font-semibold">{stats.correspondence.languages}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Travel History Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary" />
                <CardTitle>{t('wizard.tripsTitle')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('analytics.totalEvents')}</p>
                <p className="text-2xl font-bold">{stats.travel.count}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t('analytics.totalPlaces')}</p>
                  <p className="text-lg font-semibold">{stats.travel.countries}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('analytics.topDestinations')}</p>
                  <p className="text-lg font-semibold">{stats.travel.destinations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card - Blue */}
        <Card className="bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-700 text-white">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <CardTitle className="text-white">{t('analytics.overview')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm opacity-90">{t('analytics.totalEvents')}</p>
              <p className="text-4xl font-bold">{stats.totalEvents}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">{t('analytics.overview')}:</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
                  {t('nav.timeline')}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
                  {t('nav.map')}
                </span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm">
                  {t('nav.network')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={handleBack}>
          {t('common.back')}
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={handleGenerate}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          {t('common.continue')} 🚀
        </Button>
      </div>
    </div>
  );
}

