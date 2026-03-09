import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button, buttonVariants } from './button'

// @vitest-environment jsdom

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeDefined()
    expect(button.dataset.slot).toBe('button')
    expect(button.dataset.variant).toBe('default')
    expect(button.dataset.size).toBe('default')
  })

  it('renders with custom variant', () => {
    render(<Button variant="outline">Outline</Button>)
    const button = screen.getByRole('button', { name: 'Outline' })
    expect(button.dataset.variant).toBe('outline')
  })

  it('renders with custom size', () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByRole('button', { name: 'Large' })
    expect(button.dataset.size).toBe('lg')
  })

  it('passes through HTML attributes', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByRole('button', { name: 'Disabled' })
    expect(button).toBeInstanceOf(HTMLButtonElement)
    expect((button as HTMLButtonElement).disabled).toBe(true)
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Styled</Button>)
    const button = screen.getByRole('button', { name: 'Styled' })
    expect(button.className).toContain('custom-class')
  })

  it('renders as child element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>
    )
    const link = screen.getByRole('link', { name: 'Link' })
    expect(link).toBeDefined()
    expect(link.tagName).toBe('A')
  })
})

describe('buttonVariants', () => {
  it('returns a string of class names', () => {
    const result = buttonVariants({ variant: 'default', size: 'default' })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('includes variant-specific classes', () => {
    const ghost = buttonVariants({ variant: 'ghost' })
    expect(ghost).toContain('hover:bg-muted')
  })
})
