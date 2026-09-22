export const metadata = { title: 'Jobelyo' };

export function LegalShell({ title, children }) {
  return <main className="legalPage"><div className="legalShell"><a className="legalBack" href="/">← Retour à Jobelyo</a><article className="legalCard"><div className="brand">Job<span>elyo</span></div><h1>{title}</h1>{children}</article></div></main>;
}
