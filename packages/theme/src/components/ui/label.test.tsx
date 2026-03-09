import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Label } from './label'

// @vitest-environment jsdom

describe('Label', () => {
  it('renders a label element', () => {
    render(<Label>Username</Label>)
    const label = screen.getByText('Username')
    expect(label.dataset.slot).toBe('label')
  })

  it('associates with input via htmlFor', () => {
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>
    )
    const label = screen.getByText('Email')
    expect(label.getAttribute('for')).toBe('email')
  })

  it('applies custom className', () => {
    render(<Label className="custom">Name</Label>)
    const label = screen.getByText('Name')
    expect(label.className).toContain('custom')
  })
})
