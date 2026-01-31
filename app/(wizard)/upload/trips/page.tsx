'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWizard } from '@/components/wizard/WizardContext';
import { FileUploadZone } from '@/components/wizard/FileUploadZone';
import { parseTripsCSV } from '@/lib/parsers/csv-parser';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Download, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const CSV_TEMPLATE = `destination,country,startDate,endDate,purpose,companions,notes
Paris,France,2023-06-01,2023-06-15,Vacation,Family,Summer vacation
Tokyo,Japan,2023-09-10,2023-09-25,Business,Colleagues,Work conference
London,United Kingdom,2023-12-01,,Education,Alone,Study abroad program`;

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'trips_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function TripsPage() {
  const router = useRouter();
  const { trips, setTrips, prevStep, nextStep } = useWizard();
  const { t } = useLanguage();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<{
    data: any[];
    errors: string[];
  } | null>(null);

  const handleFilesAccepted = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0];
      setUploadedFile(file);
      setIsProcessing(true);
      setParseResult(null);

      try {
        const result = await parseTripsCSV(file);
        setParseResult(result);

        if (result.errors.length === 0 && result.data.length > 0) {
          setTrips(result.data);
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
    [setTrips]
  );

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setParseResult(null);
    setTrips([]);
  };

  const getSummary = () => {
    if (!parseResult || parseResult.data.length === 0) return null;

    const uniqueCountries = new Set<string>();
    const uniqueDestinations = new Set<string>();

    parseResult.data.forEach((trip) => {
      uniqueCountries.add(trip.country);
      uniqueDestinations.add(trip.destination);
    });

    return {
      totalTrips: parseResult.data.length,
      uniqueCountries: uniqueCountries.size,
      uniqueDestinations: uniqueDestinations.size,
    };
  };

  const summary = getSummary();

  const handleBack = () => {
    prevStep();
    router.push('/upload/review-entities');
  };

  const handleNext = () => {
    nextStep();
    router.push('/upload/preview');
  };

  const handleSkip = () => {
    handleNext();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('wizard.tripsTitle')}</h2>
            <p className="text-muted-foreground">
              {t('wizard.tripsDescription')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Column Requirements - Updated with details */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-blue-900 dark:text-blue-100 hover:underline">
            {t('wizard.viewRequiredColumns')}
          </summary>
          <div className="mt-3 text-xs text-blue-800 dark:text-blue-200 space-y-2 pl-4">
            <div>
              <p className="font-semibold mb-1">{t('wizard.requiredColumns')}:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li><code>id</code> - {t('wizard.tripColumns.id')}</li>
                <li><code>destination</code> - {t('wizard.tripColumns.destination')}</li>
                <li><code>startDate</code> - {t('wizard.tripColumns.startDate')}</li>
                <li><code>endDate</code> - {t('wizard.tripColumns.endDate')}</li>
                <li><code>purpose</code> - {t('wizard.tripColumns.purpose')}</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-1">{t('wizard.optionalColumns')}:</p>
              <p className="text-blue-700 dark:text-blue-300">
                notes, companions, transportation, accommodation
              </p>
            </div>
          </div>
        </details>

        {/* Download Template Button */}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            {t('wizard.downloadTemplate')}
          </Button>
        </div>

        {/* Upload Zone */}
        <Card>
          <CardContent className="pt-6">
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
          parseResult.data.length > 0 &&
          summary && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-900 dark:text-green-200">
                {t('wizard.fileProcessedSuccess')}
              </AlertTitle>
              <AlertDescription className="text-green-800 dark:text-green-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div>
                    <p className="font-semibold">{summary.totalTrips}</p>
                    <p className="text-sm">{t('wizard.trips')}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{summary.uniqueCountries}</p>
                    <p className="text-sm">{t('wizard.uniqueCountries')}</p>
                  </div>
                  <div>
                    <p className="font-semibold">{summary.uniqueDestinations}</p>
                    <p className="text-sm">{t('wizard.uniqueDestinations')}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
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
          {trips.length === 0 && (
            <Button type="button" variant="ghost" onClick={handleSkip}>
              {t('common.continue')}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleNext}
            disabled={parseResult === null || parseResult.errors.length > 0}
          >
            {t('common.continue')}: {t('wizard.preview')}
          </Button>
        </div>
      </div>
    </div>
  );
}

