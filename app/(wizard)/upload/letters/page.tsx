'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWizard } from '@/components/wizard/WizardContext';
import { FileUploadZone } from '@/components/wizard/FileUploadZone';
import { parseLettersCSV } from '@/lib/parsers/csv-parser';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Download, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const CSV_TEMPLATE = `date,personFrom,personTo,placeFrom,placeTo,filename,content,language,type,notes
2023-01-15,John Doe,Jane Smith,New York,London,letter_001.txt,Content of the letter,English,manuscript,Important correspondence
2023-02-20,Jane Smith,John Doe,London,New York,letter_002.txt,Reply letter content,English,typewritten,`;

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'letters_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

interface Stats {
  total: number;
  withDates: number;
  withOrigins: number;
  withDestinations: number;
  languages: string[];
}

export default function LettersPage() {
  const router = useRouter();
  const { letters, setLetters, prevStep, nextStep } = useWizard();
  const { t, language } = useLanguage();
  
  // Template paths based on language
  const templatePath = language === 'en' 
    ? '/templates/letters-TEMPLATE-INSTRUCTIVE-EN.csv'
    : '/templates/letters-TEMPLATE-INSTRUCTIVO.csv';
    
  const instructionsPath = language === 'en'
    ? '/templates/INSTRUCTIONS-TEMPLATE-LETTERS-EN.md'
    : '/templates/INSTRUCCIONES-TEMPLATE-CARTAS.md';
  
  const emptyTemplatePath = '/templates/letters-TEMPLATE-EMPTY.csv';
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<{
    data: any[];
    errors: string[];
  } | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    withDates: 0,
    withOrigins: 0,
    withDestinations: 0,
    languages: [],
  });

  const handleFilesAccepted = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0];
      setUploadedFile(file);
      setIsProcessing(true);
      setParseResult(null);

      try {
        const result = await parseLettersCSV(file);
        setParseResult(result);

        if (result.errors.length === 0 && result.data.length > 0) {
          setLetters(result.data);
          
          // Calcular estadísticas
          const processedLetters = result.data;
          console.log('📧 CSV parseado:', processedLetters.length, 'filas');
          console.log('📧 Con placeFrom:', processedLetters.filter((l: any) => l.placeFrom).length);
          console.log('📧 Con placeTo:', processedLetters.filter((l: any) => l.placeTo).length);
          
          setStats({
            total: processedLetters.length,
            withDates: processedLetters.filter((l: any) => l.date).length,
            withOrigins: processedLetters.filter((l: any) => l.placeFrom).length,
            withDestinations: processedLetters.filter((l: any) => l.placeTo).length,
            languages: [...new Set(processedLetters.map((l: any) => l.language || t('wizard.unknown')))],
          });
        }
      } catch (error) {
        setParseResult({
          data: [],
          errors: [t('wizard.fileProcessingError', { error: error instanceof Error ? error.message : t('wizard.unknownError') })],
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [setLetters]
  );

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setParseResult(null);
    setLetters([]);
    setStats({
      total: 0,
      withDates: 0,
      withOrigins: 0,
      withDestinations: 0,
      languages: [],
    });
  };

  const getSummary = () => {
    if (!parseResult || parseResult.data.length === 0) return null;

    // Contar personas únicas
    const uniquePeople = new Set<string>();
    parseResult.data.forEach(letter => {
      // Campos estándar
      if (letter.personFrom && letter.personFrom !== t('wizard.unknown')) {
        uniquePeople.add(letter.personFrom);
      }
      if (letter.personTo && letter.personTo !== t('wizard.unknown')) {
        uniquePeople.add(letter.personTo);
      }
      
      // ✅ Campos NER
      if (letter.mentionedPeople && Array.isArray(letter.mentionedPeople)) {
        letter.mentionedPeople.forEach(person => uniquePeople.add(person));
      }
    });

    // Contar lugares únicos
    const uniqueLocations = new Set<string>();
    parseResult.data.forEach(letter => {
      // Campos estándar
      if (letter.placeFrom && letter.placeFrom !== t('wizard.unknown')) {
        uniqueLocations.add(letter.placeFrom);
      }
      if (letter.placeTo && letter.placeTo !== t('wizard.unknown')) {
        uniqueLocations.add(letter.placeTo);
      }
      
      // ✅ Campos NER
      if (letter.mentionedPlaces && Array.isArray(letter.mentionedPlaces)) {
        letter.mentionedPlaces.forEach(place => uniqueLocations.add(place));
      }
    });

    console.log('Letters page - People:', uniquePeople.size, 'Places:', uniqueLocations.size);

    return {
      totalLetters: parseResult.data.length,
      uniquePersons: uniquePeople.size,
      uniquePlaces: uniqueLocations.size,
    };
  };

  const summary = getSummary();

  const handleBack = () => {
    prevStep();
    router.push('/upload/photos');
  };

  const handleNext = () => {
    nextStep();
    router.push('/upload/review-entities');
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleSkipReview = () => {
    nextStep();
    router.push('/upload/trips');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('wizard.lettersTitle')}</h2>
            <p className="text-muted-foreground">
              {t('wizard.lettersDescription')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Sección de ayuda y template */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('wizard.helpTitle')}
          </h3>
          
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
            {t('wizard.helpDescription')}
          </p>
          
          <div className="flex flex-wrap gap-3">
            {/* Template con instrucciones */}
            <a
              href={templatePath}
              download
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('wizard.templateWithInstructions')}
            </a>
            
            {/* Template vacío */}
            <a
              href={emptyTemplatePath}
              download
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('wizard.emptyTemplate')}
            </a>
            
            {/* Guía de instrucciones */}
            <a
              href={instructionsPath}
              download
              className="px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('wizard.detailedInstructions')}
            </a>
          </div>
          
          {/* Acordeón con vista rápida */}
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-blue-900 dark:text-blue-100 hover:underline">
              {t('wizard.columnsSummary')}
            </summary>
            <div className="mt-3 text-xs text-blue-800 dark:text-blue-200 space-y-2 pl-4">
              <div>
                <p className="font-semibold mb-1">✅ {t('wizard.columnsYouFill')}:</p>
                <p className="text-blue-700 dark:text-blue-300">
                  id, sobre, title, date, sender, recipient, placeFrom, placeTo, content
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">🤖 {t('wizard.columnsSystemFills')}:</p>
                <p className="text-blue-700 dark:text-blue-300">
                  preview, mentioned_people, mentioned_places, mentioned_organizations, mentioned_events, keywords
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">⚙️ {t('wizard.columnsOptional')}:</p>
                <p className="text-blue-700 dark:text-blue-300">
                  language, type, num_pages, annotations
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Column Requirements - Updated with details */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-blue-900 dark:text-blue-100 hover:underline">
            {t('wizard.viewRequiredColumns')}
          </summary>
          <div className="mt-3 text-xs text-blue-800 dark:text-blue-200 space-y-2 pl-4">
            <div>
              <p className="font-semibold mb-1">{t('wizard.requiredColumns')} (9):</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li><code>id</code> - {t('wizard.columnDescriptions.id')}</li>
                <li><code>sobre</code> - {t('wizard.columnDescriptions.sobre')}</li>
                <li><code>title</code> - {t('wizard.columnDescriptions.title')}</li>
                <li><code>date</code> - {t('wizard.columnDescriptions.date')}</li>
                <li><code>sender</code> - {t('wizard.columnDescriptions.sender')}</li>
                <li><code>recipient</code> - {t('wizard.columnDescriptions.recipient')}</li>
                <li><code>placeFrom</code> - {t('wizard.columnDescriptions.placeFrom')}</li>
                <li><code>placeTo</code> - {t('wizard.columnDescriptions.placeTo')}</li>
                <li><code>content</code> - {t('wizard.columnDescriptions.content')}</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">{t('wizard.systemColumns')} (6):</p>
              <p className="text-blue-700 dark:text-blue-300">
                preview, mentioned_people, mentioned_places, mentioned_organizations, mentioned_events, keywords
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic">
                {t('wizard.leaveEmpty')}
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">{t('wizard.optionalColumns')} (4):</p>
              <p className="text-blue-700 dark:text-blue-300">
                language, type, num_pages, annotations
              </p>
            </div>
          </div>
        </details>

        {/* Upload Zone */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('wizard.lettersTitle')}
              </h3>
              
              <div className="group relative">
                <svg className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                
                <div className="hidden group-hover:block absolute left-0 top-6 z-10 w-80 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                  <p className="font-semibold mb-2">{t('wizard.helpTitle')}</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>{t('wizard.tooltip.csvFile')}</li>
                    <li>{t('wizard.tooltip.requiredColumns')}</li>
                    <li>{t('wizard.tooltip.dateFormat')}</li>
                    <li>{t('wizard.tooltip.encoding')}</li>
                  </ul>
                  <p className="mt-2 text-blue-300">
                    💡 {t('wizard.helpDescription')}
                  </p>
                </div>
              </div>
            </div>
            
            <FileUploadZone
              onFilesAccepted={handleFilesAccepted}
              acceptedFileTypes={{
                'text/csv': ['.csv'],
                'application/vnd.ms-excel': ['.xls'],
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
              }}
              maxFiles={1}
              multiple={false}
              uploadedFiles={
                uploadedFile ? [{ name: uploadedFile.name, size: uploadedFile.size }] : []
              }
              onRemoveFile={handleRemoveFile}
              description={t('wizard.allowedFormats') + ': CSV, XLS, XLSX'}
            />
          </CardContent>
        </Card>

        {/* Processing State */}
        {isProcessing && (
          <Alert>
            <AlertCircle className="h-4 w-4 animate-spin" />
            <AlertTitle>{t('wizard.processingFile')}</AlertTitle>
            <AlertDescription>
              {t('wizard.processingFileDescription')}
            </AlertDescription>
          </Alert>
        )}

        {/* Errors */}
        {parseResult && parseResult.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('wizard.validationErrors')}</AlertTitle>
            <AlertDescription>
              <p className="mb-2">{t('wizard.validationErrorsDescription')}</p>
              <ul className="list-disc list-inside space-y-1 text-sm max-h-60 overflow-y-auto">
                {parseResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Summary */}
        {parseResult &&
          parseResult.errors.length === 0 &&
          parseResult.data.length > 0 && (
            <>
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-900 dark:text-green-200">
                  {t('wizard.fileProcessedSuccess')}
                </AlertTitle>
                <AlertDescription className="text-green-800 dark:text-green-300">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    {summary && (
                      <>
                        <div>
                          <p className="font-semibold">{summary.totalLetters}</p>
                          <p className="text-sm">{t('wizard.letters')}</p>
                        </div>
                        <div>
                          <p className="font-semibold">{summary.uniquePersons}</p>
                          <p className="text-sm">{t('wizard.uniquePeople')}</p>
                        </div>
                        <div>
                          <p className="font-semibold">{summary.uniquePlaces}</p>
                          <p className="text-sm">{t('wizard.uniquePlaces')}</p>
                        </div>
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Estadísticas detalladas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('wizard.totalLetters')}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.withOrigins}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('wizard.withOrigin')}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.withDestinations}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('wizard.withDestination')}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.withDates}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('wizard.withDates')}</p>
                </div>
              </div>
            </>
          )}

        {/* Empty State */}
        {parseResult &&
          parseResult.errors.length === 0 &&
          parseResult.data.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('wizard.emptyFile')}</AlertTitle>
              <AlertDescription>
                {t('wizard.emptyFileDescription')}
              </AlertDescription>
            </Alert>
          )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={handleBack}>
          {t('common.back')}
        </Button>

        <div className="flex gap-2">
          {letters.length === 0 && (
            <Button type="button" variant="ghost" onClick={handleSkip}>
              {t('common.continue')}
            </Button>
          )}
          {parseResult && parseResult.errors.length === 0 && parseResult.data.length > 0 && (
            <button
              onClick={handleSkipReview}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t('wizard.skipReview')} →
            </button>
          )}
          <Button
            type="button"
            onClick={handleNext}
            disabled={parseResult === null || parseResult.errors.length > 0}
          >
            {t('common.continue')}: {t('wizard.reviewEntities')}
          </Button>
        </div>
      </div>
    </div>
  );
}

