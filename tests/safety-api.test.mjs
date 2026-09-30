import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
const projectId = 'demo-bau-connect';
if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) throw new Error('Emulators required. Never test against production.');
const app = initializeApp({projectId});
const auth = getAuth(app), db = getFirestore(app);
const tokens = {};
let server;
const request = async (path, who, data, method='POST') => {
  const headers = {'Content-Type':'application/json'};
  if (who) headers.Authorization = `Bearer ${tokens[who]}`;
  return fetch(`http://127.0.0.1:3035${path}`, {method,headers,...(data ? {body:JSON.stringify(data)} : {})});
};
before(async () => {
  for (const [uid,email,verified] of [['alice','alice@stu.bau.edu',true],['bob','bob@stu.bau.edu',true],['eve','eve@stu.bau.edu',true],['staff','ratchata@bau.edu',true],['unverified','unverified@stu.bau.edu',false],['outside','outside@example.com',true]]) {
    await auth.createUser({uid,email,emailVerified:verified,password:'Emulator-only-password-2026!'});
    const response = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'Emulator-only-password-2026!',returnSecureToken:true})});
    tokens[uid] = (await response.json()).idToken;
    assert.ok(tokens[uid]);
    await db.doc(`users/${uid}`).set({uid,email,name:uid,blockedUsers:[],bio:'Campus',photoURL:'',photos:[],gallery:[]});
  }
  await db.doc('matches/ab').set({user1Id:'alice',user2Id:'bob',createdAt:Timestamp.now()});
  await db.doc('messages/one').set({matchId:'ab',senderId:'alice',text:'Hello'});
  await db.doc('activities/post').set({authorId:'alice',title:'Study group'});
  await db.doc('likes/request').set({fromUserId:'alice',toUserId:'bob'});
  server = spawn(process.execPath,['--import','./tests/provider-mocks.mjs','node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3035'],{env:{...process.env,GCLOUD_PROJECT:projectId,BREVO_API_KEY:"test-mail-key",CLOUDINARY_API_KEY:"test-key",CLOUDINARY_API_SECRET:"test-cloudinary-secret",NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:"test-cloud"},stdio:'ignore'});
  for (let i=0;i<50;i++) { try { const r=await fetch('http://127.0.0.1:3035/landing'); if(r.ok) return; } catch {} await new Promise(r=>setTimeout(r,200)); }
  throw new Error('Test server did not start');
});
after(async () => { server?.kill(); await app.delete(); });
test('protected routes reject unsigned and unverified accounts',async()=>{
  for (const path of ['/api/admin/maintenance','/api/safety','/api/account/deletion','/api/account/deletion/process','/api/connections','/api/media','/api/notify','/api/email']) assert.equal((await request(path,null,{})).status,401,path);
  assert.equal((await request('/api/safety','unverified',{action:'block',userId:'alice'})).status,403);
  assert.equal((await request('/api/safety','outside',{action:'block',userId:'alice'})).status,403);
});
test('reports are deduplicated; students cannot read moderator queue or report private conversations they do not belong to',async()=>{
  const data={action:'report',kind:'post',targetId:'post',reason:'Spam or scam',details:'Test report'};
  assert.equal((await request('/api/safety','bob',data)).status,200);
  assert.equal((await request('/api/safety','bob',data)).status,200);
  assert.equal((await db.collection('safetyReports').get()).size,1);
  assert.equal((await request('/api/safety','eve',{...data,kind:'message',targetId:'one'})).status,403);
  assert.equal((await request('/api/safety','bob',undefined,'GET')).status,403);
  assert.equal((await request('/api/safety','staff',undefined,'GET')).status,200);
});
test('staff can hide reported content; students cannot moderate',async()=>{
  const id=(await db.collection('safetyReports').get()).docs[0].id;
  assert.equal((await request('/api/safety','bob',{id,action:'hide'},'PATCH')).status,403);
  assert.equal((await request('/api/safety','staff',{id,action:'hide'},'PATCH')).status,200);
  assert.equal((await db.doc('activities/post').get()).data().hidden,true);
});
test('connection requires an actual incoming request and refuses either-direction blocking',async()=>{
  assert.equal((await request('/api/connections','eve',{otherId:'bob'})).status,403);
  assert.equal((await request('/api/connections','bob',{otherId:'alice'})).status,200);
  assert.equal((await request('/api/safety','alice',{action:'block',userId:'bob'})).status,200);
  assert.equal((await request('/api/connections','bob',{otherId:'alice'})).status,403);
  assert.deepEqual((await db.doc('users/alice').get()).data().blockedUsers,['bob']);
});
test('deletion request uses authenticated identity, requires confirmation, and cannot be processed by a student',async()=>{
  assert.equal((await request('/api/account/deletion','alice',{confirm:'wrong'})).status,400);
  assert.equal((await request('/api/account/deletion','alice',{confirm:'DELETE',uid:'bob'})).status,200);
  assert.equal((await db.doc('accountDeletionRequests/alice').get()).data().uid,'alice');
  assert.equal((await db.doc('accountDeletionRequests/bob').get()).exists,false);
  assert.equal((await request('/api/account/deletion?staff=1','bob',undefined,'GET')).status,403);
  assert.equal((await request('/api/account/deletion/process','bob',{uid:'alice',confirm:'DELETE'})).status,403);
  // Refuse an unapproved legacy asset before disabling or deleting anyone.
  await db.doc("users/alice").update({photoURL:"https://res.cloudinary.com/example-cloud/image/upload/v1/legacy.jpg"});
  assert.equal((await request('/api/account/deletion/process','staff',{uid:'alice',confirm:'DELETE'})).status,409);
  assert.equal((await auth.getUser('alice')).disabled,false);
  assert.equal((await db.doc('users/alice').get()).exists,true);
});

test('upload receipts require correct signature and ticket ownership',async()=>{
  const issued=await request('/api/media','bob',{type:'image/png',size:100});
  assert.equal(issued.status,200);
  const ticket=await issued.json();
  const publicId=`${ticket.folder}/${ticket.publicId}`, version=123;
  const signature=createHash('sha1').update(`public_id=${publicId}&version=${version}test-cloudinary-secret`).digest('hex');
  const receipt={ticket:ticket.publicId,version,signature,url:`https://res.cloudinary.com/${ticket.cloud}/image/upload/v${version}/${publicId}.png`,resourceType:'image'};
  assert.equal((await request('/api/media','alice',receipt,'PATCH')).status,403);
  assert.equal((await request('/api/media','bob',{...receipt,signature:'0'.repeat(40)},'PATCH')).status,400);
  assert.equal((await request('/api/media','bob',receipt,'PATCH')).status,200);
  assert.equal((await db.doc(`mediaAssets/${ticket.publicId}`).get()).data().uid,'bob');
});

test('legacy device token migration requires staff and preserves private token',async()=>{
  await db.doc('users/eve').update({fcmToken:'old-token'});
  await db.doc('users/eve/private/notifications').set({fcmToken:'new-token'});
  const action={action:'protect-notification-tokens'};
  assert.equal((await request('/api/admin/maintenance','bob',action)).status,403);
  assert.equal((await request('/api/admin/maintenance','staff',action)).status,200);
  assert.equal((await db.doc('users/eve').get()).data().fcmToken,undefined);
  assert.equal((await db.doc('users/eve/private/notifications').get()).data().fcmToken,'new-token');
});
test('account deletion retains its manifest after provider failure and succeeds on retry',async()=>{
  const uid='disposable';
  await auth.createUser({uid,email:'disposable@stu.bau.edu',emailVerified:true});
  await db.doc(`users/${uid}`).set({uid,email:'disposable@stu.bau.edu',photos:[],gallery:[]});
  await db.doc(`accountDeletionRequests/${uid}`).set({uid,email:'disposable@stu.bau.edu',status:'pending'});
  await db.doc('mediaAssets/disposable').set({uid,publicId:'bau-connect/users/disposable/failonce',status:'pending',createdAt:Timestamp.fromMillis(Date.now()-70*60000)});
  await db.doc('likes/disposable').set({fromUserId:uid,toUserId:'bob'});
  await db.doc('users/bob/inbox/disposable').set({fromUserId:uid});
  const data={uid,confirm:'DELETE',legacyApproved:true};
  assert.equal((await request('/api/account/deletion/process','staff',data)).status,503);
  assert.equal((await auth.getUser(uid)).disabled,true);
  assert.ok((await db.doc(`accountDeletionRequests/${uid}`).get()).data().media.length);
  assert.equal((await request('/api/account/deletion/process','staff',data)).status,200);
  assert.equal((await db.doc(`users/${uid}`).get()).exists,false);
  assert.equal((await db.doc(`accountDeletionRequests/${uid}`).get()).exists,false);
  assert.equal((await db.doc('mediaAssets/disposable').get()).exists,false);
  assert.equal((await db.doc('likes/disposable').get()).exists,false);
  assert.equal((await db.doc('users/bob/inbox/disposable').get()).exists,false);
  await assert.rejects(auth.getUser(uid),{code:'auth/user-not-found'});
});
