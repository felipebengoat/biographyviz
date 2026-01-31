import { WizardProvider } from '@/components/wizard/WizardContext';
import { WizardProgress } from '@/components/wizard/WizardProgress';

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WizardProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600">
        <div className="min-h-screen bg-white/95 dark:bg-gray-950/95 backdrop-blur-sm">
          {/* Header */}
          <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  BiographyViz
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Crea visualizaciones interactivas de biografías paso a paso
                </p>
              </div>
            </div>
          </header>

          {/* Progress Bar */}
          <div className="border-b border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
            <WizardProgress />
          </div>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </div>
    </WizardProvider>
  );
}

