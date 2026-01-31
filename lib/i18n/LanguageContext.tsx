'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en'); // DEFAULT: English

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('biographyviz_language');
    if (saved === 'en' || saved === 'es') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('biographyviz_language', lang);
  };

      const t = (key: string, params?: Record<string, string | number>): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
          value = value?.[k];
          if (value === undefined) break;
        }

        let result = value || key;
        
        // Reemplazar parámetros si existen (soporta tanto {param} como {{param}})
        if (params && typeof result === 'string') {
          Object.keys(params).forEach(param => {
            // Soporte para {param} y {{param}}
            result = result.replace(new RegExp(`\\{\\{${param}\\}\\}`, 'g'), String(params[param]));
            result = result.replace(new RegExp(`\\{${param}\\}`, 'g'), String(params[param]));
          });
        }

        return result;
      };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
