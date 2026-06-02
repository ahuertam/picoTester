// Reproduce el flujo del usuario CON localStorage pre-poblado
// con config.questionCount = 0 (el caso que rompe el flujo).

import puppeteer from 'puppeteer'
import { writeFileSync } from 'node:fs'

const URL = 'https://ahuertam.github.io/picoTester/'

const SAMPLE_MD = `# Test
## ¿Cuál es la capital de Francia?
- [ ] Madrid
- [x] París
- [ ] Roma
- [ ] Berlín

## ¿Cuántos lados tiene un hexágono?
- [ ] 4
- [ ] 5
- [x] 6
- [ ] 7

## ¿Qué significa CSS?
- [x] Cascading Style Sheets
- [ ] Computer Style System
- [ ] Creative Styling Source
- [ ] Cascading Sheet Syntax
`

const browser = await puppeteer.launch({ headless: 'new' })
const page = await browser.newPage()

const logs = []
page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`))
page.on('pageerror', (err) => logs.push(`[pageerror] ${err.message}`))

await page.goto(URL, { waitUntil: 'networkidle0' })

// Inyectar un localStorage "envenenado" con questionCount = 0
await page.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('picotester:config', JSON.stringify({
    timePerExam: 0,
    questionCount: 0,           // <-- el caso del bug
    randomOrder: false,
    showResultImmediately: true,
    navigationMode: 'free',
  }))
})
await page.reload({ waitUntil: 'networkidle0' })

console.log('LocalStorage con config.questionCount = 0. Subiendo archivo...')
const fileInput = await page.$('input[type=file]')
const tmpFile = '/tmp/test-questions.md'
writeFileSync(tmpFile, SAMPLE_MD)
await fileInput.uploadFile(tmpFile)

await page.waitForSelector('button:not([disabled])', { timeout: 5000 })
await new Promise((r) => setTimeout(r, 500))

await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')]
  buttons.find((b) => b.textContent.trim() === 'Continuar')?.click()
})
await new Promise((r) => setTimeout(r, 500))

console.log('Click en Empezar examen...')
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')]
  const start = buttons.find((b) => b.textContent.trim() === 'Empezar examen')
  console.log('Empezar examen disabled:', start?.disabled)
  if (start && !start.disabled) start.click()
})
await new Promise((r) => setTimeout(r, 1000))

const state = await page.evaluate(() => {
  const h2 = document.querySelector('h2')
  return {
    title: h2?.textContent,
    hasError: document.body.innerText.includes('No hay sesión'),
  }
})

console.log('\n=== Resultado ===')
console.log('title:', state.title)
console.log('tiene error "No hay sesión":', state.hasError)

if (state.hasError) {
  console.log('\n❌ BUG REPRODUCIDO')
} else {
  console.log('\n✅ Bug NO se reproduce con este escenario')
}

await browser.close()
