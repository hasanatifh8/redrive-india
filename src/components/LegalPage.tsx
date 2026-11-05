import { DemoNotice, PageHero } from './ui';

export default function LegalPage({ title, sections }: { title: string; sections: { heading: string; body: string }[] }) {
  return (
    <>
      <PageHero eyebrow="Legal" title={title} />
      <div className="rd-container max-w-3xl py-14">
        <DemoNotice>Draft text for the design demo. REDRIVE INDIA should review and replace this before going live.</DemoNotice>
        <div className="rd-card flex flex-col gap-6 p-6 md:p-8">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-[18px] font-semibold text-ink">{s.heading}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
