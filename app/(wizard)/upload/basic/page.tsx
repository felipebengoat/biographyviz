'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWizard } from '@/components/wizard/WizardContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileUploadZone } from '@/components/wizard/FileUploadZone';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SAMPLE_DATASETS, loadSampleDataset } from '@/lib/sampleData';
import { Sparkles, FileText, Image as ImageIcon, MapPin, Loader2, ArrowRight } from 'lucide-react';

export default function BasicInfoPage() {
  const router = useRouter();
  const { basics, setBasics, nextStep } = useWizard();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    firstName: basics?.firstName || '',
    lastName: basics?.lastName || '',
    birthYear: basics?.birthYear?.toString() || '',
    deathYear: basics?.deathYear?.toString() || '',
    shortBio: basics?.shortBio || '',
  });

  const [profilePhoto, setProfilePhoto] = useState<File | undefined>(basics?.profilePhoto);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [bioCharCount, setBioCharCount] = useState(formData.shortBio.length);
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setBioCharCount(formData.shortBio.length);
  }, [formData.shortBio]);

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'firstName':
        if (!value.trim()) {
          newErrors.firstName = t('wizard.errors.firstNameRequired');
        } else {
          delete newErrors.firstName;
        }
        break;

      case 'lastName':
        if (!value.trim()) {
          newErrors.lastName = t('wizard.errors.lastNameRequired');
        } else {
          delete newErrors.lastName;
        }
        break;

      case 'birthYear':
        if (!value.trim()) {
          newErrors.birthYear = t('wizard.errors.birthYearRequired');
        } else {
          const year = parseInt(value);
          if (isNaN(year) || year < 1000 || year > currentYear) {
            newErrors.birthYear = t('wizard.errors.invalidYear', { min: 1000, max: currentYear });
          } else {
            delete newErrors.birthYear;
          }
        }
        break;

      case 'deathYear':
        if (value.trim()) {
          const year = parseInt(value);
          const birthYear = parseInt(formData.birthYear);
          if (isNaN(year) || year < 1000 || year > currentYear) {
            newErrors.deathYear = t('wizard.errors.invalidYear', { min: 1000, max: currentYear });
          } else if (!isNaN(birthYear) && year < birthYear) {
            newErrors.deathYear = t('wizard.errors.deathYearBeforeBirth');
          } else {
            delete newErrors.deathYear;
          }
        } else {
          delete newErrors.deathYear;
        }
        break;

      case 'shortBio':
        if (!value.trim()) {
          newErrors.shortBio = t('wizard.errors.shortBioRequired');
        } else if (value.length > 500) {
          newErrors.shortBio = t('wizard.errors.shortBioTooLong');
        } else {
          delete newErrors.shortBio;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleFileAccepted = (files: File[]) => {
    if (files.length > 0) {
      setProfilePhoto(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setProfilePhoto(undefined);
  };

  const handleLoadSample = async (datasetId: 'mitrovic' | 'vangogh') => {
    try {
      setLoadingSample(datasetId);
      console.log(`[Sample Data] User clicked: ${datasetId}`);
      
      // Cargar datos
      const data = await loadSampleDataset(datasetId);
      
      // Crear basics según el dataset
      const dataset = datasetId === 'mitrovic' 
        ? {
            firstName: 'Luis',
            lastName: 'Mitrovic',
            birthYear: 1911,
            deathYear: 2008,
            shortBio: 'Chilean architect and photographer. Bauhaus-trained professional who documented architecture and urban life across Chile and international travels.',
          }
        : {
            firstName: 'Vincent',
            lastName: 'van Gogh',
            birthYear: 1853,
            deathYear: 1890,
            shortBio: 'Dutch post-impressionist painter. Correspondence with family and fellow artists documenting his artistic journey across Europe.',
          };
      
      // Guardar basics en el contexto
      setBasics(dataset);
      
      // Guardar en localStorage
      if (data.letters) {
        localStorage.setItem('biographyviz_sample_letters', JSON.stringify(data.letters));
      }
      
      if (data.photos) {
        localStorage.setItem('biographyviz_sample_photos', JSON.stringify(data.photos));
      }
      
      if (data.trips) {
        localStorage.setItem('biographyviz_sample_trips', JSON.stringify(data.trips));
      }
      
      // Marcar que es sample data (para auto-detectar Van Gogh dictionary)
      localStorage.setItem('biographyviz_is_sample', datasetId);
      
      console.log(`[Sample Data] Data saved to localStorage, redirecting...`);
      
      // Redirigir directo a review entities
      router.push('/upload/review-entities');
      
    } catch (error) {
      console.error('[Sample Data] Load failed:', error);
      alert(`Failed to load sample data: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setLoadingSample(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    Object.keys(formData).forEach((key) => {
      validateField(key, formData[key as keyof typeof formData]);
    });

    // Verificar si hay errores
    const hasErrors = Object.keys(errors).length > 0;
    const requiredFieldsValid =
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.birthYear.trim() &&
      formData.shortBio.trim() &&
      formData.shortBio.length <= 500;

    if (!hasErrors && requiredFieldsValid) {
      const basicsData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        birthYear: parseInt(formData.birthYear),
        deathYear: formData.deathYear.trim() ? parseInt(formData.deathYear) : undefined,
        shortBio: formData.shortBio.trim(),
        profilePhoto: profilePhoto,
      };

      setBasics(basicsData);
      nextStep();
      router.push('/upload/photos');
    }
  };

  const isFormValid =
    formData.firstName.trim() &&
    formData.lastName.trim() &&
    formData.birthYear.trim() &&
    formData.shortBio.trim() &&
    formData.shortBio.length <= 500 &&
    Object.keys(errors).length === 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{t('wizard.basicInfoTitle')}</h2>
          <p className="text-muted-foreground">{t('wizard.basicInfoDescription')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear all stored data and start fresh?')) {
                const keys = Object.keys(localStorage).filter(k => k.startsWith('biographyviz'));
                keys.forEach(k => localStorage.removeItem(k));
                if (typeof indexedDB !== 'undefined') {
                  indexedDB.deleteDatabase('BiographyViz');
                }
                alert('All data cleared. Refresh the page.');
                window.location.reload();
              }
            }}
            className="text-xs text-red-600 dark:text-red-400 underline hover:no-underline"
          >
            🗑️ Clear all data and reset
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Sample Data Banner */}
      <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl shadow-lg">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Try Sample Data
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Explore BiographyViz instantly with pre-loaded biographical datasets. Perfect for reviewing the tool without manual data preparation.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_DATASETS.map(dataset => (
            <button
              key={dataset.id}
              onClick={() => handleLoadSample(dataset.id)}
              disabled={loadingSample !== null}
              className="group relative p-5 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                      {dataset.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                      {dataset.period}
                    </p>
                  </div>
                  
                  {loadingSample === dataset.id ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  ) : (
                    <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {dataset.description}
                </p>
                
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {dataset.tags.map(tag => (
                    <span 
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  {dataset.hasLetters && (
                    <div className="flex items-center gap-1 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                      <FileText size={12} />
                      Letters
                    </div>
                  )}
                  {dataset.hasPhotos && (
                    <div className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                      <ImageIcon size={12} />
                      Photos
                    </div>
                  )}
                  {dataset.hasTrips && (
                    <div className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                      <MapPin size={12} />
                      Trips
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p className="text-xs text-center text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Sample data will load automatically and skip the upload steps. You can still upload your own data using the wizard below.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="relative mb-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
            Or upload your own data
          </span>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('wizard.basicInfoTitle')}</CardTitle>
          <CardDescription>
            {t('wizard.basicInfoDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  {t('wizard.firstName')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  onBlur={(e) => validateField('firstName', e.target.value)}
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  {t('wizard.lastName')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  onBlur={(e) => validateField('lastName', e.target.value)}
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <p className="text-sm text-destructive">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Años */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="birthYear">
                  {t('wizard.birthYear')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="birthYear"
                  name="birthYear"
                  type="number"
                  value={formData.birthYear}
                  onChange={handleChange}
                  onBlur={(e) => validateField('birthYear', e.target.value)}
                  placeholder={t('wizard.yearExample')}
                  min="1000"
                  max={currentYear}
                  aria-invalid={!!errors.birthYear}
                />
                {errors.birthYear && (
                  <p className="text-sm text-destructive">{errors.birthYear}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="deathYear">{t('wizard.deathYear')}</Label>
                <Input
                  id="deathYear"
                  name="deathYear"
                  type="number"
                  value={formData.deathYear}
                  onChange={handleChange}
                  onBlur={(e) => validateField('deathYear', e.target.value)}
                  placeholder={t('wizard.yearExample')}
                  min="1000"
                  max={currentYear}
                  aria-invalid={!!errors.deathYear}
                />
                {errors.deathYear && (
                  <p className="text-sm text-destructive">{errors.deathYear}</p>
                )}
              </div>
            </div>

            {/* Biografía Breve */}
            <div className="space-y-2">
              <Label htmlFor="shortBio">
                {t('wizard.shortBio')} <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="shortBio"
                name="shortBio"
                value={formData.shortBio}
                onChange={handleChange}
                onBlur={(e) => validateField('shortBio', e.target.value)}
                placeholder={t('wizard.biographyPlaceholder')}
                rows={5}
                maxLength={500}
                aria-invalid={!!errors.shortBio}
              />
              <div className="flex items-center justify-between">
                {errors.shortBio ? (
                  <p className="text-sm text-destructive">{errors.shortBio}</p>
                ) : (
                  <div />
                )}
                <p
                  className={`text-xs ${
                    bioCharCount > 500 ? 'text-destructive' : 'text-muted-foreground'
                  }`}
                >
                  {bioCharCount}/500 {t('wizard.bioCharCount')}
                </p>
              </div>
            </div>

            {/* Foto de Perfil */}
            <div className="space-y-2">
              <Label>{t('wizard.profilePhoto')}</Label>
              <FileUploadZone
                onFilesAccepted={handleFileAccepted}
                acceptedFileTypes={{
                  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
                }}
                maxFiles={1}
                multiple={false}
                uploadedFiles={
                  profilePhoto
                    ? [{ name: profilePhoto.name, size: profilePhoto.size }]
                    : []
                }
                onRemoveFile={handleRemoveFile}
                description={t('wizard.allowedFormats') + ': JPG, PNG, GIF, WEBP'}
              />
            </div>

            {/* Botón de envío */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={!isFormValid} size="lg">
                {t('common.continue')}: {t('wizard.photos')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

