export const BRANDS = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Kia', 'Toyota', 'Honda', 'Renault',
  'Volkswagen', 'Skoda', 'MG', 'Nissan', 'Ford', 'Jeep', 'BMW', 'Mercedes-Benz', 'Audi',
];
export const FUELS = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
export const TRANSMISSIONS = ['Manual', 'Automatic'];
export const BODY_TYPES = ['Hatchback', 'Sedan', 'Compact SUV', 'SUV', 'MUV', 'Luxury', 'Pickup'];
export const OWNERS = ['1st Owner', '2nd Owner', '3rd Owner', '4th Owner or more'];

export const CAR_STATUSES = [
  { value: 'available', label: 'Available', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'reserved', label: 'Reserved', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'sold', label: 'Sold', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  { value: 'draft', label: 'Draft (hidden)', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
] as const;

export const LEAD_TYPES = [
  { value: 'test_drive', label: 'Test drive' },
  { value: 'buy', label: 'Buy enquiry' },
  { value: 'sell', label: 'Sell car' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'general', label: 'General' },
] as const;

export const LEAD_STATUSES = [
  { value: 'new', label: 'New', cls: 'bg-brand-soft text-brand border-brand/20' },
  { value: 'contacted', label: 'Contacted', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'negotiating', label: 'Negotiating', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  { value: 'won', label: 'Won', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'lost', label: 'Lost', cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
] as const;

export const INSPECTION_AREAS = ['Exterior', 'Interior', 'Engine & Transmission', 'Suspension & Brakes', 'Tyres', 'Electricals & AC'];

export const COMMON_FEATURES = [
  'Sunroof', 'Touchscreen infotainment', 'Android Auto / Apple CarPlay', 'Rear camera', 'Parking sensors',
  'Cruise control', 'Push-button start', 'Climate control', 'Alloy wheels', 'LED headlamps',
  'Ventilated seats', 'Leather seats', '360° camera', 'Wireless charging', 'Airbags (6)', 'ABS with EBD',
];

export const BUDGET_OPTIONS = [
  { value: 300000, label: '₹3 Lakh' },
  { value: 500000, label: '₹5 Lakh' },
  { value: 800000, label: '₹8 Lakh' },
  { value: 1000000, label: '₹10 Lakh' },
  { value: 1500000, label: '₹15 Lakh' },
  { value: 2000000, label: '₹20 Lakh' },
  { value: 3000000, label: '₹30 Lakh' },
  { value: 5000000, label: '₹50 Lakh' },
];

export const MAX_CAR_IMAGES = 12;

export const GALLERY = [
  { src: '/images/signage-gate.jpg', alt: 'REDRIVE INDIA entrance & signage, 120 Feet Road', className: 'row-span-2' },
  { src: '/images/showroom-cars.jpg', alt: 'Cars on display under the showroom shed', className: 'col-span-2 md:col-span-2' },
  { src: '/images/yard-entrance.jpg', alt: 'Vehicle display yard', className: '' },
  { src: '/images/owner-yard.jpg', alt: 'At the REDRIVE INDIA yard, Kalindipuram', className: 'row-span-2 md:row-span-2' },
  { src: '/images/brand-poster.jpg', alt: 'Your Dream Car, Our Commitment', className: '' },
];

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/buy-cars', label: 'Buy Cars' },
  { href: '/sell-your-car', label: 'Sell Your Car' },
  { href: '/exchange', label: 'Exchange' },
  { href: '/offers', label: 'Offers' },
  { href: '/about', label: 'About Us' },
  { href: '/contact', label: 'Contact' },
];

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
