//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()
const express = require('express')
const fs = require('fs')
const path = require('path')

// Add your routes here

const BOARD_STATE_PATH = path.join(__dirname, 'data', 'backlog-board-state.json')

const ensureBoardStateFile = () => {
  if (!fs.existsSync(BOARD_STATE_PATH)) {
    fs.mkdirSync(path.dirname(BOARD_STATE_PATH), { recursive: true })
    fs.writeFileSync(
      BOARD_STATE_PATH,
      JSON.stringify({ boardHtml: '', updatedAt: null }),
      'utf8'
    )
  }
}

const readBoardState = () => {
  ensureBoardStateFile()
  try {
    const raw = fs.readFileSync(BOARD_STATE_PATH, 'utf8')
    const parsed = JSON.parse(raw || '{}')
    return {
      boardHtml: typeof parsed.boardHtml === 'string' ? parsed.boardHtml : '',
      updatedAt: parsed.updatedAt || null
    }
  } catch (e) {
    return { boardHtml: '', updatedAt: null }
  }
}

const writeBoardState = (state) => {
  ensureBoardStateFile()
  fs.writeFileSync(BOARD_STATE_PATH, JSON.stringify(state), 'utf8')
}

router.use('/api/backlog-board-state', express.json({ limit: '5mb' }))

router.get('/api/backlog-board-state', (req, res) => {
  res.set('Cache-Control', 'no-store')
  return res.json(readBoardState())
})

router.put('/api/backlog-board-state', (req, res) => {
  const { boardHtml, updatedAt } = req.body || {}
  if (typeof boardHtml !== 'string') {
    return res.status(400).json({ error: 'boardHtml must be a string' })
  }

  const next = {
    boardHtml,
    updatedAt: updatedAt || new Date().toISOString()
  }
  writeBoardState(next)
  return res.json({ ok: true, updatedAt: next.updatedAt })
})


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
