'use client';

import { useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Copy, Pencil, Plus, Shuffle, Trash2, X } from 'lucide-react';
import { formatRupees } from '@/lib/pricing';
import { deleteReferral, saveReferral, toggleReferral, type ActionResult } from '@/app/admin/actions';
import { ActionButton, SubmitButton, Toast } from '@/components/admin/client';
import { Badge, Field, btn } from '@/components/admin/ui';

export type CodeRow = {
  id: number;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  maxDiscount: number | null;
  referrerName: string;
  referrerPhone: string;
  rewardAmount: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  leadCount: number;
  wonCount: number;
  rewardsOwed: number;
};

const randomCode = (name = '') => {
  const prefix = name.replace(/[^a-z]/gi, '').slice(0, 5).toUpperCase() || 'RD';
  return `${prefix}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

function CodeForm({ edit, onDone }: { edit: CodeRow | null; onDone: (saved: boolean) => void }) {
  const router = useRouter();
  const [state, action] = useFormState<ActionResult, FormData>(saveReferral, null);
  const [code, setCode] = useState(edit?.code ?? '');
  const [referrer, setReferrer] = useState(edit?.referrerName ?? '');
  const [type, setType] = useState(edit?.discountType ?? 'flat');

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
      onDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="rd-card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-ink">{edit ? `Edit ${edit.code}` : 'New code'}</h2>
        <button type="button" onClick={() => onDone(false)} className="rounded-full p-1 hover:bg-muted" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      {edit && <input type="hidden" name="id" value={edit.id} />}

      <Field label="Code *" htmlFor="rc-code" hint="Customers type this. Letters, numbers, - and _ only.">
        <div className="flex gap-2">
          <input id="rc-code" name="code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))} className="rd-input font-mono uppercase" placeholder="RAHUL5K" />
          <button type="button" onClick={() => setCode(randomCode(referrer))} className={btn.outline} title="Generate">
            <Shuffle className="size-4" />
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Discount type" htmlFor="rc-type">
          <select id="rc-type" name="discountType" value={type} onChange={(e) => setType(e.target.value)} className="rd-select">
            <option value="flat">₹ Flat amount</option>
            <option value="percent">% of price</option>
          </select>
        </Field>
        <Field label={type === 'flat' ? 'Amount (₹)' : 'Percent (%)'} htmlFor="rc-val">
          <input id="rc-val" name="discountValue" type="number" min={0} max={type === 'percent' ? 50 : undefined} required defaultValue={edit?.discountValue ?? 5000} className="rd-input" />
        </Field>
      </div>
      {type === 'percent' && (
        <Field label="Max discount (₹, optional)" htmlFor="rc-max">
          <input id="rc-max" name="maxDiscount" type="number" min={0} defaultValue={edit?.maxDiscount ?? ''} className="rd-input" placeholder="e.g. 20000" />
        </Field>
      )}

      <Field label="Internal description" htmlFor="rc-desc">
        <input id="rc-desc" name="description" defaultValue={edit?.description} className="rd-input" placeholder="e.g. Code for Rahul’s friends" />
      </Field>

      <div className="rounded-lg bg-page p-3">
        <p className="mb-2 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">Referrer (who gets the reward)</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" htmlFor="rc-rn">
            <input id="rc-rn" name="referrerName" value={referrer} onChange={(e) => setReferrer(e.target.value)} className="rd-input" placeholder="Rahul Sharma" />
          </Field>
          <Field label="Phone" htmlFor="rc-rp">
            <input id="rc-rp" name="referrerPhone" defaultValue={edit?.referrerPhone} className="rd-input" />
          </Field>
          <Field label="Reward per sale (₹)" htmlFor="rc-rw" className="col-span-2">
            <input id="rc-rw" name="rewardAmount" type="number" min={0} defaultValue={edit?.rewardAmount ?? 0} className="rd-input" />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Usage limit" htmlFor="rc-uses" hint="Blank = unlimited">
          <input id="rc-uses" name="maxUses" type="number" min={1} defaultValue={edit?.maxUses ?? ''} className="rd-input" />
        </Field>
        <Field label="Expires on" htmlFor="rc-exp" hint="Blank = never">
          <input id="rc-exp" name="expiresAt" type="date" defaultValue={edit?.expiresAt} className="rd-input" />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-[14px] font-medium text-ink">
        <input type="checkbox" name="active" defaultChecked={edit ? edit.active : true} className="size-4 accent-[var(--brand)]" />
        Active
      </label>
      {state && !state.ok && <p className="rounded-lg bg-brand-soft px-3 py-2 text-[13px] font-medium text-brand">{state.message}</p>}
      <SubmitButton>{edit ? 'Save code' : 'Create code'}</SubmitButton>
    </form>
  );
}

export default function ReferralManager({ rows }: { rows: CodeRow[] }) {
  const [editing, setEditing] = useState<CodeRow | null | 'new'>(null);
  const [toast, setToast] = useState<string | null>(null);
  const totalOwed = rows.reduce((a, r) => a + r.rewardsOwed, 0);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      {toast && <Toast message={toast} />}
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rd-card p-4">
            <p className="text-[12px] text-muted-foreground">Active codes</p>
            <p className="font-heading text-[24px] font-semibold text-ink">{rows.filter((r) => r.active).length}</p>
          </div>
          <div className="rd-card p-4">
            <p className="text-[12px] text-muted-foreground">Leads from codes</p>
            <p className="font-heading text-[24px] font-semibold text-ink">{rows.reduce((a, r) => a + r.leadCount, 0)}</p>
          </div>
          <div className="rd-card p-4">
            <p className="text-[12px] text-muted-foreground">Rewards owed to referrers</p>
            <p className="font-heading text-[24px] font-semibold text-ink">{formatRupees(totalOwed)}</p>
          </div>
        </div>

        <div className="rd-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-[16px] font-semibold text-ink">All codes</h2>
            <button type="button" onClick={() => setEditing('new')} className={btn.primary}>
              <Plus className="size-4" /> New code
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[14px]">
              <thead className="bg-page/70 text-[12px] font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Referrer</th>
                  <th className="p-3">Usage</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const expired = r.expiresAt && r.expiresAt < today;
                  const exhausted = r.maxUses != null && r.usedCount >= r.maxUses;
                  return (
                    <tr key={r.id} className="hover:bg-page/50">
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={async () => {
                            await navigator.clipboard.writeText(r.code);
                            setToast(`Copied ${r.code}`);
                          }}
                          className="flex items-center gap-1.5 font-mono font-semibold text-ink hover:text-brand"
                          title="Copy"
                        >
                          {r.code}
                          <Copy className="size-3.5 opacity-50" />
                        </button>
                        {r.description && <span className="block text-[12px] text-muted-foreground">{r.description}</span>}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {r.discountType === 'percent' ? `${r.discountValue}%` : formatRupees(r.discountValue)}
                        {r.maxDiscount ? <span className="block text-[12px] text-muted-foreground">max {formatRupees(r.maxDiscount)}</span> : null}
                      </td>
                      <td className="p-3">
                        {r.referrerName || <span className="text-muted-foreground">—</span>}
                        {r.rewardAmount > 0 && <span className="block text-[12px] text-muted-foreground">{formatRupees(r.rewardAmount)} / sale</span>}
                      </td>
                      <td className="p-3 text-[13px] whitespace-nowrap">
                        <span className="font-semibold text-ink">
                          {r.usedCount}
                          {r.maxUses != null && ` / ${r.maxUses}`}
                        </span>{' '}
                        used
                        <span className="block text-muted-foreground">
                          {r.wonCount} won{r.rewardsOwed > 0 && ` · ${formatRupees(r.rewardsOwed)} owed`}
                        </span>
                      </td>
                      <td className="p-3">
                        {!r.active ? (
                          <Badge className="border-zinc-200 bg-zinc-100 text-zinc-600">Paused</Badge>
                        ) : expired ? (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-800">Expired</Badge>
                        ) : exhausted ? (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-800">Limit reached</Badge>
                        ) : (
                          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Active</Badge>
                        )}
                        {r.expiresAt && <span className="mt-0.5 block text-[11px] text-muted-foreground">till {r.expiresAt}</span>}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-0.5">
                          <ActionButton action={() => toggleReferral(r.id, !r.active)}>{r.active ? 'Pause' : 'Resume'}</ActionButton>
                          <button type="button" onClick={() => setEditing(r)} className={btn.ghost} title="Edit">
                            <Pencil className="size-3.5" />
                          </button>
                          <ActionButton action={() => deleteReferral(r.id)} confirm={`Delete code ${r.code}? Past leads keep the code text.`} className={btn.danger} title="Delete">
                            <Trash2 className="size-3.5" />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rows.length && <p className="p-10 text-center text-[14px] text-muted-foreground">No codes yet. Create one for a happy customer to share.</p>}
          </div>
        </div>
      </div>

      <div className="xl:sticky xl:top-6 xl:self-start">
        {editing ? (
          <CodeForm
            key={editing === 'new' ? 'new' : editing.id}
            edit={editing === 'new' ? null : editing}
            onDone={(saved) => {
              if (saved) setToast(editing === 'new' ? 'Code created' : 'Code saved');
              setEditing(null);
            }}
          />
        ) : (
          <div className="rd-card p-5 text-[14px] text-muted-foreground">
            <h2 className="mb-2 text-[16px] font-semibold text-ink">How referral codes work</h2>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Create a code for a happy customer (the referrer) and set the reward you’ll pay them.</li>
              <li>They share it with friends, who enter it on a test-drive, sell, exchange or contact form.</li>
              <li>The lead arrives tagged with the code and the discount they’re entitled to.</li>
              <li>When the deal is won, pay the referrer and tick “Referrer reward paid” on the lead.</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
