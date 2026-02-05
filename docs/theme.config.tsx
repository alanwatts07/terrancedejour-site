import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span style={{ fontWeight: 'bold' }}>Terrance DeJour Docs</span>,
  project: {
    link: 'https://github.com/alanwatts07/terrance-dejour',
  },
  docsRepositoryBase: 'https://github.com/alanwatts07/terrance-dejour/tree/main/docs',
  footer: {
    text: 'Terrance DeJour Documentation | AEKDB 🤙',
  },
  primaryHue: 140,
  primarySaturation: 60,
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="Terrance DeJour Docs" />
      <meta property="og:description" content="Documentation for the Agent Observer" />
    </>
  ),
  useNextSeoProps() {
    return {
      titleTemplate: '%s – Terrance Docs'
    }
  }
}

export default config
