// Broadcast Atelier direction: these data helpers preserve editorial order and publishing control while making every public Kasha section manageable from one desk.
import { asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  events,
  inquiries,
  journalEntries,
  mediaAssets,
  programs,
  services,
  siteSettings,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { getFirebaseFirestore } from "./firebaseAdmin";
import type { DocumentSnapshot } from "firebase-admin/firestore";

let database: ReturnType<typeof drizzle> | null = null;
let seedPromise: Promise<void> | null = null;

const asset = {
  hero: "/manus-storage/kasha-hero_1ba6a444.jpg",
  culture: "/manus-storage/kasha-culture_d54ac47e.jpg",
  audio: "/manus-storage/kasha-audio_bdbb9064.jpg",
  event: "/manus-storage/kasha-event_aa68d261.jpg",
};

const defaultSettings = {
  id: 1,
  siteName: "Kasha",
  brandLine: "Multimedia",
  heroEyebrow: "On air / Addis Ababa",
  heroTitle: "Stories with a pulse.",
  heroAccent: "Places with a memory.",
  heroIntro: "Kasha Multimedia connects radio, documentary, culture, and events to make room for the voices that move Ethiopia forward.",
  heroCtaLabel: "Find your frequency",
  heroImageUrl: asset.hero,
  heroAsideTitle: "Every Sunday for two hours.",
  heroAsideBody: "A live conversation with the country's stories, ideas, and inherited ways of knowing.",
  heroFooterIndex: "01 / 06",
  heroFooterDescriptor: "Radio + online media + event promotion",
  tickerItems: "Broadcast|Documentary|Cultural memory|Open conversation|Events",
  aboutEyebrow: "A programme, a platform, a point of view",
  aboutRailLabel: "About the signal",
  aboutTitle: "We go closer to the country's",
  aboutAccent: "living archive.",
  aboutBody: "Kasha began as a weekly radio programme built to inform, teach, compare, and delight. Today, it is a multimedia practice for the stories that deserve a wider room: indigenous knowledge, cultural value, natural memory, and the people carrying all of it into tomorrow.",
  aboutQuote: "To understand where we are going, we listen for what the land and its people already know.",
  aboutImageUrl: asset.culture,
  aboutCaptionLeft: "Field recording / Addis Ababa",
  aboutCaptionRight: "03° 28' N / 38° 44' E",
  programsEyebrow: "A frequency for every kind of curiosity",
  programsRailLabel: "Programmes",
  programsTitle: "One signal.",
  programsAccent: "Many ways in.",
  programsSummary: "Ten programme ideas. One shared intention: entertain while making space for deeper thought, better questions, and the stories that rarely get the first microphone.",
  audioImageLabel: "Listen / 00:48",
  audioCaptionLabel: "Latest signal",
  servicesEyebrow: "From the first note to the full room",
  servicesRailLabel: "What we make",
  servicesTitle: "Built for stories",
  servicesAccent: "that travel.",
  servicesSummary: "Kasha brings an editorial eye and a production hand to every format. The medium changes; the care does not.",
  eventEyebrow: "A room for the next story",
  eventTitle: "Make the moment",
  eventAccent: "worth remembering.",
  eventBody: "From a cultural gathering to a public conversation, we help events find their voice before the doors open and keep it moving after the lights go down.",
  eventCtaLabel: "Talk event production",
  eventImageUrl: asset.event,
  eventImageLabel: "Event promotion / Open room",
  journalEyebrow: "Notes from the desk",
  journalRailLabel: "Journal / field notes",
  journalTitle: "Keep the signal",
  journalAccent: "in the room.",
  contactEyebrow: "Bring us the story",
  contactRailLabel: "Start a conversation",
  contactTitle: "What should",
  contactAccent: "we listen to?",
  contactBody: "Tell us what is on your mind, what you are building, or whose voice needs a better signal. We will take it from there.",
  contactEmail: "hello@kashamultimedia.et",
  contactLocation: "Addis Ababa, Ethiopia",
  instagramUrl: "https://instagram.com",
  youtubeUrl: "https://youtube.com",
  facebookUrl: "https://facebook.com",
  footerNavigateLabel: "Navigate",
  footerFollowLabel: "Follow the signal",
  footerBuiltLine: "Built in Addis Ababa / Made to travel",
} as const;

export async function getDb() {
  if (!database && process.env.DATABASE_URL) database = drizzle(process.env.DATABASE_URL);
  return database;
}

export async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db;
}

export async function ensureContentSeeded() {
  if (seedPromise) return seedPromise;
  seedPromise = (async () => {
    const db = await requireDb();
    const existingSettings = await db.select({ id: siteSettings.id }).from(siteSettings).limit(1);
    if (!existingSettings.length) await db.insert(siteSettings).values(defaultSettings);

    const existingPrograms = await db.select({ id: programs.id }).from(programs).limit(1);
    if (!existingPrograms.length) await db.insert(programs).values([
      { title: "Yisatefu", subtitle: "Participate", description: "A question-led hour that makes room for the whole room.", tag: "Interactive radio", imageUrl: asset.audio, featureTitle: "How does a place become a memory?", featureSubtitle: "Minat Gujo / Episode 04", sortOrder: 1 },
      { title: "Zikre Bahil", subtitle: "Cultural memory", description: "People, practices, and places remembered in their own register.", tag: "Field notes", imageUrl: asset.culture, sortOrder: 2 },
      { title: "Enchewawe", subtitle: "Let's talk", description: "A lively conversation around what shaped yesterday and what comes next.", tag: "Conversation", sortOrder: 3 },
      { title: "Minat Gujo", subtitle: "A journey of imagination", description: "Research-led stories that take a closer look at Ethiopia's hidden rooms.", tag: "Documentary", sortOrder: 4 },
    ]);

    const existingServices = await db.select({ id: services.id }).from(services).limit(1);
    if (!existingServices.length) await db.insert(services).values([
      { title: "Radio + online production", description: "From a clear editorial premise to a broadcast-ready series, we shape stories for ears, screens, and shared time.", iconKey: "mic", sortOrder: 1 },
      { title: "Documentary fieldwork", description: "We record living knowledge with curiosity, research, and respect for the people who carry it forward.", iconKey: "camera", sortOrder: 2 },
      { title: "Event promotion", description: "We turn a gathering into a considered public moment: concept, story, audience, and the details in between.", iconKey: "calendar", sortOrder: 3 },
      { title: "Broadcast partnerships", description: "Flexible collaboration for stations, institutions, and teams that want a sharper cultural signal.", iconKey: "radio", sortOrder: 4 },
    ]);

    const existingEvents = await db.select({ id: events.id }).from(events).limit(1);
    if (!existingEvents.length) await db.insert(events).values({ title: "Make the moment worth remembering.", description: defaultSettings.eventBody, imageUrl: asset.event, ctaLabel: defaultSettings.eventCtaLabel, ctaTarget: "#contact", sortOrder: 1 });

    const existingJournal = await db.select({ id: journalEntries.id }).from(journalEntries).limit(1);
    if (!existingJournal.length) await db.insert(journalEntries).values([
      { title: "The knowledge that grows beside the forest", category: "Conversation", dateLabel: "Field note / 07", sortOrder: 1 },
      { title: "When a place becomes a story you can hear", category: "Audio essay", dateLabel: "Programme / 04", sortOrder: 2 },
      { title: "Making space for many ways of knowing", category: "Event", dateLabel: "Open room / 02", sortOrder: 3 },
    ]);
  })();
  return seedPromise;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await requireDb();
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function publicContent() {
  if (!ENV.databaseUrl) {
    return {
      settings: defaultSettings,
      programs: [],
      services: [],
      events: [],
      journalEntries: [
        { id: 1, title: "A celebration starts with a feeling", category: "Studio note", dateLabel: "Blue Decor / 01", body: null, sortOrder: 1, isPublished: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, title: "The little details guests remember", category: "Ideas", dateLabel: "Blue Decor / 02", body: null, sortOrder: 2, isPublished: true, createdAt: new Date(), updatedAt: new Date() },
        { id: 3, title: "Making room for your people", category: "Planning", dateLabel: "Blue Decor / 03", body: null, sortOrder: 3, isPublished: true, createdAt: new Date(), updatedAt: new Date() },
      ],
    };
  }
  await ensureContentSeeded();
  const db = await requireDb();
  const [settings] = await db.select().from(siteSettings).limit(1);
  const [programRows, serviceRows, eventRows, journalRows] = await Promise.all([
    db.select().from(programs).where(eq(programs.isPublished, true)).orderBy(asc(programs.sortOrder)),
    db.select().from(services).where(eq(services.isPublished, true)).orderBy(asc(services.sortOrder)),
    db.select().from(events).where(eq(events.isPublished, true)).orderBy(asc(events.sortOrder)),
    db.select().from(journalEntries).where(eq(journalEntries.isPublished, true)).orderBy(asc(journalEntries.sortOrder)),
  ]);
  return { settings, programs: programRows, services: serviceRows, events: eventRows, journalEntries: journalRows };
}

export async function dashboardSummary() {
  await ensureContentSeeded();
  const db = await requireDb();
  const [programRows, serviceRows, eventRows, journalRows, inquiryRows] = await Promise.all([
    db.select({ id: programs.id, isPublished: programs.isPublished }).from(programs),
    db.select({ id: services.id, isPublished: services.isPublished }).from(services),
    db.select({ id: events.id, isPublished: events.isPublished }).from(events),
    db.select({ id: journalEntries.id, isPublished: journalEntries.isPublished }).from(journalEntries),
    db.select({ id: inquiries.id, name: inquiries.name, email: inquiries.email, brief: inquiries.brief, status: inquiries.status, createdAt: inquiries.createdAt }).from(inquiries).orderBy(desc(inquiries.createdAt)).limit(5),
  ]);
  const withStats = (rows: { isPublished: boolean }[]) => ({ total: rows.length, published: rows.filter((item) => item.isPublished).length, drafts: rows.filter((item) => !item.isPublished).length });
  return { programs: withStats(programRows), services: withStats(serviceRows), events: withStats(eventRows), journal: withStats(journalRows), recentInquiries: inquiryRows, newInquiries: inquiryRows.filter((entry) => entry.status === "new").length };
}

export const contentTables = { programs, services, events, journalEntries, mediaAssets, inquiries, siteSettings };

// Firebase is the sole runtime content store for the deployed demo. SQL migrations remain only as historical files.
export const firestoreEnabled = () => true;

function firestoreCollection(name: string) {
  return getFirebaseFirestore().collection(name);
}

function firestoreRow<T extends Record<string, any>>(snapshot: DocumentSnapshot, fallbackId?: number): T {
  const value = snapshot.data() ?? {};
  return { id: Number(value.id ?? fallbackId ?? snapshot.id), ...value } as unknown as T;
}

const firestoreCollections = { settings: "siteSettings", programs: "programs", services: "services", events: "events", journal: "journalEntries", media: "mediaAssets", inquiries: "inquiries" };

async function firestoreHasContent() {
  const snapshot = await firestoreCollection(firestoreCollections.settings).limit(1).get();
  return !snapshot.empty;
}

export async function ensureFirestoreContentSeeded() {
  if (!firestoreEnabled() || await firestoreHasContent()) return;
  const db = getFirebaseFirestore();
  const batch = db.batch();
  batch.set(firestoreCollection(firestoreCollections.settings).doc("1"), defaultSettings);
  const seed = [
    { title: "Wedding Moments", subtitle: "Ceremony + reception", description: "Romantic blue-and-ivory styling, floral moments, and a beautiful setting for your yes.", tag: "Weddings", imageUrl: "/images/blue-decore/weddings.jpg", featureTitle: "A day worth remembering", featureSubtitle: "Blue, soft, and entirely yours", sortOrder: 1, isPublished: true },
    { title: "Birthday Joy", subtitle: "Milestones + surprises", description: "Playful, polished décor that makes every age and every guest feel celebrated.", tag: "Birthdays", imageUrl: "/images/blue-decore/birthdays.jpg", featureTitle: "Make a little more magic", featureSubtitle: "Bright details for the big day", sortOrder: 2, isPublished: true },
    { title: "Graduate Glow", subtitle: "Photo moments + parties", description: "A proud, photo-ready celebration for the next chapter, styled in confident blue.", tag: "Graduations", imageUrl: "/images/blue-decore/graduations.jpg", featureTitle: "Celebrate the next chapter", featureSubtitle: "A setting made for proud photos", sortOrder: 3, isPublished: true },
    { title: "Baby Showers", subtitle: "Sweet beginnings", description: "Gentle, joyful styling for welcoming a new little love and gathering your people.", tag: "Baby showers", imageUrl: "/images/blue-decore/baby-showers.jpg", featureTitle: "The sweetest beginning", featureSubtitle: "Soft details, warm memories", sortOrder: 4, isPublished: true },
  ];
  seed.forEach((item, index) => batch.set(firestoreCollection(firestoreCollections.programs).doc(String(index + 1)), { id: index + 1, ...item }));
  ["Wedding Décor", "Birthday Décor", "Graduation Décor", "Baby Shower Décor"].forEach((title, index) => batch.set(firestoreCollection(firestoreCollections.services).doc(String(index + 1)), { id: index + 1, title, description: "Beautiful, thoughtful styling made for your moment.", iconKey: "sparkles", sortOrder: index + 1, isPublished: true }));
  batch.set(firestoreCollection(firestoreCollections.events).doc("1"), { id: 1, title: defaultSettings.eventTitle, description: defaultSettings.eventBody, imageUrl: defaultSettings.eventImageUrl, ctaLabel: defaultSettings.eventCtaLabel, ctaTarget: "#contact", sortOrder: 1, isPublished: true });
  [{ title: "A celebration starts with a feeling", category: "Studio note", dateLabel: "Blue Decor / 01" }, { title: "The little details guests remember", category: "Ideas", dateLabel: "Blue Decor / 02" }, { title: "Making room for your people", category: "Planning", dateLabel: "Blue Decor / 03" }].forEach((item, index) => batch.set(firestoreCollection(firestoreCollections.journal).doc(String(index + 1)), { id: index + 1, ...item, body: null, sortOrder: index + 1, isPublished: true }));
  await batch.commit();
}

export async function firestoreList(collection: string) {
  await ensureFirestoreContentSeeded();
  const snapshot = await firestoreCollection(collection).get();
  return snapshot.docs.map((doc: DocumentSnapshot) => firestoreRow<Record<string, any>>(doc)).sort((a: Record<string, any>, b: Record<string, any>) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
}

export async function firestoreGetSettings() {
  await ensureFirestoreContentSeeded();
  const doc = await firestoreCollection(firestoreCollections.settings).doc("1").get();
  return firestoreRow(doc, 1);
}

export async function firestoreSaveSettings(values: Record<string, unknown>) {
  await firestoreCollection(firestoreCollections.settings).doc("1").set({ id: 1, ...values, updatedAt: new Date() }, { merge: true });
}

export async function firestoreCreate(collection: string, values: Record<string, unknown>) {
  const ref = firestoreCollection(collection).doc();
  const id = Math.abs(ref.id.split("").reduce((sum: number, char: string) => sum * 31 + char.charCodeAt(0), 7));
  await ref.set({ id, ...values, createdAt: new Date(), updatedAt: new Date() });
  return { id };
}

export async function firestoreUpdate(collection: string, id: number, values: Record<string, unknown>) {
  const snapshot = await firestoreCollection(collection).where("id", "==", id).limit(1).get();
  if (snapshot.empty) throw new Error("Content item was not found");
  await snapshot.docs[0]!.ref.set({ ...values, updatedAt: new Date() }, { merge: true });
}

export async function firestoreDelete(collection: string, id: number) {
  const snapshot = await firestoreCollection(collection).where("id", "==", id).limit(1).get();
  if (!snapshot.empty) await snapshot.docs[0]!.ref.delete();
}

export async function firestorePublicContent() {
  const settings = await firestoreGetSettings();
  const published = async (collection: string) => (await firestoreList(collection)).filter((row: Record<string, any>) => row.isPublished !== false);
  return { settings, programs: await published(firestoreCollections.programs), services: await published(firestoreCollections.services), events: await published(firestoreCollections.events), journalEntries: await published(firestoreCollections.journal) };
}

export async function firestoreDashboardSummary() {
  const stats = async (collection: string) => { const rows = await firestoreList(collection); return { total: rows.length, published: rows.filter((row: Record<string, any>) => row.isPublished !== false).length, drafts: rows.filter((row: Record<string, any>) => row.isPublished === false).length }; };
  const inquiryRows = await firestoreList(firestoreCollections.inquiries);
  return { programs: await stats(firestoreCollections.programs), services: await stats(firestoreCollections.services), events: await stats(firestoreCollections.events), journal: await stats(firestoreCollections.journal), recentInquiries: inquiryRows.slice(0, 5), newInquiries: inquiryRows.filter((row: Record<string, any>) => row.status === "new").length };
}
