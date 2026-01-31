'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadBiography } from '@/lib/storage/indexed-db';
import { TimelineEvent, Letter } from '@/lib/types';
import { createTimelineEvents } from '@/lib/utils/timeline-helpers';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { 
  Calendar,
  Mail,
  Camera,
  Plane,
  Users,
  MapPin,
  Building2,
  BarChart3,
  TrendingUp,
  Globe,
  MessageSquare,
} from 'lucide-react';

interface AnalyticsData {
  // Generales
  totalEvents: number;
  dateRange: { start: Date; end: Date };
  
  // Por tipo
  totalLetters: number;
  totalPhotos: number;
  totalTrips: number;
  
  // Personas
  totalPeople: number;
  topCorrespondents: { name: string; count: number }[];
  topMentionedPeople: { name: string; count: number }[];
  
  // Lugares
  totalPlaces: number;
  topDestinations: { name: string; count: number }[];
  topMentionedPlaces: { name: string; count: number }[];
  
  // Organizaciones
  topMentionedOrgs?: { name: string; count: number }[];
  
  // Temporal
  eventsPerYear: { year: number; count: number }[];
  eventsPerDecade: { decade: string; count: number }[];
  
  // Idiomas
  languageDistribution: { language: string; count: number }[];
}

interface BiographyData {
  basics?: any;
  photos?: any[];
  letters?: Letter[];
  trips?: any[];
}

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    loadData();
  }, [unwrappedParams.id]);

  const loadData = async () => {
    try {
      const data: BiographyData | null = await loadBiography(unwrappedParams.id);
      
      if (!data) {
        router.push('/upload/basic');
        return;
      }

      // Convertir a eventos usando la misma lógica que en page.tsx
      const allEvents = createTimelineEvents(
        data.basics,
        data.photos || [],
        data.letters || [],
        data.trips || []
      );
      setEvents(allEvents);
      
      // Calcular analytics
      const analyticsData = calculateAnalytics(allEvents, data);
      setAnalytics(analyticsData);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (events: TimelineEvent[], data: BiographyData): AnalyticsData => {
    const letters = events.filter(e => e.type === 'letter');
    const photos = events.filter(e => e.type === 'photo');
    const trips = events.filter(e => e.type === 'trip');

    // SEPARAR corresponsales de mencionados
    const correspondentsMap = new Map<string, number>();  // Solo sender/recipient
    const mentionedPeopleMap = new Map<string, number>(); // Solo mentioned
    
    letters.forEach(letter => {
      const letterData = letter.data as Letter & {
        sender?: string;
        recipient?: string;
        personFrom?: string;
        personTo?: string;
        mentionedPeople?: string[];
      };
      
      const sender = letterData?.sender || letterData?.personFrom;
      const recipient = letterData?.recipient || letterData?.personTo;
      
      // Contar SOLO correspondientes directos
      if (sender && sender !== 'Desconocido') {
        correspondentsMap.set(sender, (correspondentsMap.get(sender) || 0) + 1);
      }
      if (recipient && recipient !== 'Desconocido') {
        correspondentsMap.set(recipient, (correspondentsMap.get(recipient) || 0) + 1);
      }
      
      // Contar personas mencionadas SEPARADAMENTE
      letterData?.mentionedPeople?.forEach((person: string) => {
        if (person && person !== 'Desconocido') {
          mentionedPeopleMap.set(person, (mentionedPeopleMap.get(person) || 0) + 1);
        }
      });
    });

    const topCorrespondents = Array.from(correspondentsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topMentionedPeople = Array.from(mentionedPeopleMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Lugares mencionados
    const mentionedPlacesMap = new Map<string, number>();
    letters.forEach(letter => {
      (letter.data as any)?.mentionedPlaces?.forEach((place: string) => {
        if (place && place !== 'Desconocido') {
          mentionedPlacesMap.set(place, (mentionedPlacesMap.get(place) || 0) + 1);
        }
      });
    });

    const topMentionedPlaces = Array.from(mentionedPlacesMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Organizaciones mencionadas (si existe el campo)
    const mentionedOrgsMap = new Map<string, number>();
    letters.forEach(letter => {
      (letter.data as any)?.mentionedOrganizations?.forEach((org: string) => {
        if (org && org !== 'Desconocido') {
          mentionedOrgsMap.set(org, (mentionedOrgsMap.get(org) || 0) + 1);
        }
      });
    });

    const topMentionedOrgs = mentionedOrgsMap.size > 0
      ? Array.from(mentionedOrgsMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      : undefined;

    // Lugares
    const placesMap = new Map<string, number>();
    events.forEach(event => {
      // Buscar location en description o data
      const location = event.description?.split('De ')[1]?.split(' a ')[0] || 
                      event.description?.split(' a ')[1] ||
                      (event.data as any)?.placeFrom ||
                      (event.data as any)?.placeTo ||
                      (event.data as any)?.destination;
      
      if (location && location !== 'Desconocido') {
        placesMap.set(location, (placesMap.get(location) || 0) + 1);
      }
      
      const eventData = event.data as any;
      eventData?.mentionedPlaces?.forEach((place: string) => {
        if (place && place !== 'Desconocido') {
          placesMap.set(place, (placesMap.get(place) || 0) + 1);
        }
      });
    });

    const topDestinations = Array.from(placesMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Por año
    const yearMap = new Map<number, number>();
    events.forEach(event => {
      const year = event.date.getFullYear();
      yearMap.set(year, (yearMap.get(year) || 0) + 1);
    });

    const eventsPerYear = Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    // Por década
    const decadeMap = new Map<string, number>();
    events.forEach(event => {
      const year = event.date.getFullYear();
      const decade = `${Math.floor(year / 10) * 10}s`;
      decadeMap.set(decade, (decadeMap.get(decade) || 0) + 1);
    });

    const eventsPerDecade = Array.from(decadeMap.entries())
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => parseInt(a.decade) - parseInt(b.decade));

    // Idiomas
    const languageMap = new Map<string, number>();
    data.letters?.forEach((letter: Letter) => {
      const lang = letter.language || 'Desconocido';
      languageMap.set(lang, (languageMap.get(lang) || 0) + 1);
    });

    const languageDistribution = Array.from(languageMap.entries())
      .map(([language, count]) => ({ language, count }));

    // Rango de fechas
    const dates = events.map(e => e.date.getTime());
    const dateRange = {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates)),
    };

    // Calcular total de personas únicas (corresponsales + mencionados, sin duplicados)
    const allPeopleSet = new Set([
      ...Array.from(correspondentsMap.keys()),
      ...Array.from(mentionedPeopleMap.keys())
    ]);

    return {
      totalEvents: events.length,
      dateRange,
      totalLetters: letters.length,
      totalPhotos: photos.length,
      totalTrips: trips.length,
      totalPeople: allPeopleSet.size,
      topCorrespondents,
      topMentionedPeople,
      totalPlaces: placesMap.size,
      topDestinations,
      topMentionedPlaces,
      topMentionedOrgs,
      eventsPerYear,
      eventsPerDecade,
      languageDistribution,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <p className="text-gray-600">{t('analytics.overview')}</p>
      </div>
    );
  }

  const yearSpan = analytics.dateRange.end.getFullYear() - analytics.dateRange.start.getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-blue-600 dark:text-blue-400 hover:underline mb-4 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('common.back')}
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('analytics.title')}</h1>
            <p className="text-gray-600">{t('analytics.overview')}</p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('analytics.totalEvents')}</CardTitle>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{analytics.totalEvents}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {analytics.dateRange.start.getFullYear()} - {analytics.dateRange.end.getFullYear()} ({yearSpan} años)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('analytics.totalLetters')}</CardTitle>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{analytics.totalLetters}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{analytics.totalPeople} {t('analytics.totalPeople')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('analytics.totalPhotos')}</CardTitle>
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <Camera className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{analytics.totalPhotos}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.totalPhotos')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('analytics.totalTrips')}</CardTitle>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <Plane className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{analytics.totalTrips}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.totalTrips')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('analytics.totalPeople')}</CardTitle>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{analytics.totalPeople}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.totalPeople')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('analytics.totalPlaces')}</CardTitle>
                <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-full">
                  <MapPin className="w-8 h-8 text-teal-600 dark:text-teal-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{analytics.totalPlaces}</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.totalPlaces')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Eventos por década */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('analytics.eventsPerDecade')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.eventsPerDecade.map(({ decade, count }) => {
                  const maxCount = Math.max(...analytics.eventsPerDecade.map(d => d.count));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={decade} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{decade}</span>
                        <span className="text-gray-600">{count} {t('analytics.totalEvents')}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Correspondientes */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('analytics.topCorrespondents')}
                </CardTitle>
              </div>
              <CardDescription>{t('analytics.topCorrespondents')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topCorrespondents.length > 0 ? (
                  analytics.topCorrespondents.slice(0, 8).map(({ name, count }) => {
                    const maxCount = Math.max(...analytics.topCorrespondents.map(c => c.count));
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{name}</span>
                          <span className="text-gray-600">{count} {count === 1 ? t('wizard.letters') : t('wizard.letters')}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-purple-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No hay corresponsales registrados</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Personas Mencionadas */}
          {analytics.topMentionedPeople.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('analytics.mentionedPeople')}
                  </CardTitle>
                </div>
                <CardDescription>{t('analytics.mentionedPeople')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topMentionedPeople.slice(0, 8).map(({ name, count }) => {
                    const maxCount = Math.max(...analytics.topMentionedPeople.map(p => p.count));
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{name}</span>
                          <span className="text-gray-600 dark:text-gray-400">{count} {count === 1 ? t('analytics.mention') : t('analytics.mentions_plural')}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lugares Mencionados */}
          {analytics.topMentionedPlaces.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('analytics.mentionedPlaces')}
                  </CardTitle>
                </div>
                <CardDescription>{t('analytics.mentionedPlaces')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topMentionedPlaces.slice(0, 8).map(({ name, count }) => {
                    const maxCount = Math.max(...analytics.topMentionedPlaces.map(p => p.count));
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{name}</span>
                          <span className="text-gray-600 dark:text-gray-400">{count} {count === 1 ? t('analytics.mention') : t('analytics.mentions_plural')}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-teal-600 dark:bg-teal-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organizaciones Mencionadas (si hay datos) */}
          {analytics.topMentionedOrgs && analytics.topMentionedOrgs.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('analytics.mentionedOrganizations')}
                  </CardTitle>
                </div>
                <CardDescription>{t('analytics.mentionedOrganizations')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topMentionedOrgs.slice(0, 8).map(({ name, count }) => {
                    const maxCount = Math.max(...analytics.topMentionedOrgs!.map(o => o.count));
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{name}</span>
                          <span className="text-gray-600 dark:text-gray-400">{count} {count === 1 ? t('analytics.mention') : t('analytics.mentions_plural')}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-pink-600 dark:bg-pink-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Top Destinos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('analytics.topDestinations')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topDestinations.slice(0, 8).map(({ name, count }) => {
                  const maxCount = Math.max(...analytics.topDestinations.map(d => d.count));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{name}</span>
                        <span className="text-gray-600">{count} {t('analytics.totalPlaces')}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-amber-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Distribución de idiomas */}
          {analytics.languageDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    {t('analytics.languageDistribution')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.languageDistribution.map(({ language, count }) => {
                    const percentage = analytics.totalLetters > 0 ? (count / analytics.totalLetters) * 100 : 0;
                    
                    return (
                      <div key={language} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{language}</span>
                          <span className="text-gray-600">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-green-600 h-2.5 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline de actividad por año */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                {t('analytics.activityTimeline')}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-64 pb-4">
              {analytics.eventsPerYear.map(({ year, count }) => {
                const maxCount = Math.max(...analytics.eventsPerYear.map(y => y.count));
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                
                return (
                  <div 
                    key={year} 
                    className="flex-1 flex flex-col items-center group relative"
                    style={{ minWidth: '20px' }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {year}: {count} eventos
                    </div>
                    <div 
                      className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                      style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                      title={`${year}: ${count} eventos`}
                    ></div>
                    {analytics.eventsPerYear.length < 30 && (
                      <span className="text-xs text-gray-600 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">
                        {year}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
