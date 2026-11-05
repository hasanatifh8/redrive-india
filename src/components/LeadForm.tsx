'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { CheckCircle2, Loader2, Send, TicketPercent } from 'lucide-react';
import { checkReferralCode, submitLead, type LeadState } from '@/app/(site)/actions';
import { telHref, waHref } from '@/lib/settings-defaults';
import { formatPrice } from '@/lib/pricing';
import { useSettings } from './SettingsProvider';
import { WhatsAppIcon } from './BrandIcons';

export type Field = {
  name: string;
  label: string;
  type?: 'text' | 'tel' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  half?: boolean;
  defaultValue?: string;
};

type LeadType = 'test_drive' | 'buy' | 'sell' | 'exchange' | 'general';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-[14px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-brand-dark active:scale-[0.98] disabled:opacity-70 sm:col-span-2"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      {pending ? 'Sending…' : label}
    </button>
  );
}

type Props = {
  title: string;
  type: LeadType;
  fields: Field[];
  carId?: number;
  submitLabel?: string;
  showReferral?: boolean;
};

export default function LeadForm(props: Props) {
  // Remounting the inner form is the clean way to reset useFormState.
  const [round, setRound] = useState(0);
  return <LeadFormInner key={round} {...props} onReset={() => setRound((r) => r + 1)} />;
}

function LeadFormInner({ title, type, fields, carId, submitLabel = 'Send enquiry', showReferral = false, onReset }: Props & { onReset: () => void }) {
  const s = useSettings();
  const [state, action] = useFormState<LeadState, FormData>(submitLead, null);
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const applyCode = async () => {
    setChecking(true);
    const res = await checkReferralCode(code, carId);
    setChecking(false);
    setCodeMsg({ ok: res.ok, text: res.ok && res.discount ? `${res.message} · you save ${formatPrice(res.discount)}` : res.message });
  };

  if (state?.ok) {
    return (
      <div className="rd-card flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="size-12 text-emerald-600" />
        <h3 className="text-[20px] font-semibold text-ink">{state.message}</h3>
        <p className="max-w-sm text-[14px] text-muted-foreground">
          Need it faster? Call{' '}
          <a href={telHref(s.phonePrimary)} className="font-semibold text-brand">
            {s.phonePrimary}
          </a>{' '}
          or message us on WhatsApp.
        </p>
        {state.summary && (
          <a
            href={waHref(s, state.summary)}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center gap-2 rounded-lg bg-[#25D366] px-4 text-[14px] font-semibold text-white"
          >
            <WhatsAppIcon />
            Also send on WhatsApp
          </a>
        )}
        <button
          type="button"
          onClick={onReset}
          className="mt-1 text-[14px] font-semibold text-brand hover:text-brand-dark"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="rd-card grid gap-4 p-5 sm:grid-cols-2 md:p-6">
      <h3 className="text-[20px] font-semibold text-ink sm:col-span-2">{title}</h3>
      <input type="hidden" name="type" value={type} />
      {carId && <input type="hidden" name="carId" value={carId} />}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      {fields.map((f) => {
        const id = `lead-${type}-${f.name}`;
        const common = { id, name: f.name, required: f.required, placeholder: f.placeholder, defaultValue: f.defaultValue };
        return (
          <div key={f.name} className={`flex flex-col gap-1 ${f.half ? '' : 'sm:col-span-2'}`}>
            <label htmlFor={id} className="text-[12px] font-medium text-muted-foreground">
              {f.label}
              {f.required && <span className="text-brand"> *</span>}
            </label>
            {f.type === 'select' ? (
              <select {...common} className="rd-select">
                <option value="">Select</option>
                {f.options?.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea {...common} rows={3} className="rd-input h-auto py-2" />
            ) : (
              <input
                {...common}
                type={f.type ?? 'text'}
                className="rd-input"
                inputMode={f.type === 'tel' ? 'tel' : undefined}
                min={f.type === 'date' ? new Date().toISOString().slice(0, 10) : undefined}
              />
            )}
          </div>
        );
      })}

      {showReferral && (
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor={`lead-${type}-ref`} className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground">
            <TicketPercent className="size-3.5" /> Referral / coupon code
          </label>
          <div className="flex gap-2">
            <input
              id={`lead-${type}-ref`}
              name="referralCode"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setCodeMsg(null);
              }}
              placeholder="e.g. WELCOME5K"
              className="rd-input uppercase"
            />
            <button
              type="button"
              disabled={!code || checking}
              onClick={applyCode}
              className="h-10 shrink-0 rounded-lg border border-border px-4 text-[14px] font-semibold text-ink hover:border-brand hover:text-brand disabled:opacity-50"
            >
              {checking ? 'Checking…' : 'Apply'}
            </button>
          </div>
          {codeMsg && <p className={`text-[12px] font-medium ${codeMsg.ok ? 'text-emerald-700' : 'text-brand'}`}>{codeMsg.text}</p>}
        </div>
      )}

      {state && !state.ok && <p className="rounded-lg bg-brand-soft px-3 py-2 text-[13px] font-medium text-brand sm:col-span-2">{state.message}</p>}
      <SubmitButton label={submitLabel} />
      <p className="text-[12px] text-muted-foreground sm:col-span-2">We’ll only use your number to respond to this enquiry.</p>
    </form>
  );
}
