'use client';

import { useFormState } from 'react-dom';
import type { SiteSettings } from '@/lib/settings-defaults';
import { saveSettings, type ActionResult } from '@/app/admin/actions';
import { SubmitButton, Toast } from '@/components/admin/client';
import { Card, Field } from '@/components/admin/ui';

type Def = { key: keyof SiteSettings; label: string; hint?: string; type?: 'textarea' | 'number'; wide?: boolean };

const GROUPS: { title: string; description?: string; fields: Def[] }[] = [
  {
    title: 'Business & contact',
    fields: [
      { key: 'businessName', label: 'Business name' },
      { key: 'email', label: 'Email (optional)' },
      { key: 'phonePrimary', label: 'Primary phone', hint: 'Shown in header and used for Call buttons' },
      { key: 'phoneAlternate', label: 'Alternate phone', hint: 'Leave blank to hide' },
      { key: 'whatsappNumber', label: 'WhatsApp number', hint: '10-digit mobile or with 91 prefix' },
      { key: 'instagramHandle', label: 'Instagram handle' },
      { key: 'instagramUrl', label: 'Instagram URL', wide: true },
    ],
  },
  {
    title: 'Location & hours',
    fields: [
      { key: 'address', label: 'Full address', wide: true },
      { key: 'addressShort', label: 'Short address', hint: 'Used in the hero section' },
      { key: 'mapsUrl', label: 'Google Maps link', hint: 'For the “Get directions” button' },
      { key: 'mapEmbedUrl', label: 'Google Maps embed URL (optional)', hint: 'Google Maps → Share → Embed a map → copy only the src="…" link', wide: true },
      { key: 'hoursWeekdays', label: 'Hours: Monday – Saturday', hint: 'e.g. 10:00 AM – 7:30 PM' },
      { key: 'hoursSunday', label: 'Hours: Sunday', hint: 'e.g. 11:00 AM – 4:00 PM or Closed' },
    ],
  },
  {
    title: 'Homepage',
    fields: [
      { key: 'heroTitle', label: 'Hero headline' },
      { key: 'heroSubtitle', label: 'Hero second line (grey)' },
      { key: 'heroText', label: 'Hero paragraph', type: 'textarea', wide: true },
      { key: 'announcement', label: 'Announcement bar', hint: 'Red strip at the very top of every page. Leave blank to hide.', wide: true },
    ],
  },
  {
    title: 'Finance (EMI calculator)',
    fields: [
      { key: 'emiInterestRate', label: 'Default interest rate (% p.a.)', type: 'number' },
      { key: 'emiMaxTenureMonths', label: 'Maximum tenure (months)', type: 'number' },
    ],
  },
];

export default function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action] = useFormState<ActionResult, FormData>(saveSettings, null);
  return (
    <form action={action} className="flex flex-col gap-6 pb-10">
      {state && <Toast key={Date.now()} message={state.message} ok={state.ok} />}
      {GROUPS.map((g) => (
        <Card key={g.title} title={g.title} description={g.description}>
          <div className="grid gap-4 md:grid-cols-2">
            {g.fields.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={`s-${f.key}`} hint={f.hint} className={f.wide ? 'md:col-span-2' : ''}>
                {f.type === 'textarea' ? (
                  <textarea id={`s-${f.key}`} name={f.key} rows={3} defaultValue={settings[f.key]} className="rd-input h-auto py-2" />
                ) : (
                  <input id={`s-${f.key}`} name={f.key} type={f.type ?? 'text'} step={f.type === 'number' ? 'any' : undefined} defaultValue={settings[f.key]} className="rd-input" />
                )}
              </Field>
            ))}
          </div>
        </Card>
      ))}
      <Card title="Display">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="showDemoNotice" defaultChecked={settings.showDemoNotice === 'true'} className="mt-0.5 size-4 accent-[var(--brand)]" />
          <span>
            <span className="block text-[14px] font-medium text-ink">Show “demo data” notices</span>
            <span className="text-[12px] text-muted-foreground">Turn this off once your real stock is listed.</span>
          </span>
        </label>
      </Card>
      <div className="sticky bottom-4 flex justify-end">
        <SubmitButton className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-[14px] font-semibold text-white shadow-lg shadow-brand/30 hover:bg-brand-dark disabled:opacity-60">
          Save settings
        </SubmitButton>
      </div>
    </form>
  );
}
