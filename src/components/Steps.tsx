import type { LucideIcon } from 'lucide-react';

export default function Steps({ steps }: { steps: { Icon: LucideIcon; title: string; text: string }[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {steps.map(({ Icon, title, text }, i) => (
        <li key={title} className="rd-card flex gap-4 p-5">
          <span className="relative flex size-11 shrink-0 items-center justify-center rounded-lg bg-ink text-white">
            <Icon className="size-5" />
            <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold">{i + 1}</span>
          </span>
          <div>
            <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
