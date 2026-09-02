// Broadcast Atelier direction: the Firestore data layer gives the control room a durable,
// server-managed content archive without needing a local relational database.
import {
  type Firestore,
  FieldValue,
  Timestamp,
} from "firebase-admin/firestore";
import { getFirestoreDb } from "./firebaseAdmin";

export type FirestoreRecord = Record<string, any>;

const COLLECTIONS = {
  settings: "siteSettings",
  programs: "programs",
  services: "services",
  events: "events",
  journal: "journalEntries",
  media: "mediaAssets",
  inquiries: "inquiries",
  users: "users",
  counters: "_counters",
} as const;

let cachedDb: Firestore | null = null;

async function db(): Promise<Firestore> {
  if (!cachedDb) cachedDb = getFirestoreDb();
  return cachedDb;
}

function toStore(value: unknown): unknown {
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (Array.isArray(value)) return value.map(toStore);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = toStore(v);
    return out;
  }
  return value;
}

function fromStore(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(fromStore);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = fromStore(v);
    return out;
  }
  return value;
}

function toPlain(record: FirestoreRecord): FirestoreRecord {
  return fromStore(record) as FirestoreRecord;
}

async function nextId(collection: string): Promise<number> {
  const firestore = await db();
  const counterRef = firestore.collection(COLLECTIONS.counters).doc(collection);
  const result = await firestore.runTransaction(async (tx) => {
    const snap = await tx.get(counterRef);
    const next = (snap.data()?.value ?? 0) + 1;
    tx.set(counterRef, { value: next }, { merge: false });
    return next;
  });
  return result;
}

export async function listCollection(collection: string, orderByField = "sortOrder", direction: "asc" | "desc" = "asc"): Promise<FirestoreRecord[]> {
  const firestore = await db();
  const snap = await firestore
    .collection(COLLECTIONS[collection as keyof typeof COLLECTIONS])
    .orderBy(orderByField, direction)
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...toPlain(doc.data()) }));
}

export async function getOne(collection: string, docId: string): Promise<FirestoreRecord | null> {
  const firestore = await db();
  const doc = await firestore.collection(COLLECTIONS[collection as keyof typeof COLLECTIONS]).doc(docId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...toPlain(doc.data()!) };
}

export async function createDoc(collection: string, values: FirestoreRecord): Promise<{ id: number }> {
  const firestore = await db();
  const numericId = await nextId(collection);
  const now = new Date();
  await firestore.collection(COLLECTIONS[collection as keyof typeof COLLECTIONS]).doc(String(numericId)).set(
    toStore({ ...values, id: numericId, createdAt: now, updatedAt: now }) as FirestoreRecord
  );
  return { id: numericId };
}

export async function updateDoc(collection: string, id: number, values: FirestoreRecord): Promise<void> {
  const firestore = await db();
  await firestore.collection(COLLECTIONS[collection as keyof typeof COLLECTIONS]).doc(String(id)).update(
    toStore({ ...values, updatedAt: new Date() }) as FirestoreRecord
  );
}

export async function deleteDoc(collection: string, id: number): Promise<void> {
  const firestore = await db();
  await firestore.collection(COLLECTIONS[collection as keyof typeof COLLECTIONS]).doc(String(id)).delete();
}

export async function setSettings(values: FirestoreRecord): Promise<void> {
  const firestore = await db();
  await firestore.collection(COLLECTIONS.settings).doc("default").set(
    toStore({ ...values, id: 1, updatedAt: new Date() }) as FirestoreRecord
  );
}

export async function getSettings(): Promise<FirestoreRecord | null> {
  const firestore = await db();
  const doc = await firestore.collection(COLLECTIONS.settings).doc("default").get();
  if (!doc.exists) return null;
  return toPlain(doc.data()!);
}

export async function upsertUserDoc(docId: string, values: FirestoreRecord): Promise<void> {
  const firestore = await db();
  await firestore.collection(COLLECTIONS.users).doc(docId).set(
    toStore({ ...values, updatedAt: new Date(), lastSignedIn: values.lastSignedIn ?? new Date() }) as FirestoreRecord,
    { merge: true }
  );
}

export async function getUserDoc(docId: string): Promise<FirestoreRecord | null> {
  const firestore = await db();
  const doc = await firestore.collection(COLLECTIONS.users).doc(docId).get();
  if (!doc.exists) return null;
  return { id: docId, ...toPlain(doc.data()!) };
}

const defaultSettings = {
  id: 1,
  siteName: "Blue Decor",
  brandLine: "Celebrations, styled beautifully",
  heroEyebrow: "Events made memorable",
  heroTitle: "Make the moment",
  heroAccent: "feel unforgettable.",
  heroIntro: "Friendly, thoughtful décor for weddings, birthdays, graduations, baby showers, and every beautiful reason to gather.",
  heroCtaLabel: "Plan your celebration",
  heroImageUrl: "/images/blue-decore/celebration-reference.jpg",
  heroAsideTitle: "Weddings • birthdays • graduations",
  heroAsideBody: "One warm studio for the moments your people will remember.",
  heroFooterIndex: "01 / 06",
  heroFooterDescriptor: "Event décor + joyful details + beautiful memories",
  tickerItems: "Weddings|Birthdays|Graduations|Baby showers|Special occasions",
  aboutEyebrow: "The Blue Decor approach",
  aboutRailLabel: "About the studio",
  aboutTitle: "Beautiful details",
  aboutAccent: "for your special day.",
  aboutBody: "Tiffany blue décor for weddings, birthdays, graduations, baby showers, and the celebrations that deserve a beautiful frame.",
  aboutQuote: "We will help you make every occasion memorable.",
  aboutImageUrl: "/images/blue-decore/weddings.jpg",
  aboutCaptionLeft: "Celebration styling / Local studio",
  aboutCaptionRight: "Made to travel",
  programsRailLabel: "Collections",
  programsEyebrow: "A timeless way to sit with the stories",
  programsTitle: "One studio.",
  programsAccent: "All kinds of celebrations.",
  programsSummary: "From weddings to graduations to baby showers, we shape a joyful setting that makes every event easier to remember.",
  audioImageLabel: "Listen / 00:48",
  audioCaptionLabel: "Latest signal",
  servicesRailLabel: "What we make",
  servicesEyebrow: "From the first detail to the full room",
  servicesTitle: "Built for",
  servicesAccent: "your occasion.",
  servicesSummary: "Blue Decor brings an editorial eye and a production hand to every format. The medium changes; the care does not.",
  eventEyebrow: "A room for the next story",
  eventTitle: "Make the moment",
  eventAccent: "worth remembering.",
  eventBody: "From a cultural gathering to a public conversation, we help events find their voice before the doors open and keep it moving after the lights go down.",
  eventCtaLabel: "Talk event production",
  eventImageUrl: "/images/blue-decore/graduations.jpg",
  eventImageLabel: "Event promotion / Open room",
  journalEyebrow: "Notes from the desk",
  journalRailLabel: "Journal / field notes",
  journalTitle: "Keep the signal",
  journalAccent: "in the room.",
  contactEyebrow: "Bring us the story",
  contactRailLabel: "Start a conversation",
  contactTitle: "What should",
  contactAccent: "we listen to?",
  contactBody: "Tell us what you are planning, what you are building, or whose celebration needs a beautiful frame. We will take it from there.",
  contactEmail: "hello@bluedecore.com",
  contactLocation: "Local studio",
  instagramUrl: "https://instagram.com",
  youtubeUrl: "https://youtube.com",
  facebookUrl: "https://facebook.com",
  footerNavigateLabel: "Navigate",
  footerFollowLabel: "Follow the studio",
  footerBuiltLine: "Made with care",
} as const;

const seedPrograms = [
  { title: "Wedding Moments", subtitle: "Ceremony + reception", description: "Romantic blue-and-ivory styling, floral moments, and a beautiful setting for your yes.", tag: "Weddings", imageUrl: "/images/blue-decore/weddings.jpg", featureTitle: "A day worth remembering", featureSubtitle: "Blue, soft, and entirely yours", sortOrder: 1, isPublished: true },
  { title: "Birthday Joy", subtitle: "Milestones + surprises", description: "Playful, polished décor that makes every age and every guest feel celebrated.", tag: "Birthdays", imageUrl: "/images/blue-decore/birthdays.jpg", featureTitle: "Make a little more magic", featureSubtitle: "Bright details for the big day", sortOrder: 2, isPublished: true },
  { title: "Graduate Glow", subtitle: "Photo moments + parties", description: "A proud, photo-ready celebration for the next chapter, styled in confident blue.", tag: "Graduations", imageUrl: "/images/blue-decore/graduations.jpg", featureTitle: "Celebrate the next chapter", featureSubtitle: "A setting made for proud photos", sortOrder: 3, isPublished: true },
  { title: "Baby Showers", subtitle: "Sweet beginnings", description: "Gentle, joyful styling for welcoming a new little love and gathering your people.", tag: "Baby showers", imageUrl: "/images/blue-decore/baby-showers.jpg", featureTitle: "The sweetest beginning", featureSubtitle: "Soft details, warm memories", sortOrder: 4, isPublished: true },
];

const seedServices = [
  { title: "Wedding Décor", description: "From ceremony backdrops to reception tables, we style the whole love story.", iconKey: "mic", sortOrder: 1, isPublished: true },
  { title: "Birthday Décor", description: "Beautiful balloons, cake tables, and cheerful details made for your moment.", iconKey: "camera", sortOrder: 2, isPublished: true },
  { title: "Graduation Décor", description: "Blue-forward photo corners and party styling for every proud achievement.", iconKey: "calendar", sortOrder: 3, isPublished: true },
  { title: "Baby Shower Décor", description: "Soft, joyful styling for a beautiful welcome and a room full of love.", iconKey: "radio", sortOrder: 4, isPublished: true },
];

const seedEvents = [
  { title: "Make the moment worth remembering.", description: defaultSettings.eventBody, imageUrl: "/images/blue-decore/graduations.jpg", ctaLabel: defaultSettings.eventCtaLabel, ctaTarget: "#contact", sortOrder: 1, isPublished: true },
];

const seedJournal = [
  { title: "A celebration starts with a feeling", category: "Studio note", dateLabel: "Blue Decor / 01", sortOrder: 1, isPublished: true },
  { title: "The little details guests remember", category: "Ideas", dateLabel: "Blue Decor / 02", sortOrder: 2, isPublished: true },
  { title: "Making room for your people", category: "Planning", dateLabel: "Blue Decor / 03", sortOrder: 3, isPublished: true },
];

let seeded = false;
let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seeded) return;
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const firestore = await db();
    const settingsRef = firestore.collection(COLLECTIONS.settings).doc("default");
    const settingsSnap = await settingsRef.get();
    if (!settingsSnap.exists) {
      await settingsRef.set(toStore({ ...defaultSettings, updatedAt: new Date() }) as FirestoreRecord);
    }
    if ((await firestore.collection(COLLECTIONS.programs).get()).size === 0) {
      for (const row of seedPrograms) await createDoc("programs", row as FirestoreRecord);
    }
    if ((await firestore.collection(COLLECTIONS.services).get()).size === 0) {
      for (const row of seedServices) await createDoc("services", row as FirestoreRecord);
    }
    if ((await firestore.collection(COLLECTIONS.events).get()).size === 0) {
      for (const row of seedEvents) await createDoc("events", row as FirestoreRecord);
    }
    if ((await firestore.collection(COLLECTIONS.journal).get()).size === 0) {
      for (const row of seedJournal) await createDoc("journal", row as FirestoreRecord);
    }
    seeded = true;
  })();
  return seedPromise;
}

export { FieldValue, Timestamp };