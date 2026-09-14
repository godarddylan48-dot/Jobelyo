export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/']
    },
    sitemap: 'https://www.jobelyo.fr/sitemap.xml',
    host: 'https://www.jobelyo.fr'
  };
}
