export default function manifest() {
  return {
    name: 'Jobelyo',
    short_name: 'Jobelyo',
    description: 'Recherchez des offres d’emploi partout en France.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f9f6e',
    lang: 'fr-FR',
    scope: '/',
    orientation: 'portrait-primary',
    icons: [
      { src: '/jobelyo-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
    ]
  };
}
