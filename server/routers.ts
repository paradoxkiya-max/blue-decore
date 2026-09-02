// Broadcast Atelier direction: public read APIs are quiet and dependable, while administrator procedures put every Kasha signal under intentional editorial control.
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { firestoreCreate, firestoreDashboardSummary, firestoreDelete, firestoreGetSettings, firestoreList, firestorePublicContent, firestoreSaveSettings, firestoreUpdate } from "./db";
import { normalizeImageSource, requireGoogleDriveImage } from "./googleDriveImages";

const idInput = z.object({ id: z.number() });
const publishedInput = z.object({ id: z.number(), isPublished: z.boolean() });
const orderInput = z.object({ id: z.number(), sortOrder: z.number().int().min(0) });
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
const serviceInput = z.object({ title: z.string().min(1).max(180), description: z.string().min(1), iconKey: z.enum(["mic", "camera", "calendar", "radio", "sparkles", "film"]).default("mic"), imageUrl: z.string().url().or(z.literal("")).nullable().optional(), sortOrder: z.number().int().min(0).default(0), isPublished: z.boolean().default(true) });
const eventInput = z.object({ title: z.string().min(1).max(220), description: z.string().min(1), imageUrl: z.string().min(1), ctaLabel: z.string().min(1).max(120), ctaTarget: z.string().min(1).max(240), sortOrder: z.number().int().min(0).default(0), isPublished: z.boolean().default(true) });
const journalInput = z.object({ title: z.string().min(1).max(260), category: z.string().min(1).max(100), dateLabel: z.string().min(1).max(120), body: z.string().nullable().optional(), sortOrder: z.number().int().min(0).default(0), isPublished: z.boolean().default(true) });

function createCrudRouter(input: any, collection: string) {
  return router({
    list: adminProcedure.query(() => firestoreList(collection)),
    create: adminProcedure.input(input).mutation(async ({ input: values }) => {
      const raw = values as Record<string, unknown>;
      const imageUrl = typeof raw.imageUrl === "string" && raw.imageUrl ? await normalizeImageSource(raw.imageUrl) : raw.imageUrl;
      return firestoreCreate(collection, { ...raw, imageUrl });
    }),
    update: adminProcedure.input(idInput.merge(input.partial())).mutation(async ({ input: values }) => {
      const raw = values as Record<string, unknown>;
      const { id, ...updates } = raw;
      const imageUrl = typeof updates.imageUrl === "string" && updates.imageUrl ? await normalizeImageSource(updates.imageUrl) : updates.imageUrl;
      await firestoreUpdate(collection, id as number, { ...updates, imageUrl });
      return { success: true };
    }),
    setPublished: adminProcedure.input(publishedInput).mutation(async ({ input }) => { await firestoreUpdate(collection, input.id, { isPublished: input.isPublished }); return { success: true }; }),
    setOrder: adminProcedure.input(orderInput).mutation(async ({ input }) => { await firestoreUpdate(collection, input.id, { sortOrder: input.sortOrder }); return { success: true }; }),
    remove: adminProcedure.input(idInput).mutation(async ({ input }) => { await firestoreDelete(collection, input.id); return { success: true }; }),
  });
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const response = ctx.res as unknown as { clearCookie?: (name: string, options: Record<string, unknown>) => void; setHeader?: (name: string, value: string) => void }; const options = { ...getSessionCookieOptions(ctx.req), maxAge: -1 }; if (response.clearCookie) response.clearCookie(COOKIE_NAME, options); else response.setHeader?.("Set-Cookie", `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=None; Secure`); return { success: true } as const; }),
  }),
  public: router({
    homepage: publicProcedure.query(() => firestorePublicContent()),
    submitInquiry: publicProcedure.input(z.object({ name: z.string().min(2).max(180), email: z.string().email(), brief: z.string().min(8).max(4000) })).mutation(async ({ input }) => { return { ...(await firestoreCreate("inquiries", { ...input, status: "new" })), success: true }; }),
  }),
  admin: router({
    dashboard: adminProcedure.query(() => firestoreDashboardSummary()),
    settings: router({
      get: adminProcedure.query(async () => firestoreGetSettings()),
      update: adminProcedure.input(settingsInput).mutation(async ({ input }) => { const values = { ...input, heroImageUrl: await normalizeImageSource(input.heroImageUrl), aboutImageUrl: await normalizeImageSource(input.aboutImageUrl), eventImageUrl: await normalizeImageSource(input.eventImageUrl) }; await firestoreSaveSettings(values); return { success: true }; }),
    }),
    programs: createCrudRouter(programInput, "programs"),
    services: createCrudRouter(serviceInput, "services"),
    events: createCrudRouter(eventInput, "events"),
    journal: createCrudRouter(journalInput, "journalEntries"),
    inquiries: router({
      list: adminProcedure.query(async () => firestoreList("inquiries")),
      updateStatus: adminProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(["new", "read", "replied", "archived"]) })).mutation(async ({ input }) => { await firestoreUpdate("inquiries", input.id, { status: input.status }); return { success: true }; }),
      remove: adminProcedure.input(idInput).mutation(async ({ input }) => { await firestoreDelete("inquiries", input.id); return { success: true }; }),
    }),
    media: router({
      list: adminProcedure.query(async () => firestoreList("mediaAssets")),
      connectDrive: adminProcedure.input(z.object({ fileName: z.string().min(1).max(255), altText: z.string().min(1).max(320), category: z.string().min(1).max(100), driveLink: z.string().url() })).mutation(async ({ input }) => {
        const driveImage = await requireGoogleDriveImage(input.driveLink);
        return { ...(await firestoreCreate("mediaAssets", { fileName: input.fileName, storageKey: `google-drive:${driveImage.fileId}`, url: driveImage.url, altText: input.altText, category: input.category })), ...driveImage };
      }),
      uploadDirect: adminProcedure.input(z.object({ fileName: z.string().min(1).max(255), altText: z.string().min(1).max(320), category: z.string().min(1).max(100), fileData: z.string().min(1) })).mutation(async ({ input }) => {
        const url = input.fileData;
        const result = await firestoreCreate("mediaAssets", { fileName: input.fileName, storageKey: `direct-upload:${Date.now()}`, url, altText: input.altText, category: input.category });
        return { ...result, url };
      }),
      update: adminProcedure.input(z.object({
        id: z.number(),
        fileName: z.string().min(1).max(255).optional(),
        altText: z.string().min(1).max(320).optional(),
        category: z.string().min(1).max(100).optional(),
        url: z.string().min(1).optional(),
      })).mutation(async ({ input }) => {
        const { id, ...updates } = input;
        const imageUrl = updates.url ? await normalizeImageSource(updates.url) : undefined;
        await firestoreUpdate("mediaAssets", id, { ...updates, ...(imageUrl ? { url: imageUrl } : {}) });
        return { success: true };
      }),
      remove: adminProcedure.input(idInput).mutation(async ({ input }) => { await firestoreDelete("mediaAssets", input.id); return { success: true }; }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
