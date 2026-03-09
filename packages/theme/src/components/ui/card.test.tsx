import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from './card'

// @vitest-environment jsdom

describe('Card', () => {
  it('renders with correct data-slot and default size', () => {
    render(<Card>Content</Card>)
    const card = screen.getByText('Content')
    expect(card.dataset.slot).toBe('card')
    expect(card.dataset.size).toBe('default')
  })

  it('renders with sm size', () => {
    render(<Card size="sm">Small</Card>)
    const card = screen.getByText('Small')
    expect(card.dataset.size).toBe('sm')
  })

  it('applies custom className', () => {
    render(<Card className="custom">Content</Card>)
    const card = screen.getByText('Content')
    expect(card.className).toContain('custom')
  })
})

describe('Card sub-components', () => {
  it('CardHeader has correct data-slot', () => {
    render(<CardHeader>Header</CardHeader>)
    expect(screen.getByText('Header').dataset.slot).toBe('card-header')
  })

  it('CardTitle has correct data-slot', () => {
    render(<CardTitle>Title</CardTitle>)
    expect(screen.getByText('Title').dataset.slot).toBe('card-title')
  })

  it('CardDescription has correct data-slot', () => {
    render(<CardDescription>Desc</CardDescription>)
    expect(screen.getByText('Desc').dataset.slot).toBe('card-description')
  })

  it('CardAction has correct data-slot', () => {
    render(<CardAction>Action</CardAction>)
    expect(screen.getByText('Action').dataset.slot).toBe('card-action')
  })

  it('CardContent has correct data-slot', () => {
    render(<CardContent>Body</CardContent>)
    expect(screen.getByText('Body').dataset.slot).toBe('card-content')
  })

  it('CardFooter has correct data-slot', () => {
    render(<CardFooter>Footer</CardFooter>)
    expect(screen.getByText('Footer').dataset.slot).toBe('card-footer')
  })
})
