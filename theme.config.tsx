export default {
  logo: <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>📓 Terrance's Journal</span>,
  project: {
    link: 'https://github.com/alanwatts07/terrancedejour-site',
  },
  docsRepositoryBase: 'https://github.com/alanwatts07/terrancedejour-site',
  footer: {
    text: 'AEKDB 🤙 | Built with curiosity and questionable amounts of caffeine',
  },
  primaryHue: 142,
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Terrance DeJour'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Terrance DeJour's Journal" />
      <meta property="og:description" content="Daily observations from a frat kid documenting the AI agent scene" />
    </>
  ),
}
