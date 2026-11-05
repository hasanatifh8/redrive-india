import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CompareTray from '@/components/CompareTray';
import { ShortlistProvider } from '@/components/ShortlistProvider';
import { SettingsProvider } from '@/components/SettingsProvider';
import { getSettings } from '@/lib/data';

// Inventory, prices and settings change from the admin panel — always render fresh.
export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <SettingsProvider value={settings}>
      <ShortlistProvider>
        <div className="flex min-h-screen flex-col bg-page pb-14 md:pb-0">
          {settings.announcement && (
            <div className="bg-brand px-4 py-2 text-center text-[13px] font-medium text-white">{settings.announcement}</div>
          )}
          <Header />
          <main className="flex-1">{children}</main>
          <Footer settings={settings} />
        </div>
        <CompareTray />
      </ShortlistProvider>
    </SettingsProvider>
  );
}
