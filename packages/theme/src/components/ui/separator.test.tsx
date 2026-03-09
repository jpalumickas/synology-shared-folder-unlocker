import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Separator } from './separator'

// @vitest-environment jsdom

function getSep(container: HTMLElement) {
  const el = container.firstElementChild
  if (!el) throw new Error('No element rendered')
  return el
}

describe('Separator', () => {
  it('renders with correct data-slot', () => {
    const { container } = render(<Separator />)
    const sep = getSep(container)
    expect(sep.dataset.slot).toBe('separator')
  })

  it('renders as horizontal by default', () => {
    const { container } = render(<Separator />)
    const sep = getSep(container)
    expect(sep.getAttribute('data-orientation')).toBe('horizontal')
  })

  it('renders as vertical when specified', () => {
    const { container } = render(<Separator orientation="vertical" />)
    const sep = getSep(container)
    expect(sep.getAttribute('data-orientation')).toBe('vertical')
  })

  it('is decorative by default', () => {
    const { container } = render(<Separator />)
    const sep = getSep(container)
    expect(sep.getAttribute('role')).toBe('none')
  })

  it('has separator role when not decorative', () => {
    const { container } = render(<Separator decorative={false} />)
    const sep = getSep(container)
    expect(sep.getAttribute('role')).toBe('separator')
  })

  it('applies custom className', () => {
    const { container } = render(<Separator className="custom" />)
    const sep = getSep(container)
    expect(sep.className).toContain('custom')
  })
})
