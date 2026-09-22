import Link from 'next/link';

export const metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: true }
};

export default function NotFound() {
  return (
    <main className="legalPage">
      <div className="legalShell">
        <article className="legalCard guideCard">
          <div className="brand">Job<span>elyo</span></div>
          <p className="eyebrow">Erreur 404</p>
          <h1>Cette page est introuvable</h1>
          <p>Le lien demandé n’existe plus ou a été déplacé.</p>
          <p>
            <Link href="/">Revenir à l’accueil</Link> ·{' '}
            <Link href="/offres">Voir les offres récentes</Link> ·{' '}
            <Link href="/emploi">Explorer les pages métier × ville</Link>
          </p>
        </article>
      </div>
    </main>
  );
}
