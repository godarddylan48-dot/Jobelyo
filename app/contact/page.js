import { LegalShell } from '../legal-shared';
export const metadata={title:'Contact',description:'Contacter Jobelyo.',alternates:{canonical:'/contact'}};
export default function Page(){return <LegalShell title="Contact">
<p>Une question sur Jobelyo, votre compte, une alerte ou une offre affichée ? Vous pouvez contacter l’éditeur directement.</p>
<div className="contactBox"><strong>E-mail</strong><a href="mailto:contact@jobelyo.fr?subject=Contact%20Jobelyo">contact@jobelyo.fr</a></div>
<p>Pour une candidature, utilisez le bouton de candidature présent sur la fiche concernée : Jobelyo ne recrute pas à la place des entreprises qui publient les offres.</p>
</LegalShell>}
