import { useContext } from 'react';
import { SecretLairDropSettingsContext } from './SecretLairDropSettingsContext';

export function useSecretLairDropSettings() {
  const context = useContext(SecretLairDropSettingsContext);
  if (!context) {
    throw new Error('useSecretLairDropSettings must be used within SecretLairDropSettingsProvider');
  }
  return context;
}
