'use client';

/**
 * Migration Wizard
 * 
 * Step-by-step wizard to transition from localStorage guest sessions to accounts
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Lock,
  Cloud,
  Download,
  Upload,
  Users,
  Shield,
  X,
} from 'lucide-react';
import { StoryStorage } from '@/lib/storage/storyStorage';
import { AccountStorage, type Account } from '@/lib/storage/accountStorage';
import type { SavedData } from '@/lib/storage/storyStorage';

type MigrationStep = 'intro' | 'account' | 'import' | 'conflict' | 'encryption' | 'complete';

interface MigrationWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function MigrationWizard({
  onComplete,
  onCancel,
}: MigrationWizardProps) {
  const [currentStep, setCurrentStep] = useState<MigrationStep>('intro');
  const [guestData, setGuestData] = useState<SavedData | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load guest data on mount
  useEffect(() => {
    const data = StoryStorage.loadAll();
    setGuestData(data);
  }, []);

  // Check if account already exists
  useEffect(() => {
    const existingAccount = AccountStorage.getAccount();
    if (existingAccount) {
      setAccount(existingAccount);
      setCurrentStep('complete');
    }
  }, []);

  const steps: Array<{ id: MigrationStep; title: string; description: string }> = [
    { id: 'intro', title: 'Welcome', description: 'Get started with account migration' },
    { id: 'account', title: 'Create Account', description: 'Set up your account credentials' },
    { id: 'import', title: 'Import Data', description: 'Import your guest session data' },
    { id: 'conflict', title: 'Resolve Conflicts', description: 'Handle any data conflicts' },
    { id: 'encryption', title: 'Encryption Setup', description: 'Configure secure encryption' },
    { id: 'complete', title: 'Complete', description: 'Migration finished' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 'account') {
      if (!formData.email || !formData.email.includes('@')) {
        newErrors.email = 'Valid email is required';
      }
      if (!formData.username || formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
      if (!formData.password || formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      if (currentStep === 'intro') {
        setCurrentStep('account');
      } else if (currentStep === 'account') {
        // Create account
        setProgress(25);
        const newAccount = await AccountStorage.createAccount(
          formData.email,
          formData.username,
          formData.password
        );
        setAccount(newAccount);
        setProgress(50);

        // Check for conflicts (simulate - in production, check cloud)
        setProgress(75);
        // For now, skip conflict detection
        setCurrentStep('import');
      } else if (currentStep === 'import') {
        // Import guest data
        setProgress(30);
        if (guestData) {
          // Data is already in localStorage, just mark as migrated
          setProgress(60);
          // Create initial backup
          setProgress(80);
          await AccountStorage.createBackup(
            formData.password,
            'Initial migration backup'
          );
          setProgress(100);
        }
        setCurrentStep('encryption');
      } else if (currentStep === 'encryption') {
        // Encryption is already set up during account creation
        setProgress(100);
        setCurrentStep('complete');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Migration failed' });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSkip = () => {
    if (currentStep === 'conflict') {
      setCurrentStep('encryption');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">
                Migrate to Account
              </h2>
              <p className="text-gray-400">
                Create an account to enable cloud sync, encryption, and access your stories from any device.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-purple-400" />
                  What You'll Get
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Cloud sync across all devices
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    End-to-end encryption
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Automatic backups
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Secure sharing
                  </li>
                </ul>
              </div>

              {guestData && (
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">Guest Data Found</h4>
                      <p className="text-sm text-gray-300">
                        We found your guest session data. It will be imported automatically.
                      </p>
                      <div className="mt-2 text-xs text-gray-400">
                        {guestData.story && `Story: ${guestData.story.title}`}
                        {guestData.scenes.length > 0 && ` • ${guestData.scenes.length} scenes`}
                        {guestData.characters.length > 0 && ` • ${guestData.characters.length} characters`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
              <p className="text-gray-400">
                Choose your credentials. Your password will be used to encrypt your data.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-400 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Choose a username"
                />
                {errors.username && (
                  <p className="text-sm text-red-400 mt-1">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="At least 8 characters"
                />
                {errors.password && (
                  <p className="text-sm text-red-400 mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-200">
                <Lock className="w-4 h-4 inline mr-2" />
                Your password is used to encrypt your data. Make sure to remember it or save it securely.
              </p>
            </div>
          </div>
        );

      case 'import':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Import Guest Data</h2>
              <p className="text-gray-400">
                Your guest session data will be imported into your account.
              </p>
            </div>

            {guestData && (
              <div className="space-y-3">
                <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <h3 className="text-white font-semibold mb-3">Data to Import</h3>
                  <div className="space-y-2 text-sm">
                    {guestData.story && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Story</span>
                        <span className="text-gray-400">{guestData.story.title}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Scenes</span>
                      <span className="text-gray-400">{guestData.scenes.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Characters</span>
                      <span className="text-gray-400">{guestData.characters.length}</span>
                    </div>
                    {guestData.outline && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Outline</span>
                        <span className="text-gray-400">Yes</span>
                      </div>
                    )}
                  </div>
                </div>

                {isProcessing && (
                  <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400" />
                      <span className="text-white">Importing data...</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-purple-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'conflict':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Resolve Conflicts</h2>
              <p className="text-gray-400">
                We found some conflicts between your local data and cloud data.
              </p>
            </div>

            {conflicts.length === 0 ? (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <p className="text-green-200">No conflicts found!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                    <h3 className="text-white font-semibold mb-2">{conflict.id}</h3>
                    <p className="text-sm text-gray-400 mb-3">{conflict.description}</p>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded">
                        Use Local
                      </button>
                      <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded">
                        Use Cloud
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'encryption':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Encryption Setup</h2>
              <p className="text-gray-400">
                Your data is now encrypted and ready for secure cloud sync.
              </p>
            </div>

            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <h3 className="text-white font-semibold mb-1">Encryption Active</h3>
                  <p className="text-sm text-gray-300">
                    All your story data is encrypted using end-to-end encryption. Only you can decrypt it with your password.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Cloud className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <h3 className="text-white font-semibold mb-1">Cloud Sync Ready</h3>
                  <p className="text-sm text-gray-300">
                    Your encrypted data can now be synced securely across all your devices.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="space-y-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-4" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Migration Complete!</h2>
              <p className="text-gray-400">
                Your account has been created and your data has been migrated.
              </p>
            </div>

            {account && (
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Account ID</span>
                    <span className="text-gray-300 font-mono text-xs">{account.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Username</span>
                    <span className="text-gray-300">{account.username}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Email</span>
                    <span className="text-gray-300">{account.email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (currentStep === 'complete') {
    return (
      <div 
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && onCancel) {
            onCancel();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {renderStepContent()}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                onComplete?.();
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Get Started
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancel) {
          onCancel();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Account Migration</h1>
            <p className="text-sm text-gray-400 mt-1">
              Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].title}
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-700">
          <motion.div
            className="h-full bg-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Step Indicators */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    index <= currentStepIndex
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-purple-600' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200 text-sm">{errors.general}</p>
            </div>
          )}

          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isProcessing}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-2">
            {currentStep === 'conflict' && conflicts.length > 0 && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Skip for Now
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isProcessing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Processing...
                </>
              ) : currentStep === 'encryption' ? (
                <>
                  Complete
                  <CheckCircle className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
