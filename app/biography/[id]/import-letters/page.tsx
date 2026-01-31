'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { importLettersFromNER } from '@/lib/storage/indexed-db';

export default function ImportLettersPage() {
  const params = useParams();
  const router = useRouter();
  const biographyId = params?.id as string;
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const text = await file.text();
      const count = await importLettersFromNER(biographyId, text);
      
      setResult({
        success: true,
        count: count
      });
      
      // Esperar 2 segundos y volver al timeline
      setTimeout(() => {
        router.push(`/biography/${biographyId}`);
      }, 2000);
      
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || 'Error al importar cartas'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Importar Cartas con Análisis NER
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sube el archivo CSV procesado con entidades detectadas (personas, lugares, eventos históricos)
          </p>
        </div>

        {/* Upload area */}
        <div className="mb-6">
          <label 
            htmlFor="csv-upload"
            className={`
              block w-full p-12 border-2 border-dashed rounded-lg text-center cursor-pointer
              transition-colors
              ${file 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              }
            `}
          >
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            
            {file ? (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  ✓ {file.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  Click para cambiar archivo
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                  Click para seleccionar archivo CSV
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  o arrastra el archivo aquí
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Info */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Formato esperado
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Archivo: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">letters-full-processed.csv</code></li>
            <li>• Debe contener las columnas: id, sobre, title, date, sender, recipient, content, etc.</li>
            <li>• Las cartas se agregarán a la biografía existente</li>
            <li>• No se duplicarán cartas que ya existan (comparación por "sobre")</li>
          </ul>
        </div>

        {/* Result */}
        {result && (
          <div className={`mb-6 p-4 rounded-lg border ${
            result.success 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            {result.success ? (
              <div>
                <p className="font-medium text-green-900 dark:text-green-200 mb-1">
                  ✓ Importación exitosa
                </p>
                <p className="text-sm text-green-800 dark:text-green-300">
                  Se importaron {result.count} cartas nuevas. Redirigiendo al timeline...
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-red-900 dark:text-red-200 mb-1">
                  ✗ Error al importar
                </p>
                <p className="text-sm text-red-800 dark:text-red-300">
                  {result.error}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/biography/${biographyId}`)}
            className="flex-1 px-6 py-3 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className={`
              flex-1 px-6 py-3 rounded-lg font-medium text-white
              ${file && !loading
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
              }
            `}
          >
            {loading ? 'Importando...' : 'Importar Cartas'}
          </button>
        </div>
      </div>
    </div>
  );
}

