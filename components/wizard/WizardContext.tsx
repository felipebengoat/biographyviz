'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { BiographyBasics, Photo, Letter, Trip } from '@/lib/types';

interface WizardContextType {
  currentStep: number;
  basics?: BiographyBasics;
  photos: Photo[];
  letters: Letter[];
  trips: Trip[];
  
  // Métodos de actualización
  setBasics: (basics: BiographyBasics) => void;
  addPhoto: (photo: Photo) => void;
  removePhoto: (id: string) => void;
  updatePhoto: (id: string, updates: Partial<Photo>) => void;
  setLetters: (letters: Letter[]) => void;
  setTrips: (trips: Trip[]) => void;
  
  // Métodos de navegación
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  resetWizard: () => void;
}

const WizardContext = createContext<WizardContextType | undefined>(undefined);

const TOTAL_STEPS = 5;

const initialState = {
  currentStep: 1,
  basics: undefined,
  photos: [],
  letters: [],
  trips: [],
};

export function WizardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(initialState.currentStep);
  const [basics, setBasicsState] = useState<BiographyBasics | undefined>(initialState.basics);
  const [photos, setPhotos] = useState<Photo[]>(initialState.photos);
  const [letters, setLettersState] = useState<Letter[]>(initialState.letters);
  const [trips, setTripsState] = useState<Trip[]>(initialState.trips);

  const setBasics = useCallback((newBasics: BiographyBasics) => {
    setBasicsState(newBasics);
  }, []);

  const addPhoto = useCallback((photo: Photo) => {
    setPhotos((prev) => [...prev, photo]);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  }, []);

  const updatePhoto = useCallback((id: string, updates: Partial<Photo>) => {
    setPhotos((prev) =>
      prev.map((photo) => (photo.id === id ? { ...photo, ...updates } : photo))
    );
  }, []);

  const setLetters = useCallback((newLetters: Letter[]) => {
    setLettersState(newLetters);
  }, []);

  const setTrips = useCallback((newTrips: Trip[]) => {
    setTripsState(newTrips);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  const resetWizard = useCallback(() => {
    setCurrentStep(initialState.currentStep);
    setBasicsState(initialState.basics);
    setPhotos(initialState.photos);
    setLettersState(initialState.letters);
    setTripsState(initialState.trips);
  }, []);

  const value: WizardContextType = {
    currentStep,
    basics,
    photos,
    letters,
    trips,
    setBasics,
    addPhoto,
    removePhoto,
    updatePhoto,
    setLetters,
    setTrips,
    nextStep,
    prevStep,
    goToStep,
    resetWizard,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
}

