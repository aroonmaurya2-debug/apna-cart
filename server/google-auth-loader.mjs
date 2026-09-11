export async function load(url, context, defaultLoad) {
  const result = await defaultLoad(url, context, defaultLoad)
  if (!url.endsWith('/server/server.mjs')) return result

  const googleAuthRoute = `\n\n// Firebase Google Sign-In bridge injected at runtime.\napp.post('/api/auth/firebase-google', async (request, response) => {\n  const idToken = clean(request.body?.idToken)\n  if (!idToken) return response.status(400).json({ message: 'Firebase ID token is required.' })\n  try {\n    const { getAuth } = await import('firebase-admin/auth')\n    const decoded = await getAuth().verifyIdToken(idToken)\n    const contact = normaliseContact(decoded.email || decoded.phone_number || decoded.uid)\n    const displayName = clean(decoded.name || decoded.email || 'Apna Cart User')\n    const token = crypto.randomBytes(32).toString('hex')\n    sessions.set(token, { name: displayName, contact, createdAt: Date.now(), firebaseUid: decoded.uid, provider: 'google' })\n    return response.json({ token, user: { name: displayName, contact }, firebaseUid: decoded.uid })\n  } catch (error) {\n    console.error('Firebase Google authentication failed:', error.message)\n    return response.status(401).json({ message: 'Google login verify nahi ho saka. Firebase/Google settings check karein.' })\n  }\n})\n`

  return { ...result, source: `${result.source}${googleAuthRoute}`, shortCircuit: true }
}
