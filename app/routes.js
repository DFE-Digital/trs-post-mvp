//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const fs = require('fs')
const path = require('path')

// Add your routes here


/// ITRs duplicates merge record route
router.post('/select-option', (req, res) => {
  const userChoice = req.body.mergeRecord;

  if (userChoice === 'Merge it with Record A') {
    res.redirect('/itr-duplicates/select');
  } 
  else if (userChoice === 'Keep it as a separate record') {
    res.redirect('/itr-duplicates/keep-separate-reasons');
  } 
  else {
    // fallback if nothing selected
    res.redirect('/itr-duplicates/select');
  }
});


/// OneLogin verify
router.post("/verify-teacher-id-match", function (req, res) {
  var userChoice = req.session.data["verify"]; 

  if (userChoice === "yes") {
    res.redirect("onelogin/id-verification/task-view-match-multi");
  } 
  else if (userChoice === "no") {
   res.redirect("onelogin/id-verification/reject-request");
  } 
  else {
    res.redirect("onelogin/id-verification/task-view-match"); // nothing selected
  }
});






/// OneLogin match
router.post("/match-teacher-id", function (req, res) {
  var userChoice = req.session.data["connect"]; 

  if (userChoice === "yes") {
    res.redirect("onelogin/id-verification/confirm-connect");
  } 
    else if (userChoice === "manual") {
    res.redirect("onelogin/id-verification/manual-connect");
    }
  else if (userChoice === "no") {
    res.redirect("onelogin/id-verification/do-not-connect-reason");
  } else {
    res.redirect("onelogin/id-verification/confirm-connect"); // nothing selected
  }
});

const BACKLOG_STATE_FILE = path.join(__dirname, 'data', 'backlog-board-state.json')

const ensureBacklogStateFile = async () => {
  try {
    await fs.promises.access(BACKLOG_STATE_FILE, fs.constants.F_OK)
  } catch (_) {
    await fs.promises.mkdir(path.dirname(BACKLOG_STATE_FILE), { recursive: true })
    await fs.promises.writeFile(
      BACKLOG_STATE_FILE,
      JSON.stringify({ boardHtml: '', updatedAt: null }, null, 2),
      'utf8'
    )
  }
}

const readRawBody = (req, maxBytes = 20 * 1024 * 1024) =>
  new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (Buffer.byteLength(data, 'utf8') > maxBytes) {
        reject(new Error('Payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })

router.get('/api/backlog-board-state', async (req, res) => {
  try {
    await ensureBacklogStateFile()
    const raw = await fs.promises.readFile(BACKLOG_STATE_FILE, 'utf8')
    const state = JSON.parse(raw || '{}')

    res.set('Cache-Control', 'no-store')
    return res.json({
      boardHtml: typeof state.boardHtml === 'string' ? state.boardHtml : '',
      updatedAt: state.updatedAt || null
    })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to read board state' })
  }
})

router.put('/api/backlog-board-state', async (req, res) => {
  try {
    let boardHtml = null
    let updatedAt = null

    if (req.body && typeof req.body === 'object' && typeof req.body.boardHtml === 'string') {
      boardHtml = req.body.boardHtml
      updatedAt = req.body.updatedAt || null
    } else if (typeof req.body === 'string' && req.body.length > 0) {
      boardHtml = req.body
    } else {
      const raw = await readRawBody(req)
      const contentType = String(req.headers['content-type'] || '').toLowerCase()
      if (contentType.includes('application/json')) {
        const parsed = JSON.parse(raw || '{}')
        if (typeof parsed.boardHtml === 'string') boardHtml = parsed.boardHtml
        updatedAt = parsed.updatedAt || null
      } else {
        boardHtml = raw
      }
    }

    if (typeof boardHtml !== 'string' || boardHtml.length === 0) {
      return res.status(400).json({ error: 'boardHtml must be a string' })
    }

    const state = {
      boardHtml,
      updatedAt: updatedAt || new Date().toISOString()
    }

    await ensureBacklogStateFile()
    const tmpFile = `${BACKLOG_STATE_FILE}.tmp`
    await fs.promises.writeFile(tmpFile, JSON.stringify(state), 'utf8')
    await fs.promises.rename(tmpFile, BACKLOG_STATE_FILE)

    res.set('Cache-Control', 'no-store')
    return res.json({ ok: true, updatedAt: state.updatedAt })
  } catch (error) {
    if (error.type === 'entity.too.large' || error.message === 'Payload too large') {
      return res.status(413).json({ error: 'Payload too large' })
    }
    return res.status(400).json({ error: 'Invalid request body' })
  }
})
