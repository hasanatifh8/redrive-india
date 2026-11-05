'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { emi, formatPrice, formatRupees } from '@/lib/pricing';

export default function EmiCalculator({ price, rate: defaultRate, maxTenure }: { price: number; rate: number; maxTenure: number }) {
  const [downPct, setDownPct] = useState(20);
  const [months, setMonths] = useState(Math.min(60, maxTenure));
  const [rate, setRate] = useState(defaultRate);

  const down = Math.round((price * downPct) / 100);
  const loan = price - down;
  const monthly = emi(loan, rate, months);
  const totalInterest = monthly * months - loan;
  const tenures = [12, 24, 36, 48, 60, 72, 84].filter((m) => m <= maxTenure);

  return (
    <div className="rd-card p-5">
      <h2 className="flex items-center gap-2 text-[18px] font-semibold text-ink">
        <Calculator className="size-5 text-brand" />
        EMI calculator
      </h2>
      <div className="mt-4 rounded-xl bg-ink p-4 text-white">
        <p className="text-[12px] text-white/60">Estimated EMI</p>
        <p className="font-heading text-[30px] leading-tight font-semibold">
          {formatRupees(monthly)}
          <span className="text-[14px] font-normal text-white/60"> /month</span>
        </p>
        <p className="mt-1 text-[12px] text-white/60">
          Loan {formatPrice(loan)} · Total interest {formatPrice(Math.max(0, totalInterest))}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div>
          <div className="flex justify-between text-[13px]">
            <label htmlFor="emi-down" className="font-medium text-ink">
              Down payment
            </label>
            <span className="font-semibold text-ink">
              {formatPrice(down)} ({downPct}%)
            </span>
          </div>
          <input id="emi-down" type="range" min={0} max={90} step={5} value={downPct} onChange={(e) => setDownPct(+e.target.value)} className="mt-2 w-full accent-[var(--brand)]" />
        </div>
        <div>
          <p className="text-[13px] font-medium text-ink">Loan tenure</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tenures.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`h-8 rounded-full border px-3 text-[13px] font-medium transition ${m === months ? 'border-brand bg-brand text-white' : 'border-border text-ink hover:border-brand'}`}
              >
                {m / 12} yr
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[13px]">
            <label htmlFor="emi-rate" className="font-medium text-ink">
              Interest rate
            </label>
            <span className="font-semibold text-ink">{rate.toFixed(1)}% p.a.</span>
          </div>
          <input id="emi-rate" type="range" min={7} max={20} step={0.25} value={rate} onChange={(e) => setRate(+e.target.value)} className="mt-2 w-full accent-[var(--brand)]" />
        </div>
      </div>
      <p className="mt-3 text-[12px] text-muted-foreground">Indicative only. Final EMI depends on the lender’s approval and terms.</p>
    </div>
  );
}
