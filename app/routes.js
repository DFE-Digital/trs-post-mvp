//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

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
    res.redirect("onelogin/id-verification/confirm-verification");
  } 
  else if (userChoice === "no") {
   res.redirect("onelogin/id-verification/reject-request");
  } 
  else {
    res.redirect("onelogin/id-verification/task-view-match"); // nothing selected
  }
});


/// OneLogin verify
router.post("/verify-teacher-id-no-match", function (req, res) {
  var userChoice = req.session.data["verify"]; 

  if (userChoice === "yes") {
   // res.redirect("onelogin/id-verification/confirm-verification");
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
