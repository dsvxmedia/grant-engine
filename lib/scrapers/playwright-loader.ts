export type PlaywrightPage = {
  goto: (url: string, opts?: unknown) => Promise<unknown>
  evaluate: <T>(fn: () => T) => Promise<T>
  close: () => Promise<void>
}

export type PlaywrightBrowser = {
  newPage: () => Promise<PlaywrightPage>
  close: () => Promise<void>
}

type PlaywrightModule = {
  chromium: {
    launch: (opts?: {
      headless?: boolean
      args?: string[]
      executablePath?: string
    }) => Promise<PlaywrightBrowser>
  }
}

export async function loadChromium(): Promise<PlaywrightModule['chromium']> {
  const isVercel = process.env.VERCEL === '1'

  if (isVercel) {
    // On Vercel, use @sparticuz/chromium-min with the bundled binary
    const [chromiumMin, playwrightCore] = await Promise.all([
      import('@sparticuz/chromium-min'),
      import('playwright-core') as Promise<PlaywrightModule>,
    ])

    const executablePath = await (chromiumMin as any).default.executablePath(
      'https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.tar'
    )

    return {
      launch: (opts = {}) =>
        playwrightCore.chromium.launch({
          args: (chromiumMin as any).default.args,
          executablePath,
          headless: true,
          ...opts,
        }),
    }
  }

  // Local: use full Playwright with installed browser
  const playwright = (await import('playwright')) as PlaywrightModule
  return playwright.chromium
}
