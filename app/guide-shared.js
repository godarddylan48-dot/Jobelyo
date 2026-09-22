import Link from 'next/link';

export function GuideShell({ title, intro, children }) {
  return <main className="legalPage"><div className="legalShell"><Link className="legalBack" href="/">← Retour à Jobelyo</Link><article className="legalCard guideCard"><div className="brand">Job<span>elyo</span></div><p className="eyebrow">Conseils emploi</p><h1>{title}</h1><p className="guideIntro">{intro}</p>{children}<hr/><p><Link href="/conseils-emploi">Voir tous les conseils emploi →</Link></p></article></div></main>;
}
