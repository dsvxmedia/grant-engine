import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Resend } from 'resend'
import { sendScraperAlert } from '@/lib/scrapers/health'

vi.mock('server-only', () => ({}))
vi.mock('resend', () => ({
  Resend: vi.fn(),
}))

vi.mock('@/lib/env', () => ({
  env: {
    RESEND_API_KEY: 'test-api-key',
    RESEND_FROM_EMAIL: 'alerts@test.com',
    RESEND_ALERT_EMAIL: 'admin@test.com',
  },
}))

let sendMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  sendMock = vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
  vi.mocked(Resend).mockReset()
  vi.mocked(Resend).mockImplementation(
    function (this: any) {
      this.emails = { send: sendMock }
    } as any
  )
})

describe('sendScraperAlert', () => {
  it('does nothing when failures array is empty', async () => {
    await sendScraperAlert([])
    expect(Resend).not.toHaveBeenCalled()
  })

  it('sends email with correct recipient and subject for one failure', async () => {
    await sendScraperAlert([{ source: 'grants-gov', error: 'timeout' }])

    expect(Resend).toHaveBeenCalledWith('test-api-key')
    expect(sendMock).toHaveBeenCalledTimes(1)
    const payload = sendMock.mock.calls[0][0]
    expect(payload.from).toBe('alerts@test.com')
    expect(payload.to).toEqual(['admin@test.com'])
    expect(payload.subject).toContain('1 source(s) failed')
    expect(payload.html).toContain('grants-gov')
    expect(payload.html).toContain('timeout')
  })

  it('sends email listing all failures for multiple failures', async () => {
    await sendScraperAlert([
      { source: 'grants-gov', error: 'timeout' },
      { source: 'sam-gov', error: 'rate limited' },
    ])

    expect(sendMock).toHaveBeenCalledTimes(1)
    const payload = sendMock.mock.calls[0][0]
    expect(payload.subject).toContain('2 source(s) failed')
    expect(payload.html).toContain('grants-gov')
    expect(payload.html).toContain('sam-gov')
    expect(payload.html).toContain('timeout')
    expect(payload.html).toContain('rate limited')
  })

  it('does not throw when Resend.send rejects', async () => {
    sendMock.mockRejectedValueOnce(new Error('Resend down'))

    await expect(
      sendScraperAlert([{ source: 'sbir', error: 'network error' }])
    ).resolves.toBeUndefined()
  })
})
