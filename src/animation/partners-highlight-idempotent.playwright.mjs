import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium, devices } from 'playwright'

const BASE_URL =
  process.env.BASE_URL || 'https://cominvi-staging.webflow.io/'

async function serveLocalBuild(page) {
  const serveJavaScript = async (route) => {
    const pathname = new URL(route.request().url()).pathname
    const body = await readFile(resolve('dist', pathname.slice(1)))
    await route.fulfill({
      status: 200,
      contentType: 'text/javascript',
      body,
    })
  }

  await page.route('https://cominvi.netlify.app/main.js', serveJavaScript)
  await page.route(
    'https://cominvi.netlify.app/assets/**/*.js',
    serveJavaScript
  )
}

const browser = await chromium.launch()
const page = await browser.newPage({ ...devices['iPhone 13'] })

try {
  await serveLocalBuild(page)
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(
    () => window.lenis && document.querySelector('.cylindar__text__wrapper')
  )
  await page.waitForTimeout(2300)

  const result = await page.evaluate(async () => {
    const partners = document.querySelector('.section_partners')
    const cylinder = partners.querySelector('.cylindar__wrapper')
    const textWrapper = cylinder.querySelector('.cylindar__text__wrapper')

    window.lenis.scrollTo(9000, { immediate: true })
    let offscreenMutations = 0
    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === 'attributes') offscreenMutations += 1
      })
    })
    observer.observe(partners, { subtree: true, attributes: true })
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500))
    observer.disconnect()

    const readState = () => ({
      activeLabel:
        cylinder
          .querySelector('.cylindar__text__item .is-active')
          ?.textContent?.trim() || '',
      transform: getComputedStyle(textWrapper).transform,
    })
    const partnersTop =
      cylinder.getBoundingClientRect().top + window.lenis.scroll

    window.lenis.scrollTo(partnersTop + 200, { immediate: true })
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150))
    const firstState = readState()

    window.lenis.scrollTo(partnersTop + 1200, { immediate: true })
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150))
    const secondState = readState()

    return {
      offscreenMutations,
      firstState,
      secondState,
    }
  })

  assert.ok(
    result.offscreenMutations < 50,
    `Le highlight Partners doit être stable hors écran (${result.offscreenMutations} mutations)`
  )
  assert.notEqual(
    result.secondState.transform,
    result.firstState.transform,
    'Le cylindre doit toujours tourner'
  )
  assert.ok(result.firstState.activeLabel, 'Un partenaire doit être actif')
  assert.ok(result.secondState.activeLabel, 'Un partenaire doit rester actif')
  assert.notEqual(
    result.secondState.activeLabel,
    result.firstState.activeLabel,
    'Le partenaire actif doit évoluer avec le scroll'
  )
} finally {
  await browser.close()
}

console.log('PASS partners highlight idempotent')
