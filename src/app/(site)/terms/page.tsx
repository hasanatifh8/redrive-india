import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Terms of Use' };

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      sections={[
        { heading: 'Listings', body: 'Car details, photos and prices on this website are for information only and may change. Please confirm availability and price with the dealership.' },
        { heading: 'Inspection', body: 'Customers are encouraged to inspect any car and its documents in person before purchase.' },
        { heading: 'Contact', body: 'Questions about these terms? Call 99188 16493.' },
      ]}
    />
  );
}
