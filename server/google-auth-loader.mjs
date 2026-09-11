export async function load(url, context, defaultLoad) {
  const result = await defaultLoad(url, context, defaultLoad)
  if (!url.endsWith('/server/server.mjs')) return result

  const injected = [
    '',
    '// Firebase auth bridges injected at runtime.',
    "app.post('/api/auth/firebase-google', async (request, response) => {",
    "  const idToken = clean(request.body?.idToken)",
    "  if (!idToken) return response.status(400).json({ message: 'Firebase ID token is required.' })",
    '  try {',
    "    const { getAuth } = await import('firebase-admin/auth')",
    '    const decoded = await getAuth().verifyIdToken(idToken)',
    '    const contact = normaliseContact(decoded.email || decoded.phone_number || decoded.uid)',
    "    const displayName = clean(decoded.name || decoded.email || 'Apna Cart User')",
    "    const token = crypto.randomBytes(32).toString('hex')",
    "    sessions.set(token, { name: displayName, contact, createdAt: Date.now(), firebaseUid: decoded.uid, provider: 'google' })",
    '    return response.json({ token, user: { name: displayName, contact }, firebaseUid: decoded.uid })',
    '  } catch (error) {',
    "    console.error('Firebase Google authentication failed:', error.message)",
    "    return response.status(401).json({ message: 'Google login verify nahi ho saka. Firebase/Google settings check karein.' })",
    '  }',
    '})',
    "app.post('/api/auth/firebase-email', async (request, response) => {",
    "  const idToken = clean(request.body?.idToken)",
    "  if (!idToken) return response.status(400).json({ message: 'Firebase ID token is required.' })",
    '  try {',
    "    const { getAuth } = await import('firebase-admin/auth')",
    '    const decoded = await getAuth().verifyIdToken(idToken)',
    '    const contact = normaliseContact(decoded.email || decoded.uid)',
    "    const displayName = clean(decoded.name || decoded.email || 'Apna Cart User')",
    "    const token = crypto.randomBytes(32).toString('hex')",
    "    sessions.set(token, { name: displayName, contact, createdAt: Date.now(), firebaseUid: decoded.uid, provider: 'email-link' })",
    '    return response.json({ token, user: { name: displayName, contact }, firebaseUid: decoded.uid })',
    '  } catch (error) {',
    "    console.error('Firebase email authentication failed:', error.message)",
    "    return response.status(401).json({ message: 'Email login verify nahi ho saka. Firebase email settings check karein.' })",
    '  }',
    '})',
    ''
  ].join('\n')

  return { ...result, source: `${result.source}${injected}`, shortCircuit: true }
}
