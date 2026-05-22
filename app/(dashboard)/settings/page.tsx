import { Header } from '@/components/layout/Header'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

const VERSION = 'V1.0.0'

function SectionNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
      {children}
    </p>
  )
}

function CheckboxField({
  id,
  label,
  defaultChecked,
}: {
  id: string
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2.5 text-sm select-none"
    >
      <input
        id={id}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="rounded border-input h-4 w-4"
      />
      {label}
    </label>
  )
}

function StatusPill({
  label,
  active,
}: {
  label: string
  active: boolean
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        active
          ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      {label}
      {active && (
        <span className="ml-1.5 size-1.5 rounded-full bg-green-500" />
      )}
    </span>
  )
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl">
          <SectionNote>
            Settings sync is coming in V2. Values on this page are for preview only and are not yet persisted.
          </SectionNote>

          <div className="mt-6">
            <Tabs defaultValue="notifications">
              <TabsList>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="scoring">Scoring</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>

              {/* Notifications tab */}
              <TabsContent value="notifications">
                <div className="mt-5 flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email-input">Email address</Label>
                    <Input
                      id="email-input"
                      type="email"
                      defaultValue="you@example.com"
                      className="max-w-sm"
                      placeholder="your@email.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Digest and alerts will be sent here.
                    </p>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm font-medium">Notify me when…</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      Choose which events trigger an email or in-app notification.
                    </p>
                    <div className="flex flex-col gap-3">
                      <CheckboxField
                        id="notif-new-matches"
                        label="New grant matches are found"
                        defaultChecked
                      />
                      <CheckboxField
                        id="notif-deadline-reminders"
                        label="Deadline reminders (7 days and 48 hours before)"
                        defaultChecked
                      />
                      <CheckboxField
                        id="notif-scraper-alerts"
                        label="Scraper failure alerts"
                        defaultChecked
                      />
                      <CheckboxField
                        id="notif-qa-failures"
                        label="QA gate failures"
                        defaultChecked
                      />
                      <CheckboxField
                        id="notif-application-ready"
                        label="Applications ready for review"
                        defaultChecked
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Scoring tab */}
              <TabsContent value="scoring">
                <div className="mt-5 flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="score-threshold">Auto-draft threshold</Label>
                      <span className="text-sm font-semibold tabular-nums">70</span>
                    </div>
                    <input
                      id="score-threshold"
                      type="range"
                      min={0}
                      max={100}
                      defaultValue={70}
                      step={5}
                      className="w-full max-w-sm accent-primary"
                    />
                    <p className="text-xs text-muted-foreground max-w-sm">
                      Grants with a fit score at or above this threshold are automatically
                      queued for drafting. Grants scoring 50–69 are added to the manual
                      review list. Below 50 are deprioritized.
                    </p>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Score components</p>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                              Component
                            </th>
                            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                              Weight
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {[
                            { label: 'Mission alignment (pgvector)', weight: '35%' },
                            { label: 'Angle match strength', weight: '25%' },
                            { label: 'Award size fit', weight: '15%' },
                            { label: 'Deadline urgency', weight: '10%' },
                            { label: 'Funder prestige', weight: '10%' },
                            { label: 'Win/Loss Engine (V2)', weight: '10%' },
                          ].map(({ label, weight }) => (
                            <tr key={label}>
                              <td className="px-4 py-2.5 text-foreground">{label}</td>
                              <td className="px-4 py-2.5 text-right text-muted-foreground tabular-nums">
                                {weight}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* About tab */}
              <TabsContent value="about">
                <div className="mt-5 flex flex-col gap-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Version</span>
                      <span className="font-medium">{VERSION}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">AI writing model</span>
                      <span className="font-medium font-mono text-xs">claude-sonnet-4-6</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">AI classification model</span>
                      <span className="font-medium font-mono text-xs">claude-haiku-4-5</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">QA gate model</span>
                      <span className="font-medium font-mono text-xs">claude-opus-4-7</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium">Release plan</p>
                    <div className="flex gap-2 flex-wrap">
                      <StatusPill label="V1 — Discovery & Writing" active />
                      <StatusPill label="V2 — Intelligence Layer" active={false} />
                      <StatusPill label="V3 — Video Pipeline" active={false} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      V1 covers discovery, matching, LOI pipeline, 5-pass writing agent,
                      QA gate, budget builder, and review dashboard.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
