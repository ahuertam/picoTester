// Diagnóstico profundo: capturar el estado exacto en cada paso.

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

await page.evaluate(() => {
  localStorage.clear()
  localStorage.setItem('picotester:config', JSON.stringify({
    timePerExam: 0,
    questionCount: 0,
    randomOrder: false,
    showResultImmediately: true,
    navigationMode: 'free',
  }))
})
await page.reload({ waitUntil: 'networkidle0' })

// Helper para inspeccionar localStorage
const getLS = () => page.evaluate(() => {
  const out = {}
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    try {
      out[k] = JSON.parse(localStorage.getItem(k))
    } catch {
      out[k] = localStorage.getItem(k)
    }
  }
  return out
})

console.log('LS inicial:', JSON.stringify(await getLS(), null, 2))

// Subir
const fileInput = await page.$('input[type=file]')
const tmpFile = '/tmp/test-questions.md'
writeFileSync(tmpFile, SAMPLE_MD)
await fileInput.uploadFile(tmpFile)
await page.waitForSelector('button:not([disabled])', { timeout: 5000 })
await new Promise((r) => setTimeout(r, 800))

console.log('LS tras upload:', JSON.stringify(await getLS(), null, 2))

// Continuar
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')]
  buttons.find((b) => b.textContent.trim() === 'Continuar')?.click()
})
await new Promise((r) => setTimeout(r, 500))

// Estado en config
const configState = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')]
  const empezarBtn = buttons.find((b) => b.textContent.trim() === 'Empezar examen')
  const input = document.getElementById('questionCount')
  return {
    bodyText: document.body.innerText.substring(0, 400),
    empezarDisabled: empezarBtn?.disabled,
    empezarText: empezarBtn?.textContent,
    questionCountValue: input?.value,
  }
})
console.log('\n=== ConfigPanel ===')
console.log('Empezar examen disabled:', configState.empezarDisabled)
console.log('Empezar examen text:', configState.empezarText)
console.log('questionCount input value:', configState.questionCountValue)
console.log('Body text excerpt:', configState.bodyText)

// Empezar examen
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')]
  const start = buttons.find((b) => b.textContent.trim() === 'Empezar examen')
  if (start && !start.disabled) start.click()
})
await new Promise((r) => setTimeout(r, 1500))

// Estado tras click
const finalState = await page.evaluate(() => {
  const h2 = document.querySelector('h2')
  return {
    title: h2?.textContent,
    hasError: document.body.innerText.includes('No hay sesión'),
    bodyText: document.body.innerText.substring(0, 600),
  }
})
console.log('\n=== Estado final ===')
console.log('title:', finalState.title)
console.log('tiene error "No hay sesión":', finalState.hasError)
console.log('Body:', finalState.bodyText)

console.log('\n=== Console logs ===')
logs.forEach((l) => console.log(l))

await browser.close()
