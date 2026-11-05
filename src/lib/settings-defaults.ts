// Shared between server and client — no DB imports here.

export const SETTING_DEFAULTS = {
  businessName: 'REDRIVE INDIA',
  address: '120 Feet Road, Kalindipuram, Prayagraj, Uttar Pradesh',
  addressShort: '120 Feet Road, Kalindipuram',
  phonePrimary: '99188 16493',
  phoneAlternate: '94152 88834',
  whatsappNumber: '919918816493',
  email: '',
  instagramHandle: '@redriveindiaprayagraj',
  instagramUrl: 'https://www.instagram.com/redriveindiaprayagraj',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=REDRIVE+INDIA+120+Feet+Road+Kalindipuram+Prayagraj',
  mapEmbedUrl: '',
  hoursWeekdays: 'To be updated by dealership',
  hoursSunday: 'To be updated by dealership',
  heroTitle: 'Premium Pre-Owned Cars',
  heroSubtitle: 'bought, sold & exchanged — honestly.',
  heroText:
    'Find your next car from our Kalindipuram yard, sell your current car for a fair price, or exchange it for an upgrade — all at one local dealership on 120 Feet Road.',
  announcement: '',
  showDemoNotice: 'true',
  emiInterestRate: '10.5',
  emiMaxTenureMonths: '84',
  tokenAmount: '10000',
};

export type SiteSettings = typeof SETTING_DEFAULTS;
export type SettingKey = keyof SiteSettings;

export const telHref = (phone: string) => `tel:+91${phone.replace(/\D/g, '').slice(-10)}`;
export const waHref = (s: SiteSettings, text?: string) =>
  `https://wa.me/${s.whatsappNumber.replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
export const DEFAULT_WA_TEXT = 'Hello REDRIVE INDIA, I would like to enquire about a car.';
