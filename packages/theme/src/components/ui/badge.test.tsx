import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, badgeVariants } from './badge'

// @vitest-environment jsdom

describe('Badge', () => {
  it('renders with default variant', () => {
    render(<Badge>Status</Badge>)
    const badge = screen.getByText('Status')
    expect(badge.dataset.slot).toBe('badge')
    expect(badge.dataset.variant).toBe('default')
    expect(badge.tagName).toBe('SPAN')
  })

  it('renders with destructive variant', () => {
    render(<Badge variant="destructive">Error</Badge>)
    const badge = screen.getByText('Error')
    expect(badge.dataset.variant).toBe('destructive')
  })

  it('renders as child element when asChild is true', () => {
    render(
      <Badge asChild>
        <a href="/test">Link Badge</a>
      </Badge>
    )
    const link = screen.getByRole('link', { name: 'Link Badge' })
    expect(link.tagName).toBe('A')
  })

  it('applies custom className', () => {
    render(<Badge className="custom">Tag</Badge>)
    const badge = screen.getByText('Tag')
    expect(badge.className).toContain('custom')
  })
})

describe('badgeVariants', () => {
  it('returns class names for each variant', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline'] as const
    for (const variant of variants) {
      const result = badgeVariants({ variant })
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    }
  })
})
