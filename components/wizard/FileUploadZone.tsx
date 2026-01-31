'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface FileUploadZoneProps {
  onFilesAccepted: (files: File[]) => void;
  acceptedFileTypes: Record<string, string[]>;
  maxFiles: number;
  multiple: boolean;
  uploadedFiles: Array<{ name: string; size: number }>;
  onRemoveFile?: (index: number) => void;
  description: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function FileUploadZone({
  onFilesAccepted,
  acceptedFileTypes,
  maxFiles,
  multiple,
  uploadedFiles,
  onRemoveFile,
  description,
}: FileUploadZoneProps) {
  const { t } = useLanguage();
  const [isDragging, setIsDragging] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any[]) => {
      setIsDragging(false);
      setRejectedFiles([]);

      if (fileRejections.length > 0) {
        const rejectedNames = fileRejections.map((rejection) => rejection.file.name);
        setRejectedFiles(rejectedNames);
        return;
      }

      if (acceptedFiles.length > 0) {
        // Verificar límite de archivos
        const totalFiles = uploadedFiles.length + acceptedFiles.length;
        if (totalFiles > maxFiles) {
          const allowed = maxFiles - uploadedFiles.length;
          if (allowed > 0) {
            onFilesAccepted(acceptedFiles.slice(0, allowed));
          } else {
            setRejectedFiles([t('wizard.fileLimitReached')]);
          }
        } else {
          onFilesAccepted(acceptedFiles);
        }
      }
    },
    [onFilesAccepted, maxFiles, uploadedFiles.length]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple,
    maxFiles: multiple ? maxFiles : 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
  });

  const handleRemoveFile = (index: number) => {
    if (onRemoveFile) {
      onRemoveFile(index);
    }
  };

  const getDropzoneClassName = () => {
    if (isDragReject) {
      return 'border-destructive bg-destructive/5';
    }
    if (isDragActive || isDragging) {
      return 'border-primary bg-primary/5';
    }
    return 'border-gray-300 dark:border-gray-600';
  };

  return (
    <div className="w-full space-y-4">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
          'hover:border-primary/50 hover:bg-accent/5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          getDropzoneClassName()
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              'p-4 rounded-full transition-colors',
              isDragReject
                ? 'bg-destructive/10 text-destructive'
                : isDragActive || isDragging
                ? 'bg-primary/10 text-primary'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            )}
          >
            <Upload
              className={cn(
                'w-8 h-8',
                isDragReject && 'text-destructive',
                (isDragActive || isDragging) && 'text-primary'
              )}
            />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              {isDragReject
                ? t('wizard.fileTypeNotAllowed')
                : isDragActive || isDragging
                ? t('wizard.dropFilesHere')
                : t('wizard.dragFilesHere')}
            </p>
            <p className="text-xs text-muted-foreground">{description}</p>
            {uploadedFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('wizard.filesCount', { current: uploadedFiles.length, max: maxFiles })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error Messages */}
      {rejectedFiles.length > 0 && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-sm font-medium text-destructive mb-1">{t('wizard.rejectedFiles')}:</p>
          <ul className="text-xs text-destructive/80 list-disc list-inside">
            {rejectedFiles.map((file, index) => (
              <li key={index}>{file}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">{t('wizard.filesUploaded')}:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-md border bg-card text-card-foreground"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                {onRemoveFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(index);
                    }}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                    <span className="sr-only">{t('wizard.removeFile')}</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

