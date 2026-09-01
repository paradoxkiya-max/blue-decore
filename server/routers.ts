// Broadcast Atelier direction: public read APIs are quiet and dependable, while administrator procedures put every Kasha signal under intentional editorial control.
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { events, inquiries, journalEntries, mediaAssets, programs, services, siteSettings } from "../drizzle/schema";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { dashboardSummary, ensureContentSeeded, publicContent, requireDb } from "./db";
import { normalizeImageSource, requireGoogleDriveImage } from "./googleDriveImages";

const idInput = z.object({ id: z.number().int().positive() });
const publishedInput = z.object({ id: z.number().int().positive(), isPublished: z.boolean() });
const orderInput = z.object({ id: z.number().int().positive(), sortOrder: z.number().int().min(0) });
const optionalUrl = z.string().url().or(z.literal(""));

const settingsInput = z.object({
  siteName: z.string().min(1).max(160), brandLine: z.string().min(1).max(160), heroEyebrow: z.string().min(1).max(220), heroTitle: z.string().min(1).max(240), heroAccent: z.string().min(1).max(240), heroIntro: z.string().min(1), heroCtaLabel: z.string().min(1).max(120), heroImageUrl: z.string().min(1), heroAsideTitle: z.string().min(1).max(240), heroAsideBody: z.string().min(1), heroFooterIndex: z.string().min(1).max(80), heroFooterDescriptor: z.string().min(1).max(240), tickerItems: z.string().min(1),
  aboutRailLabel: z.string().min(1).max(160), aboutEyebrow: z.string().min(1).max(220), aboutTitle: z.string().min(1).max(240), aboutAccent: z.string().min(1).max(240), aboutBody: z.string().min(1), aboutQuote: z.string().min(1), aboutImageUrl: z.string().min(1), aboutCaptionLeft: z.string().min(1).max(240), aboutCaptionRight: z.string().min(1).max(240),
  programsRailLabel: z.string().min(1).max(160), programsEyebrow: z.string().min(1).max(220), programsTitle: z.string().min(1).max(240), programsAccent: z.string().min(1).max(240), programsSummary: z.string().min(1), audioImageLabel: z.string().min(1).max(160), audioCaptionLabel: z.string().min(1).max(160),
  servicesRailLabel: z.string().min(1).max(160), servicesEyebrow: z.string().min(1).max(220), servicesTitle: z.string().min(1).max(240), servicesAccent: z.string().min(1).max(240), servicesSummary: z.string().min(1),
  eventEyebrow: z.string().min(1).max(220), eventTitle: z.string().min(1).max(240), eventAccent: z.string().min(1).max(240), eventBody: z.string().min(1), eventCtaLabel: z.string().min(1).max(120), eventImageUrl: z.string().min(1), eventImageLabel: z.string().min(1).max(200),
  journalRailLabel: z.string().min(1).max(160), journalEyebrow: z.string().min(1).max(220), journalTitle: z.string().min(1).max(240), journalAccent: z.string().min(1).max(240),
  contactRailLabel: z.string().min(1).max(160), contactEyebrow: z.string().min(1).max(220), contactTitle: z.string().min(1).max(240), contactAccent: z.string().min(1).max(240), contactBody: z.string().min(1), contactEmail: z.string().email(), contactLocation: z.string().min(1).max(320), footerNavigateLabel: z.string().min(1).max(120), footerFollowLabel: z.string().min(1).max(160), footerBuiltLine: z.string().min(1).max(240), instagramUrl: optionalUrl, youtubeUrl: optionalUrl, facebookUrl: optionalUrl,
});

const programInput = z.object({ title: z.string().min(1).max(180), subtitle: z.string().min(1).max(180), description: z.string().min(1), tag: z.string().min(1).max(120), imageUrl: z.string().nullable().optional(), featureTitle: z.string().nullable().optional(), featureSubtitle: z.string().nullable().optional(), sortOrder: z.number().int().min(0).default(0), isPublished: z.boolean().default(true) });
const serviceInput = z.object({ title: z.string().min(1).max(180), description: z.string().min(1), iconKey: z.enum(["mic", "camera", "calendar", "radio", "sparkles", "film"]).default("mic"), sortOrder: z.number().int().min(0).default(0), isPublished: z.boolean().default(true) });
const eventInput = z.object({ title: z.string().min(1).max(220), description: z.string().min(1), imageUrl: z.string().min(1), ctaLabel: z.string().min(1).max(120), ctaTarget: z.string().min(1).max(240), sortOrder: z.number().int().min(0).default(0), isPublished: z.boolean().default(true) });
const journalInput = z.object({ title: z.string().min(1).max(260), category: z.string().min(1).max(100), dateLabel: z.string().min(1).max(120), body: z.string().nullable().optional(), sortOrder: z.number().int().min(0).default(0), isPublished: z.boolean().default(true) });

function createCrudRouter(table: any, input: any) {
  return router({
    list: adminProcedure.query(async () => { await ensureContentSeeded(); const db = await requireDb(); return db.select().from(table).orderBy(asc(table.sortOrder)); }),
    create: adminProcedure.input(input).mutation(async ({ input: rawValues }) => { const values = rawValues as Record<string, unknown>; const imageUrl = typeof values.imageUrl === "string" && values.imageUrl ? await normalizeImageSource(values.imageUrl) : values.imageUrl; const db = await requireDb(); const [result] = await db.insert(table).values({ ...values, imageUrl } as any).$returningId(); return { id: result.id }; }),
    update: adminProcedure.input(idInput.merge(input.partial())).mutation(async ({ input: rawValues }) => { const values = rawValues as Record<string, unknown>; const { id, ...updates } = values; const imageUrl = typeof updates.imageUrl === "string" && updates.imageUrl ? await normalizeImageSource(updates.imageUrl) : updates.imageUrl; const db = await requireDb(); await db.update(table).set({ ...updates, imageUrl } as any).where(eq(table.id, id as number)); return { success: true }; }),
    setPublished: adminProcedure.input(publishedInput).mutation(async ({ input }) => { const db = await requireDb(); await db.update(table).set({ isPublished: input.isPublished }).where(eq(table.id, input.id)); return { success: true }; }),
    setOrder: adminProcedure.input(orderInput).mutation(async ({ input }) => { const db = await requireDb(); await db.update(table).set({ sortOrder: input.sortOrder }).where(eq(table.id, input.id)); return { success: true }; }),
    remove: adminProcedure.input(idInput).mutation(async ({ input }) => { const db = await requireDb(); await db.delete(table).where(eq(table.id, input.id)); return { success: true }; }),
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { (ctx.res as unknown as { setHeader: (name: string, value: string) => void }).setHeader("Set-Cookie", `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=None; Secure`); return { success: true } as const; }),
  }),
  public: router({
    homepage: publicProcedure.query(() => publicContent()),
    submitInquiry: publicProcedure.input(z.object({ name: z.string().min(2).max(180), email: z.string().email(), brief: z.string().min(8).max(4000) })).mutation(async ({ input }) => { const db = await requireDb(); const [result] = await db.insert(inquiries).values(input).$returningId(); return { id: result.id, success: true }; }),
  }),
  admin: router({
    dashboard: adminProcedure.query(() => dashboardSummary()),
    settings: router({
      get: adminProcedure.query(async () => { await ensureContentSeeded(); const db = await requireDb(); const [settings] = await db.select().from(siteSettings).limit(1); return settings; }),
      update: adminProcedure.input(settingsInput).mutation(async ({ input }) => { const db = await requireDb(); await db.update(siteSettings).set({ ...input, heroImageUrl: await normalizeImageSource(input.heroImageUrl), aboutImageUrl: await normalizeImageSource(input.aboutImageUrl), eventImageUrl: await normalizeImageSource(input.eventImageUrl) }).where(eq(siteSettings.id, 1)); return { success: true }; }),
    }),
    programs: createCrudRouter(programs, programInput),
    services: createCrudRouter(services, serviceInput),
    events: createCrudRouter(events, eventInput),
    journal: createCrudRouter(journalEntries, journalInput),
    inquiries: router({
      list: adminProcedure.query(async () => { const db = await requireDb(); return db.select().from(inquiries).orderBy(desc(inquiries.createdAt)); }),
      updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "read", "replied", "archived"]) })).mutation(async ({ input }) => { const db = await requireDb(); await db.update(inquiries).set({ status: input.status }).where(eq(inquiries.id, input.id)); return { success: true }; }),
      remove: adminProcedure.input(idInput).mutation(async ({ input }) => { const db = await requireDb(); await db.delete(inquiries).where(eq(inquiries.id, input.id)); return { success: true }; }),
    }),
    media: router({
      list: adminProcedure.query(async () => { const db = await requireDb(); return db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)); }),
      connectDrive: adminProcedure.input(z.object({ fileName: z.string().min(1).max(255), altText: z.string().min(1).max(320), category: z.string().min(1).max(100), driveLink: z.string().url() })).mutation(async ({ input }) => {
        const driveImage = await requireGoogleDriveImage(input.driveLink);
        const db = await requireDb();
        const [result] = await db.insert(mediaAssets).values({ fileName: input.fileName, storageKey: `google-drive:${driveImage.fileId}`, url: driveImage.url, altText: input.altText, category: input.category }).$returningId();
        return { id: result.id, ...driveImage };
      }),
      remove: adminProcedure.input(idInput).mutation(async ({ input }) => { const db = await requireDb(); await db.delete(mediaAssets).where(eq(mediaAssets.id, input.id)); return { success: true }; }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
