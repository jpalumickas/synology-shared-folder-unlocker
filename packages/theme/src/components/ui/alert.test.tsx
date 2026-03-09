import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Alert, AlertTitle, AlertDescription, AlertAction } from './alert'

// @vitest-environment jsdom

describe('Alert', () => {
  it('renders with alert role', () => {
    render(<Alert>Content</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toBeDefined()
    expect(alert.dataset.slot).toBe('alert')
  })

  it('renders with destructive variant', () => {
    render(<Alert variant="destructive">Error</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('text-destructive')
  })

  it('applies custom className', () => {
    render(<Alert className="custom">Content</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('custom')
  })
})

describe('AlertTitle', () => {
  it('renders with correct data-slot', () => {
    render(<AlertTitle>Title</AlertTitle>)
    const title = screen.getByText('Title')
    expect(title.dataset.slot).toBe('alert-title')
  })
})

describe('AlertDescription', () => {
  it('renders with correct data-slot', () => {
    render(<AlertDescription>Description</AlertDescription>)
    const desc = screen.getByText('Description')
    expect(desc.dataset.slot).toBe('alert-description')
  })
})

describe('AlertAction', () => {
  it('renders with correct data-slot', () => {
    render(<AlertAction>Action</AlertAction>)
    const action = screen.getByText('Action')
    expect(action.dataset.slot).toBe('alert-action')
  })
})
