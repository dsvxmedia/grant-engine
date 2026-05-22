import { Header } from '@/components/layout/Header'

export default function PipelinePage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Pipeline" />
      <div className="flex-1 p-6">
        <p className="text-sm text-muted-foreground">Grant pipeline — built in Plan 8.</p>
      </div>
    </div>
  )
}
