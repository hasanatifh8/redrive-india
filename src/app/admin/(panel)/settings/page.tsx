import { getSettings } from '@/lib/data';
import { PageHeader } from '@/components/admin/ui';
import SettingsForm from './SettingsForm';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Website settings" description="Contact details, opening hours, homepage text and finance defaults. Changes appear on the website immediately." />
      <SettingsForm settings={settings} />
    </>
  );
}
