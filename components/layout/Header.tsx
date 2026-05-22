import { UserButton } from '@clerk/nextjs'

export function Header({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-6">
      <h2 className="text-sm font-medium">{title}</h2>
      <UserButton />
    </header>
  )
}
