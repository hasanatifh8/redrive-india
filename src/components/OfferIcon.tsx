import {
  BadgePercent,
  Banknote,
  CalendarHeart,
  CarFront,
  ClipboardCheck,
  FileCheck2,
  Gift,
  PartyPopper,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/** Icons the admin can pick for a showroom offer. */
export const OFFER_ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  gift: { label: 'Gift / freebie', Icon: Gift },
  'test-drive': { label: 'Test drive', Icon: CarFront },
  inspection: { label: 'Car check-up', Icon: ClipboardCheck },
  service: { label: 'Service / repair', Icon: Wrench },
  paperwork: { label: 'RC transfer / paperwork', Icon: FileCheck2 },
  finance: { label: 'Loan / finance', Icon: Banknote },
  exchange: { label: 'Exchange', Icon: Repeat2 },
  warranty: { label: 'Warranty', Icon: ShieldCheck },
  discount: { label: 'Discount', Icon: BadgePercent },
  event: { label: 'Event / mela', Icon: CalendarHeart },
  festive: { label: 'Festive', Icon: PartyPopper },
  detailing: { label: 'Cleaning / detailing', Icon: Sparkles },
};

export default function OfferIcon({ name, className = 'size-6' }: { name: string; className?: string }) {
  const { Icon } = OFFER_ICONS[name] ?? OFFER_ICONS.gift;
  return <Icon className={className} />;
}
