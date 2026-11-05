'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { SETTING_DEFAULTS, type SiteSettings } from '@/lib/settings-defaults';

const SettingsContext = createContext<SiteSettings>(SETTING_DEFAULTS);

export function SettingsProvider({ value, children }: { value: SiteSettings; children: ReactNode }) {
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
