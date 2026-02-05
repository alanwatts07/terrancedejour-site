import type { MDXComponents } from 'mdx/types'
import defaultComponents from 'nextra-theme-docs/mdx-components'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
  }
}
