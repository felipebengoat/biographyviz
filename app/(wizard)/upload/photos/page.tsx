'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useWizard } from '@/components/wizard/WizardContext';
import { FileUploadZone } from '@/components/wizard/FileUploadZone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Edit2, Check, X } from 'lucide-react';
import type { Photo, PhotoCategory } from '@/lib/types';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const MAX_PHOTOS = 15;
const PHOTO_CATEGORIES: PhotoCategory[] = [
  'family',
  'education',
  'travel',
  'work',
  'achievement',
  'other',
];

// CATEGORY_LABELS se obtendrá dinámicamente usando traducciones

// Función para extraer metadatos del nombre del archivo
function extractPhotoMetadata(filename: string): { location: string; year: string } {
  // Quitar extensión
  const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
  
  // Patrones comunes:
  // "Santiago 1990.jpg"
  // "Santiago_1990.jpg"
  // "Viaje al Norte de Chile 1990.jpg"
  // "Vienna_1936.jpg"
  
  const patterns = [
    // "Lugar Año" o "Lugar_Año"
    /^(.+?)[\s_-](\d{4})$/,
    // "Lugar - Año" (con guión)
    /^(.+?)\s*-\s*(\d{4})$/,
    // "Año - Lugar" (invertido)
    /^(\d{4})\s*-\s*(.+)$/,
    // Solo lugar (sin año)
    /^(.+)$/,
  ];
  
  for (const pattern of patterns) {
    const match = nameWithoutExt.match(pattern);
    if (match) {
      // Patrón con año al final
      if (match[2] && /^\d{4}$/.test(match[2])) {
        return {
          location: match[1].trim().replace(/_/g, ' '),
          year: match[2],
        };
      }
      // Patrón con año al inicio
      else if (match[1] && /^\d{4}$/.test(match[1])) {
        return {
          location: match[2].trim().replace(/_/g, ' '),
          year: match[1],
        };
      }
      // Solo lugar
      else {
        return {
          location: match[1].trim().replace(/_/g, ' '),
          year: '',
        };
      }
    }
  }
  
  // Fallback: usar el nombre completo como location
  return {
    location: nameWithoutExt.replace(/_/g, ' '),
    year: '',
  };
}

export default function PhotosPage() {
  const router = useRouter();
  const { photos, addPhoto, removePhoto, updatePhoto, prevStep, nextStep } = useWizard();
  const { t } = useLanguage();
  
  // Categorías traducidas
  const CATEGORY_LABELS: Record<PhotoCategory, string> = {
    family: t('wizard.photoCategories.family'),
    education: t('wizard.photoCategories.education'),
    travel: t('wizard.photoCategories.travel'),
    work: t('wizard.photoCategories.work'),
    achievement: t('wizard.photoCategories.achievement'),
    other: t('wizard.photoCategories.other'),
  };
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    year: string;
    category: PhotoCategory;
    description: string;
    location: string;
  } | null>(null);

  const currentYear = new Date().getFullYear();

  const handleFilesAccepted = useCallback(
    async (files: File[]) => {
      const processedPhotos: Photo[] = [];
      
      for (const file of files) {
        // Extraer metadatos del nombre
        const { location, year } = extractPhotoMetadata(file.name);
        
        console.log(`📷 ${file.name}:`, { location, year });
        
        // Convertir a base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Usar año extraído o año por defecto
        const extractedYear = year ? parseInt(year) : null;
        const yearMatch = file.name.match(/(?:19|20)\d{2}/);
        const defaultYear = extractedYear || (yearMatch ? parseInt(yearMatch[0]) : currentYear);

        const newPhoto: Photo = {
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: base64,
          title: location || file.name.replace(/\.[^/.]+$/, ''),  // Usar location como título
          year: defaultYear,
          category: 'other',
          location: location || undefined,  // ✅ Agregar location
        };

        processedPhotos.push(newPhoto);
        addPhoto(newPhoto);
      }
      
      console.log(`📷 ${processedPhotos.length} fotos procesadas`);
      console.log(`✅ ${processedPhotos.filter(p => p.location).length} con ubicación detectada`);
      console.log(`✅ ${processedPhotos.filter(p => p.location && p.year).length} con año detectado`);
    },
    [addPhoto, currentYear]
  );

  const handleRemovePhoto = useCallback(
    (photoId: string) => {
      removePhoto(photoId);
    },
    [removePhoto]
  );

  const startEditing = (photo: Photo) => {
    setEditingPhotoId(photo.id);
    setEditForm({
      title: photo.title,
      year: photo.year.toString(),
      category: photo.category,
      description: photo.description || '',
      location: photo.location || '',
    });
  };

  const cancelEditing = () => {
    setEditingPhotoId(null);
    setEditForm(null);
  };

  const saveEditing = () => {
    if (editingPhotoId && editForm) {
      const year = parseInt(editForm.year);
      if (!isNaN(year) && year >= 1000 && year <= currentYear) {
        updatePhoto(editingPhotoId, {
          title: editForm.title.trim(),
          year,
          category: editForm.category,
          description: editForm.description.trim() || undefined,
          location: editForm.location.trim() || undefined,
        });
        cancelEditing();
      }
    }
  };

  const handleBack = () => {
    prevStep();
    router.push('/upload/basic');
  };

  const handleNext = () => {
    nextStep();
    router.push('/upload/letters');
  };

  const handleSkip = () => {
    handleNext();
  };

  const uploadedFiles = photos.map((photo) => ({
    name: photo.file?.name || photo.title,
    size: photo.file?.size || 0,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t('wizard.photosTitle')}</h2>
            <p className="text-muted-foreground">
              {t('wizard.photosDescription')}
            </p>
          </div>
          <LanguageSwitcher />
        </div>

        {/* Upload Zone */}
        {photos.length < MAX_PHOTOS && (
          <Card>
            <CardContent className="pt-6">
              <FileUploadZone
                onFilesAccepted={handleFilesAccepted}
                acceptedFileTypes={{
                  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
                }}
                maxFiles={MAX_PHOTOS}
                multiple={true}
                uploadedFiles={uploadedFiles}
                description={t('wizard.photoFormatHelp')}
              />
            </CardContent>
          </Card>
        )}

        {photos.length >= MAX_PHOTOS && (
          <div className="rounded-lg border bg-muted/50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t('wizard.photosLoaded')} ({MAX_PHOTOS})
            </p>
          </div>
        )}

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <Card key={photo.id} className="overflow-hidden">
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={photo.preview}
                    alt={photo.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <CardContent className="p-4 space-y-3">
                  {editingPhotoId === photo.id && editForm ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`title-${photo.id}`}>{t('wizard.lettersTitle')}</Label>
                        <Input
                          id={`title-${photo.id}`}
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm({ ...editForm, title: e.target.value })
                          }
                          placeholder={t('wizard.photoTitlePlaceholder')}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor={`location-${photo.id}`}>{t('wizard.location')}</Label>
                          <Input
                            id={`location-${photo.id}`}
                            value={editForm.location}
                            onChange={(e) =>
                              setEditForm({ ...editForm, location: e.target.value })
                            }
                            placeholder={t('wizard.locationExample')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`year-${photo.id}`}>{t('wizard.year')}</Label>
                          <Input
                            id={`year-${photo.id}`}
                            type="number"
                            value={editForm.year}
                            onChange={(e) =>
                              setEditForm({ ...editForm, year: e.target.value })
                            }
                            min="1000"
                            max={currentYear}
                            placeholder={t('wizard.year')}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`category-${photo.id}`}>{t('wizard.category')}</Label>
                        <Select
                          value={editForm.category}
                          onValueChange={(value: PhotoCategory) =>
                            setEditForm({ ...editForm, category: value })
                          }
                        >
                          <SelectTrigger id={`category-${photo.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PHOTO_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {CATEGORY_LABELS[cat]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`description-${photo.id}`}>
                          {t('wizard.description')} ({t('common.continue')})
                        </Label>
                        <Textarea
                          id={`description-${photo.id}`}
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({ ...editForm, description: e.target.value })
                          }
                          placeholder={t('wizard.photoDescriptionPlaceholder')}
                          rows={2}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={saveEditing}
                          className="flex-1"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {t('common.save')}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={cancelEditing}
                          className="flex-1"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t('common.cancel')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{photo.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {photo.year} • {CATEGORY_LABELS[photo.category]}
                            {photo.location && ` • 📍 ${photo.location}`}
                          </p>
                          {photo.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {photo.description}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => startEditing(photo)}
                          className="shrink-0"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span className="sr-only">{t('wizard.editPhoto')}</span>
                        </Button>
                      </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="w-full"
                        >
                          <X className="w-4 h-4 mr-1" />
                          {t('common.delete')}
                        </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button type="button" variant="outline" onClick={handleBack}>
          {t('common.back')}
        </Button>

        <div className="flex gap-2">
          {photos.length === 0 && (
            <Button type="button" variant="ghost" onClick={handleSkip}>
              {t('common.continue')}
            </Button>
          )}
          <Button type="button" onClick={handleNext}>
            {t('common.continue')}: {t('wizard.letters')}
          </Button>
        </div>
      </div>
    </div>
  );
}

