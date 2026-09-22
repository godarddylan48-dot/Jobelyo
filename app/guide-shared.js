export function GuideShell({ title, intro, children }) {
  return <main className="legalPage"><div className="legalShell"><a className="legalBack" href="/">← Retour à Jobelyo</a><article className="legalCard guideCard"><div className="brand">Job<span>elyo</span></div><p className="eyebrow">Conseils emploi</p><h1>{title}</h1><p className="guideIntro">{intro}</p>{children}<hr/><p><a href="/conseils-emploi">Voir tous les conseils emploi →</a></p></article></div></main>;
}
