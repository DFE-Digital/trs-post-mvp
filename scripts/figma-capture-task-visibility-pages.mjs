/**
 * Open each task-visibility page and submit Figma html-to-design capture (Playwright).
 *
 *   node scripts/figma-capture-task-visibility-pages.mjs
 */
import { chromium } from 'playwright'

const baseUrl = (process.env.PROTOTYPE_URL || 'http://localhost:3000').replace(/\/$/, '')

const pages = [
  'add-note',
  'add-zendesk-tickets',
  'all-tasks-overview-batch',
  'all-tasks-overview',
  'assign-bulk-confirmation',
  'assign-bulk',
  'assign-single',
  'confirm-connect',
  'daily-metrics-parked',
  'dashboard',
  'manage-allocation',
  'manage-task',
  'task-detail-completed',
  'task-detail-dennis',
  'task-detail-theo',
  'task-list-ol',
  'task-view-match-multi'
]

const captureIds = [
  '52d0f3c1-cd22-4202-b71a-c2034efcae9d',
  'f1827488-38e5-4552-8d61-7bc3eb3ff91c',
  'b8ea6d81-fa51-44dc-8dfb-87998a01b519',
  '96481c30-e217-45e6-aebc-04e5b9565771',
  '9d7033ff-8107-4245-9d36-83a9b2100260',
  '0fc561e9-4088-497b-944e-a9e278fadb36',
  '460938f3-3309-4c1e-bc73-4beb9882ffa9',
  '1d43e4aa-c76b-46ed-b851-dcf58efe29c9',
  '500deb56-38aa-4b6a-ae47-548ee05371ab',
  '6cfe8a55-5788-4dbe-b6e1-bcb8fe28c84c',
  '923abafa-cd46-4936-82ff-883a97b0275d',
  '1a14989b-6f33-4bc9-82c8-8ea30052ab4b',
  'd7faed58-e331-4e2f-ad52-3b3d681ac129',
  '8f8387a1-7c21-400e-bb99-8addf6d03bbd',
  '80a0ed9d-35ce-420d-928f-a623559ec8fc',
  'cca0e4b1-2933-4f7f-b423-6b3baa07718b',
  'e4f9785d-5a7e-44cc-b9b7-d6d870433aaa'
]

async function main () {
  if (pages.length !== captureIds.length) {
    console.error('pages and captureIds length mismatch')
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

  await context.route('**/*', async (route) => {
    const response = await route.fetch()
    const headers = { ...response.headers() }
    delete headers['content-security-policy']
    delete headers['content-security-policy-report-only']
    await route.fulfill({ response, headers })
  })

  const page = await context.newPage()

  for (let i = 0; i < pages.length; i++) {
    const slug = pages[i]
    const captureId = captureIds[i]
    const url = `${baseUrl}/task-visibility-all-tasks/${encodeURIComponent(slug)}`
    process.stdout.write(`${slug} ... `)
    try {
      const res = await page.goto(url, { waitUntil: 'load', timeout: 120000 })
      if (res && res.status() >= 400) {
        throw new Error(`HTTP ${res.status()}`)
      }

      const r = await context.request.get('https://mcp.figma.com/mcp/html-to-design/capture.js')
      if (!r.ok()) {
        throw new Error(`capture.js ${r.status()}`)
      }
      const scriptText = await r.text()
      await page.evaluate((s) => {
        const el = document.createElement('script')
        el.textContent = s
        document.head.appendChild(el)
      }, scriptText)
      await page.waitForTimeout(800)

      const endpoint = `https://mcp.figma.com/mcp/capture/${captureId}/submit`
      await page.evaluate(
        ({ captureId, endpoint }) =>
          window.figma.captureForDesign({
            captureId,
            endpoint,
            selector: 'body'
          }),
        { captureId, endpoint }
      )
      console.log('ok')
    } catch (e) {
      console.log('failed:', e.message)
    }
  }

  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
