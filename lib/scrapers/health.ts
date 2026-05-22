import { Resend } from 'resend'
import { env } from '@/lib/env'

export type ScraperFailure = { source: string; error: string }

function buildHtml(failures: ScraperFailure[]): string {
  const items = failures
    .map((f) => `<li><strong>${f.source}</strong>: ${f.error}</li>`)
    .join('')
  return `<h2>Grant Engine Scraper Alert</h2><p>The daily discovery cron completed with failures:</p><ul>${items}</ul><p>Check Vercel logs for details.</p>`
}

export async function sendScraperAlert(failures: ScraperFailure[]): Promise<void> {
  if (failures.length === 0) return

  try {
    const resend = new Resend(env.RESEND_API_KEY)
    await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: [env.RESEND_ALERT_EMAIL],
      subject: `[Grant Engine] Scraper alert: ${failures.length} source(s) failed`,
      html: buildHtml(failures),
    })
  } catch (err) {
    console.error('[health] failed to send scraper alert', err)
  }
}
