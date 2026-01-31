'use client';

import { Check } from 'lucide-react';
import { useWizard } from './WizardContext';
import { cn } from '@/lib/utils';

const steps = [
  { number: 1, title: 'Basic Info', subtitle: 'Personal details' },
  { number: 2, title: 'Photos', subtitle: 'Key moments' },
  { number: 3, title: 'Letters', subtitle: 'Correspondence' },
  { number: 4, title: 'Travels', subtitle: 'Trip history' },
  { number: 5, title: 'Preview', subtitle: 'Review & generate' },
];

export function WizardProgress() {
  const { currentStep } = useWizard();

  return (
    <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isPending = step.number > currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1 relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute top-4 sm:top-5 left-[60%] w-full h-0.5 transition-colors duration-300',
                      isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    )}
                    style={{ width: 'calc(100% - 2rem)' }}
                  />
                )}

                {/* Step Circle Container */}
                <div className="relative z-10">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-300',
                      isCompleted &&
                        'bg-green-500 border-green-500 text-white',
                      isCurrent &&
                        'bg-blue-500 border-blue-500 text-white ring-2 sm:ring-4 ring-blue-200 dark:ring-blue-900',
                      isPending &&
                        'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                </div>

                {/* Step Label */}
                <div className="mt-2 sm:mt-3 text-center max-w-[100px] sm:max-w-[120px]">
                  <div
                    className={cn(
                      'text-xs sm:text-sm font-medium transition-colors duration-300',
                      isCompleted && 'text-green-600 dark:text-green-400',
                      isCurrent && 'text-blue-600 dark:text-blue-400 font-semibold',
                      isPending && 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {step.title}
                  </div>
                  <div
                    className={cn(
                      'text-[10px] sm:text-xs mt-0.5 transition-colors duration-300 hidden sm:block',
                      isCompleted && 'text-green-500 dark:text-green-500',
                      isCurrent && 'text-blue-500 dark:text-blue-500',
                      isPending && 'text-gray-400 dark:text-gray-500'
                    )}
                  >
                    {step.subtitle}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

