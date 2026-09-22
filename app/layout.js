import './styles.css';
import { Analytics } from '@vercel/analytics/next';
import Script from 'next/script';

export const metadata = {
  metadataBase: new URL('https://www.jobelyo.fr'),
  title: {
    default: 'Jobelyo — Offres d’emploi partout en France',
    template: '%s | Jobelyo'
  },
  description: 'Trouvez rapidement des offres d’emploi près de chez vous avec Jobelyo. Recherchez par métier, ville et rayon parmi des milliers d’offres en France.',
  applicationName: 'Jobelyo',
  keywords: [
    'emploi',
    'offres d’emploi',
    'recherche emploi',
    'travail',
    'recrutement',
    'emploi France',
    'France Travail',
    'Jooble'
  ],
  authors: [{ name: 'Jobelyo' }],
  creator: 'Jobelyo',
  publisher: 'Jobelyo',
  alternates: {
    canonical: '/'
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://www.jobelyo.fr',
    siteName: 'Jobelyo',
    title: 'Jobelyo — Offres d’emploi partout en France',
    description: 'Recherchez gratuitement des offres d’emploi par métier, ville et rayon partout en France.'
  },
  twitter: {
    card: 'summary',
    title: 'Jobelyo — Offres d’emploi partout en France',
    description: 'Recherchez gratuitement des offres d’emploi près de chez vous.'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  }
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Jobelyo',
  url: 'https://www.jobelyo.fr/',
  inLanguage: 'fr-FR',
  description: 'Moteur de recherche d’offres d’emploi en France.',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.jobelyo.fr/?q={search_term_string}',
    'query-input': 'required name=search_term_string'
  }
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Jobelyo',
  url: 'https://www.jobelyo.fr/'
};

export default function RootLayout({ children }) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  return (
    <html lang="fr">
      <body>
        {adsenseClient ? (
          <Script
            id="jobelyo-adsense"
            strategy="afterInteractive"
            async
            crossOrigin="anonymous"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
          />
        ) : null}
        {children}
        <Analytics />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
