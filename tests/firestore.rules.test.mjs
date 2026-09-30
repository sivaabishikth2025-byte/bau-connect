import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, serverTimestamp, arrayUnion, deleteDoc, Timestamp } from 'firebase/firestore';
let env;
const claims = email => ({ email, email_verified: true });
const db = uid => env.authenticatedContext(uid, claims(`${uid}@stu.bau.edu`)).firestore();
const profile = uid => ({ uid, email: `${uid}@stu.bau.edu`, name: uid, age: 22, major: 'CS', university: 'BAU', bio: 'Campus life', interests: ['Study'], photoURL: '', photos: [], gallery: [], blockedUsers: [], createdAt: Timestamp.now() });
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-bau-connect', firestore: { host: '127.0.0.1', port: 8085, rules: readFileSync('firestore.rules', 'utf8') } }); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await Promise.all(['alice','bob','eve'].map(uid => setDoc(doc(d, 'users', uid), profile(uid))));
    await setDoc(doc(d,'matches','ab'), { user1Id:'alice', user2Id:'bob', createdAt:Timestamp.now() });
    await setDoc(doc(d,'messages','one'), { matchId:'ab', senderId:'alice', text:'hello', createdAt:Timestamp.now(), seenBy:['alice'] });
    await setDoc(doc(d,'volunteerApplications','application'), { jobId:'job', applicantId:'alice', applicantEmail:'alice@stu.bau.edu', phone:'123', availability:'weekdays', why:'Help campus', status:'applied', adminNotes:'', roleNotes:'', createdAt:Timestamp.now(), updatedAt:Timestamp.now() });
    await setDoc(doc(d,'volunteers','job'), { title:'Campus event', description:'Help out', organizerId:'staff', participantIds:[], status:'active', createdAt:Timestamp.now() });
    await setDoc(doc(d,'activities','post'), { authorId:'alice', authorName:'Alice', title:'Study group', description:'Meet classmates', type:'study', participantIds:['alice'], likedBy:[], createdAt:Timestamp.now() });
  });
});
after(async () => { await env.cleanup(); });
test('messages readable only by participants, including queries', async () => {
  await assertSucceeds(getDoc(doc(db('bob'),'messages','one')));
  await assertFails(getDoc(doc(db('eve'),'messages','one')));
  await assertSucceeds(getDocs(query(collection(db('bob'),'messages'),where('matchId','==','ab'))));
  await assertFails(getDocs(query(collection(db('eve'),'messages'),where('matchId','==','ab'))));
});
test('profile owner only, no field escalation', async () => {
  await assertFails(updateDoc(doc(db('eve'),'users','alice'),{bio:'Hijacked'}));
  await assertSucceeds(updateDoc(doc(db('alice'),'users','alice'),{bio:'New bio'}));
  await assertFails(updateDoc(doc(db('alice'),'users','alice'),{hidden:false}));
  await assertFails(setDoc(doc(db('alice'),'users','alice','private','uploads'),{fcmToken:'reset-counter'}));
  await assertSucceeds(setDoc(doc(db('alice'),'users','alice','private','notifications'),{fcmToken:'device-token'}));
  await assertFails(getDoc(doc(db('bob'),'users','alice','private','notifications')));
  await assertFails(updateDoc(doc(db('alice'),'users','alice'),{email:'admin@bau.edu'}));
  await assertFails(updateDoc(doc(db('alice'),'users','alice'),{bio:'x'.repeat(2001)}));
});
test('blocking stops new messages and connection requests in both directions', async () => {
  await assertSucceeds(updateDoc(doc(db('alice'),'users','alice'),{blockedUsers:['bob']}));
  for (const [from,to] of [['bob','alice'],['alice','bob']]) {
    await assertFails(setDoc(doc(db(from),'messages','new-'+from),{matchId:'ab',senderId:from,text:'hello',createdAt:serverTimestamp(),seenBy:[from]}));
    await assertFails(setDoc(doc(db(from),'likes','new-'+from),{fromUserId:from,toUserId:to,createdAt:serverTimestamp()}));
  }
});
test('participants can send and mark read, cannot impersonate or edit message', async () => {
  await assertSucceeds(setDoc(doc(db('bob'),'messages','new'),{matchId:'ab',senderId:'bob',text:'hello',createdAt:serverTimestamp(),seenBy:['bob']}));
  await assertFails(setDoc(doc(db('eve'),'messages','spoof'),{matchId:'ab',senderId:'alice',text:'spoof',createdAt:serverTimestamp(),seenBy:['alice']}));
  await assertSucceeds(updateDoc(doc(db('bob'),'messages','one'),{seenBy:arrayUnion('bob')}));
  await assertFails(updateDoc(doc(db('bob'),'messages','one'),{text:'Changed'}));
});
test('private applications, verified admins only and no self-hire', async () => {
  await assertFails(getDoc(doc(db('bob'),'volunteerApplications','application')));
  await assertFails(getDocs(collection(db('bob'),'volunteerApplications')));
  await assertSucceeds(getDocs(query(collection(db('alice'),'volunteerApplications'),where('applicantId','==','alice'))));
  await assertFails(updateDoc(doc(db('alice'),'volunteerApplications','application'),{status:'hired'}));
  const admin = env.authenticatedContext('staff',{email:'ratchata@bau.edu',email_verified:true}).firestore();
  const fake = env.authenticatedContext('fake',{email:'ratchata@bau.edu',email_verified:false}).firestore();
  await assertSucceeds(getDocs(collection(admin,'volunteerApplications')));
  await assertSucceeds(updateDoc(doc(admin,'volunteerApplications','application'),{status:'hired'}));
  await assertFails(getDocs(collection(fake,'volunteerApplications')));
});
test('feed allows own participation, not overwriting others or stealing author', async () => {
  await assertSucceeds(updateDoc(doc(db('bob'),'activities','post'),{participantIds:arrayUnion('bob')}));
  await assertFails(updateDoc(doc(db('bob'),'activities','post'),{participantIds:['bob']}));
  await assertFails(updateDoc(doc(db('bob'),'activities','post'),{title:'Hijacked'}));
  await assertFails(updateDoc(doc(db('alice'),'activities','post'),{authorId:'bob'}));
  await assertSucceeds(updateDoc(doc(db('alice'),'activities','post'),{title:'New title'}));
});
test('offensive text and unknown collections denied', async () => {
  await assertFails(updateDoc(doc(db('alice'),'activities','post'),{title:'fuck you'}));
  await assertFails(setDoc(doc(db('alice'),'accountDeletionRequests','bob'),{uid:'bob'}));
  await assertFails(getDocs(collection(db('alice'),'safetyReports')));
  await assertFails(setDoc(doc(db('alice'),'matches','fake'),{user1Id:'alice',user2Id:'bob'}));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'users','alice')));
});
test('new verified profile onboarding works; unverified and external accounts denied', async () => {
  await assertSucceeds(setDoc(doc(db('newuser'),'users','newuser'),{...profile('newuser'),createdAt:serverTimestamp()}));
  const outside = env.authenticatedContext('outside',{email:'outside@example.com',email_verified:true}).firestore();
  await assertFails(setDoc(doc(outside,'users','outside'),{...profile('outside'),createdAt:serverTimestamp()}));
});
