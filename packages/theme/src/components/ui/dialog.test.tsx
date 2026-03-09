import { type ComponentProps } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogClose,
} from './dialog'

// @vitest-environment jsdom

function TestDialog({
  children,
  ...contentProps
}: ComponentProps<typeof DialogContent>) {
  return (
    <Dialog>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent {...contentProps}>
        <DialogTitle>Test Dialog</DialogTitle>
        <DialogDescription>Test description</DialogDescription>
        {children}
      </DialogContent>
    </Dialog>
  )
}

describe('Dialog', () => {
  it('renders trigger and opens content on click', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Description</DialogDescription>
          </DialogHeader>
          <p>Body</p>
          <DialogFooter>Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    )

    expect(screen.queryByText('Title')).toBeNull()
    await user.click(screen.getByText('Open'))

    expect(screen.getByText('Title')).toBeDefined()
    expect(screen.getByText('Description')).toBeDefined()
    expect(screen.getByText('Body')).toBeDefined()
    expect(screen.getByText('Footer')).toBeDefined()
  })

  it('renders with correct data-slot attributes', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
            <DialogDescription>Desc</DialogDescription>
          </DialogHeader>
          <DialogFooter>Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))

    expect(screen.getByText('Open').dataset.slot).toBe('dialog-trigger')
    expect(
      document.querySelector('[data-slot="dialog-content"]')
    ).not.toBeNull()
    expect(screen.getByText('Title').dataset.slot).toBe('dialog-title')
    expect(screen.getByText('Desc').dataset.slot).toBe('dialog-description')
    expect(document.querySelector('[data-slot="dialog-header"]')).not.toBeNull()
    expect(document.querySelector('[data-slot="dialog-footer"]')).not.toBeNull()
  })

  it('shows close button by default', async () => {
    const user = userEvent.setup()
    render(<TestDialog>Content</TestDialog>)

    await user.click(screen.getByText('Open'))
    expect(screen.getByText('Close')).toBeDefined()
  })

  it('hides close button when showCloseButton is false', async () => {
    const user = userEvent.setup()
    render(<TestDialog showCloseButton={false}>Content</TestDialog>)

    await user.click(screen.getByText('Open'))
    expect(screen.queryByText('Close')).toBeNull()
  })

  it('renders DialogFooter with close button', async () => {
    const user = userEvent.setup()
    render(
      <TestDialog showCloseButton={false}>
        <DialogFooter showCloseButton>
          <button>Save</button>
        </DialogFooter>
      </TestDialog>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByText('Save')).toBeDefined()
    expect(screen.getByText('Close')).toBeDefined()
  })

  it('renders DialogOverlay with correct data-slot', async () => {
    const user = userEvent.setup()
    render(<TestDialog>Content</TestDialog>)

    await user.click(screen.getByText('Open'))
    expect(
      document.querySelector('[data-slot="dialog-overlay"]')
    ).not.toBeNull()
  })

  it('applies custom className to DialogContent', async () => {
    const user = userEvent.setup()
    render(<TestDialog className="custom-dialog">Content</TestDialog>)

    await user.click(screen.getByText('Open'))
    const content = document.querySelector('[data-slot="dialog-content"]')
    expect(content?.className).toContain('custom-dialog')
  })

  it('applies custom className to sub-components', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader className="custom-header">
            <DialogTitle className="custom-title">Title</DialogTitle>
            <DialogDescription className="custom-desc">Desc</DialogDescription>
          </DialogHeader>
          <DialogFooter className="custom-footer">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))
    expect(
      document.querySelector('[data-slot="dialog-header"]')?.className
    ).toContain('custom-header')
    expect(screen.getByText('Title').className).toContain('custom-title')
    expect(screen.getByText('Desc').className).toContain('custom-desc')
    expect(
      document.querySelector('[data-slot="dialog-footer"]')?.className
    ).toContain('custom-footer')
  })

  it('applies custom className to DialogOverlay', async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogPortal>
          <DialogOverlay className="custom-overlay" />
        </DialogPortal>
      </Dialog>
    )

    await user.click(screen.getByText('Open'))
    expect(
      document.querySelector('[data-slot="dialog-overlay"]')?.className
    ).toContain('custom-overlay')
  })

  it('renders DialogClose with correct data-slot', async () => {
    const user = userEvent.setup()
    render(
      <TestDialog showCloseButton={false}>
        <DialogClose>Dismiss</DialogClose>
      </TestDialog>
    )

    await user.click(screen.getByText('Open'))
    expect(screen.getByText('Dismiss').dataset.slot).toBe('dialog-close')
  })
})
