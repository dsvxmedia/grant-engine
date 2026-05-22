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
    launch: (opts?: { headless?: boolean }) => Promise<PlaywrightBrowser>
  }
}

export async function loadChromium(): Promise<PlaywrightModule['chromium']> {
  const mod = 'playwright'
  const playwright = (await import(/* @vite-ignore */ mod)) as PlaywrightModule
  return playwright.chromium
}
