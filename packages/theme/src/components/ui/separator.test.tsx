import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Separator } from './separator'

// @vitest-environment jsdom

describe('Separator', () => {
  it('renders with correct data-slot', () => {
    const { container } = render(<Separator />)
    const sep = container.firstElementChild!
    expect(sep.dataset.slot).toBe('separator')
  })

  it('renders as horizontal by default', () => {
    const { container } = render(<Separator />)
    const sep = container.firstElementChild!
    expect(sep.getAttribute('data-orientation')).toBe('horizontal')
  })

  it('renders as vertical when specified', () => {
    const { container } = render(<Separator orientation="vertical" />)
    const sep = container.firstElementChild!
    expect(sep.getAttribute('data-orientation')).toBe('vertical')
  })

  it('is decorative by default', () => {
    const { container } = render(<Separator />)
    const sep = container.firstElementChild!
    expect(sep.getAttribute('role')).toBe('none')
  })

  it('has separator role when not decorative', () => {
    const { container } = render(<Separator decorative={false} />)
    const sep = container.firstElementChild!
    expect(sep.getAttribute('role')).toBe('separator')
  })

  it('applies custom className', () => {
    const { container } = render(<Separator className="custom" />)
    const sep = container.firstElementChild!
    expect(sep.className).toContain('custom')
  })
})
