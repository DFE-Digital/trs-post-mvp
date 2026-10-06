// Routes for the task visibility, access and permissions prototype.
// Kept separate from app/routes.js so this journey can be maintained in one place.
module.exports = (router) => {
  const adminPath = '/task-visibility-access-permissions-mvp/admin'
  const defaultTeams = ['Register', 'TRA', 'Team C']
  const roles = [
    { name: 'Viewer', permissions: ['View', 'View', 'View', 'No', 'No', 'No'] },
    { name: 'Record manager', permissions: ['Edit', 'Edit', 'View', 'No', 'No', 'Edit'] },
    { name: 'Alerts manager (TRA decisions)', permissions: ['Edit', 'View', 'Edit', 'View', 'No', 'No'] },
    { name: 'Alerts manager (TRA and DBS decisions)', permissions: ['Edit', 'View', 'Edit', 'Edit', 'No', 'No'] },
    { name: 'Access manager', permissions: ['Edit', 'Edit', 'View', 'No', 'Edit', 'Edit'] },
    { name: 'Administrator', permissions: ['Edit', 'Edit', 'Edit', 'Edit', 'Edit', 'Edit'] }
  ]
  const defaultUsers = [
    { id: '1', firstName: 'Aamina', lastName: 'Patel', email: 'aamina.patel@example.gov.uk', team: 'Register', role: 'Record manager' },
    { id: '2', firstName: 'Alison', lastName: 'Hey', email: 'alison.hey@example.gov.uk', team: 'TRA', role: 'Viewer' },
    { id: '3', firstName: 'Angela', lastName: 'Borman', email: 'angela.borman@example.gov.uk', team: 'Team C', role: 'Senior record manager' },
    { id: '4', firstName: 'Alistair', lastName: 'Wright', email: 'alistair.wright@example.gov.uk', team: 'Register', role: 'Viewer' },
    { id: '5', firstName: 'Ben', lastName: 'Thornton', email: 'ben.thornton@example.gov.uk', team: 'TRA', role: 'Access manager' },
    { id: '6', firstName: 'Clare', lastName: 'Okafor', email: 'clare.okafor@example.gov.uk', team: 'Register', role: 'Administrator' },
    { id: '7', firstName: 'David', lastName: 'Singh', email: 'david.singh@example.gov.uk', team: 'Team C', role: 'Viewer' },
    { id: '8', firstName: 'Emma', lastName: 'Walsh', email: 'emma.walsh@example.gov.uk', team: 'TRA', role: 'Record manager', status: 'Deactivated' },
    { id: '9', firstName: 'Fatima', lastName: 'Ahmed', email: 'fatima.ahmed@example.gov.uk', team: 'Register', role: 'Alerts manager (TRA decisions)' },
    { id: '10', firstName: 'George', lastName: 'Mbeki', email: 'george.mbeki@example.gov.uk', team: 'Team C', role: 'Administrator' }
  ]

  const getTeams = (req) => {
    if (!Array.isArray(req.session.data.adminTeams)) req.session.data.adminTeams = [...defaultTeams]
    return req.session.data.adminTeams
  }
  const getUsers = (req) => {
    if (!Array.isArray(req.session.data.adminUsers)) req.session.data.adminUsers = defaultUsers.map((user) => ({ ...user }))
    return req.session.data.adminUsers
  }
  const getUser = (users, id) => users.find((user) => String(user.id) === String(id))
  const teamOptions = (teams, selectedIndex) => [
    { value: '', text: 'Select a team' },
    ...teams.map((team, index) => ({ value: String(index), text: team, selected: String(index) === String(selectedIndex) }))
  ]

  router.get(`${adminPath}/teams`, (req, res) => {
    const messages = { added: `Team ${req.query.team || ''} added`, changed: `Team name changed to ${req.query.team || ''}`, deleted: `Team ${req.query.team || ''} deleted` }
    res.render('task-visibility-access-permissions-mvp/admin/teams', { activeAdminPage: 'teams', teams: getTeams(req), successMessage: messages[req.query.success] })
  })
  router.get(`${adminPath}/add-team`, (req, res) => {
    const errors = { required: 'Enter a team name', duplicate: 'A team with this name already exists' }
    res.render('task-visibility-access-permissions-mvp/admin/add-team', { activeAdminPage: 'teams', errorMessage: errors[req.query.error] })
  })
  router.post(`${adminPath}/add-team`, (req, res) => {
    const teams = getTeams(req); const teamName = String(req.body.teamName || '').trim()
    if (!teamName) return res.redirect(`${adminPath}/add-team?error=required`)
    if (teams.some((team) => team.toLowerCase() === teamName.toLowerCase())) return res.redirect(`${adminPath}/add-team?error=duplicate`)
    teams.push(teamName)
    return res.redirect(`${adminPath}/teams?success=added&team=${encodeURIComponent(teamName)}`)
  })
  router.get(`${adminPath}/change-team`, (req, res) => {
    const teams = getTeams(req); const requestedTeam = String(req.query.team || ''); const errors = { required: 'Enter a new team name', duplicate: 'A team with this name already exists', select: 'Select a team' }
    const selectedIndex = /^\d+$/.test(requestedTeam) ? Number(requestedTeam) : teams.indexOf(requestedTeam)
    const selectedTeamName = selectedIndex >= 0 && selectedIndex < teams.length ? teams[selectedIndex] : ''
    res.render('task-visibility-access-permissions-mvp/admin/change-team', { activeAdminPage: 'teams', teamOptions: teamOptions(teams, selectedIndex), selectedTeamName, teamIndex: selectedIndex, errorMessage: errors[req.query.error] })
  })
  router.post(`${adminPath}/change-team`, (req, res) => {
    const teams = getTeams(req); const teamIndex = Number(req.body.teamIndex); const newTeamName = String(req.body.newTeamName || '').trim()
    if (!Number.isInteger(teamIndex) || teamIndex < 0 || teamIndex >= teams.length) return res.redirect(`${adminPath}/change-team?error=select`)
    if (!newTeamName) return res.redirect(`${adminPath}/change-team?team=${teamIndex}&error=required`)
    if (teams.some((team, index) => index !== teamIndex && team.toLowerCase() === newTeamName.toLowerCase())) return res.redirect(`${adminPath}/change-team?team=${teamIndex}&error=duplicate`)
    teams[teamIndex] = newTeamName
    return res.redirect(`${adminPath}/teams?success=changed&team=${encodeURIComponent(newTeamName)}`)
  })
  router.get(`${adminPath}/delete-team`, (req, res) => {
    const teams = getTeams(req); const requestedIndex = Number(req.query.team); const teamIndex = Number.isInteger(requestedIndex) && requestedIndex >= 0 && requestedIndex < teams.length ? requestedIndex : 0
    res.render('task-visibility-access-permissions-mvp/admin/delete-team', { activeAdminPage: 'teams', teamName: teams[teamIndex], teamIndex })
  })
  router.post(`${adminPath}/delete-team`, (req, res) => {
    const teams = getTeams(req); const teamIndex = Number(req.body.teamIndex)
    if (!Number.isInteger(teamIndex) || teamIndex < 0 || teamIndex >= teams.length) return res.redirect(`${adminPath}/teams`)
    const [teamName] = teams.splice(teamIndex, 1)
    return res.redirect(`${adminPath}/teams?success=deleted&team=${encodeURIComponent(teamName)}`)
  })

  router.get(`${adminPath}/users`, (req, res) => {
    const search = String(req.query.search || '').trim().toLowerCase()
    const users = getUsers(req).filter((user) => {
      const searchableText = `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase()
      return (!search || searchableText.includes(search)) && (!req.query.team || user.team === req.query.team) && (!req.query.role || user.role === req.query.role)
    })
    const successMessage = req.query.success === 'added' ? `User ${req.query.name || ''} added` : req.query.success === 'changed' ? `User ${req.query.name || ''} details changed` : ''
    res.render('task-visibility-access-permissions-mvp/admin/users', { activeAdminPage: 'users', users, teams: getTeams(req), roles: roles.map((role) => role.name), search: req.query.search || '', selectedTeam: req.query.team || '', selectedRole: req.query.role || '', successMessage })
  })
  router.get(`${adminPath}/add-user`, (req, res) => {
    const errors = { required: 'Enter an email address', invalid: 'Enter an email address in the correct format', duplicate: 'A user with this email address already exists' }
    res.render('task-visibility-access-permissions-mvp/admin/add-user', { activeAdminPage: 'users', errorMessage: errors[req.query.error] })
  })
  router.post(`${adminPath}/add-user`, (req, res) => {
    const users = getUsers(req); const email = String(req.body.email || '').trim().toLowerCase()
    if (!email) return res.redirect(`${adminPath}/add-user?error=required`)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.redirect(`${adminPath}/add-user?error=invalid`)
    if (users.some((user) => user.email.toLowerCase() === email)) return res.redirect(`${adminPath}/add-user?error=duplicate`)
    const firstName = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    users.push({ id: String(Math.max(0, ...users.map((user) => Number(user.id) || 0)) + 1), firstName, lastName: '', email, team: getTeams(req)[0] || '', role: 'Viewer' })
    return res.redirect(`${adminPath}/users?success=added&name=${encodeURIComponent(firstName)}`)
  })
  router.get(`${adminPath}/change-user`, (req, res) => {
    const user = getUser(getUsers(req), req.query.user)
    if (!user) return res.redirect(`${adminPath}/users`)
    const errors = { required: 'Enter an email address', invalid: 'Enter an email address in the correct format', duplicate: 'A user with this email address already exists', team: 'Select a team', role: 'Select a role' }
    res.render('task-visibility-access-permissions-mvp/admin/change-user', { activeAdminPage: 'users', user, teams: getTeams(req), roles, errorMessage: errors[req.query.error] })
  })
  router.post(`${adminPath}/change-user`, (req, res) => {
    const users = getUsers(req); const user = getUser(users, req.body.userId)
    if (!user) return res.redirect(`${adminPath}/users`)
    const email = String(req.body.email || '').trim().toLowerCase(); const nameParts = String(req.body.name || `${req.body.firstName || ''} ${req.body.lastName || ''}`).trim().split(/\s+/); const firstName = nameParts[0] || ''; const lastName = nameParts.slice(1).join(' '); const team = String(req.body.team || ''); const role = String(req.body.role || '')
    if (!email) return res.redirect(`${adminPath}/change-user?user=${user.id}&error=required`)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.redirect(`${adminPath}/change-user?user=${user.id}&error=invalid`)
    if (users.some((otherUser) => otherUser.id !== user.id && otherUser.email.toLowerCase() === email)) return res.redirect(`${adminPath}/change-user?user=${user.id}&error=duplicate`)
    if (!getTeams(req).includes(team)) return res.redirect(`${adminPath}/change-user?user=${user.id}&error=team`)
    if (!roles.some((availableRole) => availableRole.name === role)) return res.redirect(`${adminPath}/change-user?user=${user.id}&error=role`)
    Object.assign(user, { firstName, lastName, email, team, role })
    return res.redirect(`${adminPath}/users?success=changed&name=${encodeURIComponent(`${firstName} ${lastName}`.trim() || email)}`)
  })
}
