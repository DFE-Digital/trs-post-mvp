#!/usr/bin/env node
'use strict'

const fs = require('fs/promises')
const path = require('path')

const LIVE_PULL_URL = process.env.LIVE_PULL_URL || 'https://trs-post-mvp-6853f9a5ac29.herokuapp.com'
const LIVE_PULL_PATH = process.env.LIVE_PULL_PATH || '/ai_ideation/backlog-board'
const LIVE_PULL_PASSWORD = process.env.LIVE_PULL_PASSWORD
const LIVE_PULL_COOKIE = process.env.LIVE_PULL_COOKIE
const LIVE_PULL_OUT = process.env.LIVE_PULL_OUT ||
  path.join(__dirname, '..', 'app', 'views', 'ai_ideation', 'backlog-board.html')

const getCookieHeader = (headers) => {
  const getSetCookie = headers.getSetCookie
  const cookies = typeof getSetCookie === 'function'
    ? getSetCookie.call(headers)
    : (headers.get('set-cookie') ? [headers.get('set-cookie')] : [])

  return cookies
    .map((cookie) => String(cookie || '').split(';')[0])
    .filter(Boolean)
    .join('; ')
}

const loginAndGetCookie = async () => {
  if (!LIVE_PULL_PASSWORD) return ''
  const response = await fetch(`${LIVE_PULL_URL}/manage-prototype/password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `password=${encodeURIComponent(LIVE_PULL_PASSWORD)}`,
    redirect: 'manual'
  })
  return getCookieHeader(response.headers)
}

const looksLikeLoginPage = (html, finalUrl) => {
  if (finalUrl && String(finalUrl).includes('/manage-prototype/password')) return true
  if (!html) return true
  return html.includes('name="password"') || html.includes('manage-prototype/password')
}

const run = async () => {
  const cookie = LIVE_PULL_COOKIE || await loginAndGetCookie()
  if (!cookie && !LIVE_PULL_COOKIE) {
    throw new Error('No auth cookie. Set LIVE_PULL_PASSWORD or LIVE_PULL_COOKIE.')
  }

  const url = `${LIVE_PULL_URL}${LIVE_PULL_PATH}`
  const response = await fetch(url, {
    headers: cookie ? { Cookie: cookie } : {},
    cache: 'no-store'
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Fetch failed: HTTP ${response.status} ${text}`.trim())
  }

  const html = await response.text()
  if (looksLikeLoginPage(html, response.url)) {
    throw new Error('Auth failed: received login page.')
  }

  await fs.mkdir(path.dirname(LIVE_PULL_OUT), { recursive: true })
  const tmp = `${LIVE_PULL_OUT}.tmp`
  await fs.writeFile(tmp, html, 'utf8')
  await fs.rename(tmp, LIVE_PULL_OUT)
  console.log(`Updated ${LIVE_PULL_OUT} from ${url}`)
}

run().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
