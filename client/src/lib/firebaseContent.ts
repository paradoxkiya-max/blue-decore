// Direct Firebase Firestore client operations for Blue Decor.
// Reads and writes content directly to Firestore using Firebase Web SDK,
// eliminating the need for Vercel serverless REST functions.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import { firebaseDb } from "./firebase";

export const defaultSettings = {
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
};

export const defaultPrograms = [
  { id: 1, title: "Wedding Moments", subtitle: "Ceremony + reception", description: "Romantic blue-and-ivory styling, floral moments, and a beautiful setting for your yes.", tag: "Weddings", imageUrl: "/images/blue-decore/weddings.jpg", featureTitle: "A day worth remembering", featureSubtitle: "Blue, soft, and entirely yours", sortOrder: 1, isPublished: true },
  { id: 2, title: "Birthday Joy", subtitle: "Milestones + surprises", description: "Playful, polished décor that makes every age and every guest feel celebrated.", tag: "Birthdays", imageUrl: "/images/blue-decore/birthdays.jpg", featureTitle: "Make a little more magic", featureSubtitle: "Bright details for the big day", sortOrder: 2, isPublished: true },
  { id: 3, title: "Graduate Glow", subtitle: "Photo moments + parties", description: "A proud, photo-ready celebration for the next chapter, styled in confident blue.", tag: "Graduations", imageUrl: "/images/blue-decore/graduations.jpg", featureTitle: "Celebrate the next chapter", featureSubtitle: "A setting made for proud photos", sortOrder: 3, isPublished: true },
  { id: 4, title: "Baby Showers", subtitle: "Sweet beginnings", description: "Gentle, joyful styling for welcoming a new little love and gathering your people.", tag: "Baby showers", imageUrl: "/images/blue-decore/baby-showers.jpg", featureTitle: "The sweetest beginning", featureSubtitle: "Soft details, warm memories", sortOrder: 4, isPublished: true },
];

export const defaultServices = [
  { id: 1, title: "Wedding Décor", description: "From ceremony backdrops to reception tables, we style the whole love story.", iconKey: "mic", sortOrder: 1, isPublished: true },
  { id: 2, title: "Birthday Décor", description: "Beautiful balloons, cake tables, and cheerful details made for your moment.", iconKey: "camera", sortOrder: 2, isPublished: true },
  { id: 3, title: "Graduation Décor", description: "Blue-forward photo corners and party styling for every proud achievement.", iconKey: "calendar", sortOrder: 3, isPublished: true },
  { id: 4, title: "Baby Shower Décor", description: "Soft, joyful styling for a beautiful welcome and a room full of love.", iconKey: "radio", sortOrder: 4, isPublished: true },
];

export const defaultEvents = [
  { id: 1, title: "Make the moment worth remembering.", description: defaultSettings.eventBody, imageUrl: "/images/blue-decore/graduations.jpg", ctaLabel: defaultSettings.eventCtaLabel, ctaTarget: "#contact", sortOrder: 1, isPublished: true },
];

export const defaultJournal = [
  { id: 1, title: "A celebration starts with a feeling", category: "Studio note", dateLabel: "Blue Decor / 01", sortOrder: 1, isPublished: true },
  { id: 2, title: "The little details guests remember", category: "Ideas", dateLabel: "Blue Decor / 02", sortOrder: 2, isPublished: true },
  { id: 3, title: "Making room for your people", category: "Planning", dateLabel: "Blue Decor / 03", sortOrder: 3, isPublished: true },
];

const COLLECTIONS = {
  settings: "siteSettings",
  programs: "programs",
  services: "services",
  events: "events",
  journal: "journalEntries",
  media: "mediaAssets",
  inquiries: "inquiries",
};

// Seed Firestore if empty
let seedChecked = false;
export async function ensureFirestoreSeeded(): Promise<void> {
  if (seedChecked) return;
  seedChecked = true;
  try {
    const settingsDoc = await getDoc(doc(firebaseDb, COLLECTIONS.settings, "1"));
    if (!settingsDoc.exists()) {
      const batch = writeBatch(firebaseDb);
      batch.set(doc(firebaseDb, COLLECTIONS.settings, "1"), defaultSettings);
      defaultPrograms.forEach((p) => batch.set(doc(firebaseDb, COLLECTIONS.programs, String(p.id)), p));
      defaultServices.forEach((s) => batch.set(doc(firebaseDb, COLLECTIONS.services, String(s.id)), s));
      defaultEvents.forEach((e) => batch.set(doc(firebaseDb, COLLECTIONS.events, String(e.id)), e));
      defaultJournal.forEach((j) => batch.set(doc(firebaseDb, COLLECTIONS.journal, String(j.id)), j));
      await batch.commit();
    }
  } catch (error) {
    console.warn("[Firestore Client] Seeding warning:", error);
  }
}

// ── Public API ──────────────────────────────────────────────────────────

export async function getPublicContent() {
  await ensureFirestoreSeeded();
  try {
    const settingsDoc = await getDoc(doc(firebaseDb, COLLECTIONS.settings, "1"));
    const settings = settingsDoc.exists() ? { ...defaultSettings, ...settingsDoc.data() } : defaultSettings;

    const fetchCollection = async (collName: string, defaults: any[]) => {
      try {
        const snap = await getDocs(collection(firebaseDb, collName));
        if (snap.empty) return defaults;
        return snap.docs
          .map((d) => ({ id: Number(d.id), ...d.data() }))
          .filter((item: any) => item.isPublished !== false)
          .sort((a: any, b: any) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
      } catch {
        return defaults;
      }
    };

    return {
      settings,
      programs: await fetchCollection(COLLECTIONS.programs, defaultPrograms),
      services: await fetchCollection(COLLECTIONS.services, defaultServices),
      events: await fetchCollection(COLLECTIONS.events, defaultEvents),
      journalEntries: await fetchCollection(COLLECTIONS.journal, defaultJournal),
    };
  } catch {
    return {
      settings: defaultSettings,
      programs: defaultPrograms,
      services: defaultServices,
      events: defaultEvents,
      journalEntries: defaultJournal,
    };
  }
}

export async function submitInquiry(input: { name: string; email: string; brief: string }) {
  const id = Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 900) + 100;
  const docRef = doc(firebaseDb, COLLECTIONS.inquiries, String(id));
  await setDoc(docRef, {
    id,
    ...input,
    status: "new",
    createdAt: new Date().toISOString(),
  });
  return { id, success: true };
}

// ── Admin API ───────────────────────────────────────────────────────────

export async function getSettings() {
  await ensureFirestoreSeeded();
  try {
    const docRef = await getDoc(doc(firebaseDb, COLLECTIONS.settings, "1"));
    if (docRef.exists()) {
      return { ...defaultSettings, ...docRef.data() };
    }
  } catch (err) {
    console.warn("[Firestore] getSettings fallback:", err);
  }
  return defaultSettings;
}

export async function updateSettings(values: Record<string, any>) {
  await setDoc(doc(firebaseDb, COLLECTIONS.settings, "1"), { id: 1, ...values, updatedAt: new Date().toISOString() }, { merge: true });
  return { success: true };
}

export async function listCollection(collName: string, defaults: any[] = []): Promise<any[]> {
  await ensureFirestoreSeeded();
  try {
    const snap = await getDocs(collection(firebaseDb, collName));
    if (snap.empty) return defaults;
    return snap.docs
      .map((d) => ({ id: Number(d.data().id ?? d.id), ...d.data() }))
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
  } catch (err) {
    console.warn(`[Firestore] listCollection ${collName} fallback:`, err);
    return defaults;
  }
}

export async function createCollectionItem(collName: string, values: Record<string, any>) {
  const id = Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 900) + 100;
  await setDoc(doc(firebaseDb, collName, String(id)), {
    id,
    ...values,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return { id, success: true };
}

export async function updateCollectionItem(collName: string, id: number, values: Record<string, any>) {
  const numId = Number(id);
  // Try direct doc ID first
  const docRef = doc(firebaseDb, collName, String(numId));
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    await setDoc(docRef, { ...values, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  }
  // Query by id field
  const qSnap = await getDocs(query(collection(firebaseDb, collName), where("id", "==", numId)));
  if (!qSnap.empty) {
    await setDoc(qSnap.docs[0].ref, { ...values, updatedAt: new Date().toISOString() }, { merge: true });
    return { success: true };
  }
  // Create if missing
  await setDoc(docRef, { id: numId, ...values, updatedAt: new Date().toISOString() }, { merge: true });
  return { success: true };
}

export async function deleteCollectionItem(collName: string, id: number) {
  const numId = Number(id);
  const docRef = doc(firebaseDb, collName, String(numId));
  await deleteDoc(docRef);
  const qSnap = await getDocs(query(collection(firebaseDb, collName), where("id", "==", numId)));
  if (!qSnap.empty) {
    await deleteDoc(qSnap.docs[0].ref);
  }
  return { success: true };
}

export async function getDashboardSummary() {
  await ensureFirestoreSeeded();
  try {
    const fetchStats = async (collName: string, defaults: any[]) => {
      const rows = await listCollection(collName, defaults);
      return {
        total: rows.length,
        published: rows.filter((r) => r.isPublished !== false).length,
        drafts: rows.filter((r) => r.isPublished === false).length,
      };
    };
    const inquiries = await listCollection(COLLECTIONS.inquiries, []);
    return {
      programs: await fetchStats(COLLECTIONS.programs, defaultPrograms),
      services: await fetchStats(COLLECTIONS.services, defaultServices),
      events: await fetchStats(COLLECTIONS.events, defaultEvents),
      journal: await fetchStats(COLLECTIONS.journal, defaultJournal),
      recentInquiries: inquiries.slice(0, 5),
      newInquiries: inquiries.filter((i) => i.status === "new").length,
    };
  } catch {
    const fallbackStats = { total: 4, published: 4, drafts: 0 };
    return {
      programs: fallbackStats,
      services: fallbackStats,
      events: { total: 1, published: 1, drafts: 0 },
      journal: { total: 3, published: 3, drafts: 0 },
      recentInquiries: [],
      newInquiries: 0,
    };
  }
}
