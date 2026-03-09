import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from './input'

// @vitest-environment jsdom

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    expect(input.tagName).toBe('INPUT')
    expect(input.dataset.slot).toBe('input')
  })

  it('passes through type attribute', () => {
    render(<Input type="password" placeholder="Password" />)
    const input = screen.getByPlaceholderText('Password') as HTMLInputElement
    expect(input.type).toBe('password')
  })

  it('applies custom className', () => {
    render(<Input className="custom" placeholder="Styled" />)
    const input = screen.getByPlaceholderText('Styled')
    expect(input.className).toContain('custom')
  })

  it('supports disabled state', () => {
    render(<Input disabled placeholder="Disabled" />)
    const input = screen.getByPlaceholderText('Disabled') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })
})
