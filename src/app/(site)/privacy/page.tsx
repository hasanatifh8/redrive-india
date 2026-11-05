import type { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      sections={[
        { heading: 'What we collect', body: 'When you send an enquiry we receive the details you enter — such as your name, phone number and car details — through this website, WhatsApp or a phone call. Enquiries sent through the website are stored securely so our team can call you back.' },
        { heading: 'How we use it', body: 'We use your details only to respond to your enquiry about buying, selling or exchanging a car.' },
        { heading: 'Saved on your device', body: 'Your wishlist is stored in your own browser and is not sent to us.' },
        { heading: 'Contact', body: 'For any privacy question, call 99188 16493 or visit us at 120 Feet Road, Kalindipuram, Prayagraj.' },
      ]}
    />
  );
}
