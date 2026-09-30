// Loaded only by the emulator test server; never by production. No real provider calls.
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.GCLOUD_PROJECT !== 'demo-bau-connect') throw new Error('Provider mocks require demo emulators');
const originalFetch = globalThis.fetch;
let failedOnce = false;
globalThis.fetch = async (input, init) => {
  const url = String(input);
  if (url.startsWith('https://api.cloudinary.com/')) {
    const params = new URLSearchParams(init.body);
    if (params.get('api_key') !== 'test-key') throw new Error('Refusing non-test media credentials');
    if (params.get('public_id').endsWith('/failonce') && !failedOnce) { failedOnce = true; return Response.json({error:'Simulated provider failure'},{status:503}); }
    return Response.json({result:'not found'});
  }
  if (url.startsWith('https://api.brevo.com/')) {
    if (init.headers['api-key'] !== 'test-mail-key') throw new Error('Refusing non-test mail credentials');
    return Response.json({messageId:'emulator-only'});
  }
  return originalFetch(input, init);
};
