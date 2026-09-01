// Broadcast Atelier direction: the Kasha control room is a calm editorial desk—ink, paper, signal red, and clear publishing cues—rather than a generic product dashboard.
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Camera, ChevronRight, CircleDot,
  FileText, Image as ImageIcon, LayoutDashboard, Link2, LogOut, Mail,
  Menu, Mic2, Moon, Newspaper, Plus, Radio, Save, Settings2, Sparkles,
  Sun, Trash2, X,
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";

type SectionKey = "dashboard" | "settings" | "programs" | "services" | "events" | "journal" | "inquiries" | "media";

const navigation: { key: SectionKey; label: string; caption: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Overview", caption: "Desk status", icon: LayoutDashboard },
  { key: "settings", label: "Site direction", caption: "Copy, links & art", icon: Settings2 },
  { key: "programs", label: "Programmes", caption: "Signals & series", icon: Mic2 },
  { key: "services", label: "Services", caption: "What Kasha makes", icon: Sparkles },
  { key: "events", label: "Events", caption: "Public moments", icon: CalendarDays },
  { key: "journal", label: "Journal", caption: "Field notes", icon: Newspaper },
  { key: "inquiries", label: "Inbox", caption: "Messages received", icon: Mail },
  { key: "media", label: "Media desk", caption: "Images & assets", icon: ImageIcon },
];

const mutationError = (subject: string) => (error: { message?: string }) => toast.error(`${subject} could not be saved.`, { description: error.message || "The Kasha desk could not complete that change. Please try again." });

function sectionFromPath(path: string): SectionKey {
  const match = path.match(/^\/admin\/(dashboard|settings|programs|services|events|journal|inquiries|media)$/);
  return (match?.[1] as SectionKey | undefined) ?? "dashboard";
}

function statusLabel(published: boolean) { return published ? "Published" : "Draft"; }
function dateTime(value: Date | string) { return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }

export function AdminDashboard() { return <AdminControlRoom forcedSection="dashboard" />; }
export function AdminContentRoute() { return <AdminControlRoom />; }

export default function AdminControlRoom({ forcedSection }: { forcedSection?: SectionKey }) {
  const [location, setLocation] = useLocation();
  const section = forcedSection ?? sectionFromPath(location);
  const { theme, toggleTheme } = useTheme();
  const { user, loading, logout } = useAuth({ redirectOnUnauthenticated: true, redirectPath: "/admin" });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { if (!loading && user?.role !== "admin") setLocation("/admin"); }, [loading, user?.role, setLocation]);
  const signOut = async () => { await logout(); setLocation("/admin"); };
  if (loading || user?.role !== "admin") return <ControlRoomLoading />;

  const navigate = (key: SectionKey) => { setMobileOpen(false); setLocation(`/admin/${key}`); };
  return (
    <main className="desk-shell">
      <aside className={`desk-sidebar ${mobileOpen ? "is-open" : ""}`} aria-label="Kasha control room navigation">
        <div className="desk-sidebar-head"><a className="desk-brand" href="/"><span className="desk-brand-mark"><Radio size={16} /></span><span><strong>Kasha</strong><small>Control room</small></span></a><button className="desk-mobile-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close control room menu"><X size={18} /></button></div>
        <div className="desk-signal"><span className="live-dot" /> Desk online <small>Private workspace</small></div>
        <nav className="desk-nav">{navigation.map((item) => { const Icon = item.icon; return <button type="button" key={item.key} className={section === item.key ? "is-active" : ""} onClick={() => navigate(item.key)}><Icon size={17} /><span><strong>{item.label}</strong><small>{item.caption}</small></span><ChevronRight size={15} /></button>; })}</nav>
        <div className="desk-sidebar-foot"><a href="/" className="desk-public-link"><ArrowLeft size={15} /> View public site</a><div className="desk-admin-identity"><span>{user.email?.slice(0, 1).toUpperCase()}</span><div><strong>{user.name || "Kasha admin"}</strong><small>{user.email}</small></div></div></div>
      </aside>
      <div className="desk-stage">
        <header className="desk-topbar"><button type="button" className="desk-menu" onClick={() => setMobileOpen(true)} aria-label="Open control room menu"><Menu size={20} /></button><div><p className="desk-crumb">Kasha desk / {navigation.find((item) => item.key === section)?.caption}</p><h1>{navigation.find((item) => item.key === section)?.label}</h1></div><div className="desk-top-actions"><button className="desk-icon-button" type="button" onClick={toggleTheme} aria-label="Toggle theme">{theme === "light" ? <Moon size={16} /> : <Sun size={16} />}</button><button className="desk-signout" type="button" onClick={signOut}><LogOut size={15} /><span>Sign out</span></button></div></header>
        <section className="desk-content">{section === "dashboard" && <Overview onNavigate={navigate} />}{section === "settings" && <SettingsManager />}{section === "programs" && <ProgramsManager />}{section === "services" && <ServicesManager />}{section === "events" && <EventsManager />}{section === "journal" && <JournalManager />}{section === "inquiries" && <InboxManager />}{section === "media" && <MediaManager />}</section>
      </div>
    </main>
  );
}

function ControlRoomLoading() { return <main className="admin-shell"><div className="admin-topbar"><a className="admin-back" href="/"><ArrowLeft size={15} /> Back to Kasha</a></div><section className="admin-card"><p className="eyebrow">Kasha desk</p><p className="admin-intro">Checking your secure control-room session…</p></section></main>; }

function Overview({ onNavigate }: { onNavigate: (section: SectionKey) => void }) {
  const summary = trpc.admin.dashboard.useQuery(undefined, { refetchOnWindowFocus: false });
  const stats = summary.data;
  const cards = [
    { key: "programs" as const, label: "Programmes", description: "Series, programme cards, and feature signals.", stat: stats?.programs },
    { key: "services" as const, label: "Services", description: "Creative offers presented on the public site.", stat: stats?.services },
    { key: "events" as const, label: "Events", description: "Campaigns and public-facing cultural moments.", stat: stats?.events },
    { key: "journal" as const, label: "Journal", description: "Field notes and editorial dispatches.", stat: stats?.journal },
  ];
  return <div className="desk-overview"><section className="desk-hero"><div><p className="eyebrow">Kasha desk / editorial system</p><h2>Everything public,<br /><em>under one signal.</em></h2><p>Shape the public story from one deliberate place. Changes are saved to the Kasha content archive and appear on the landing page as soon as you publish them.</p></div><button type="button" className="desk-primary" onClick={() => onNavigate("settings")}>Edit site direction <ArrowUpRight size={16} /></button></section><section className="desk-stat-grid">{cards.map((card, index) => <article key={card.key}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{card.label}</h3><p>{card.description}</p></div><strong>{summary.isLoading ? "—" : card.stat?.total ?? 0}</strong><footer><small>{card.stat?.published ?? 0} live</small><small>{card.stat?.drafts ?? 0} drafts</small><button type="button" onClick={() => onNavigate(card.key)}>Manage <ArrowUpRight size={14} /></button></footer></article>)}</section><section className="desk-overview-bottom"><div className="desk-panel-head"><div><p className="eyebrow">Inbox pulse</p><h3>Latest messages from the public site</h3></div><button type="button" className="desk-text-button" onClick={() => onNavigate("inquiries")}>Open inbox <ArrowRight size={15} /></button></div>{summary.isLoading ? <p className="desk-empty">Reading the desk…</p> : !stats?.recentInquiries.length ? <p className="desk-empty">No public notes yet. New contact submissions will arrive here.</p> : <div className="desk-inquiry-preview">{stats.recentInquiries.map((item) => <article key={item.id}><span className={`desk-status ${item.status}`}>{item.status}</span><div><strong>{item.name}</strong><small>{item.email}</small></div><p>{item.brief}</p><time>{dateTime(item.createdAt)}</time></article>)}</div>}</section></div>;
}

const settingGroups = [
  { title: "Identity & hero", fields: [["siteName", "Site name"], ["brandLine", "Brand line"], ["heroEyebrow", "Hero eyebrow"], ["heroTitle", "Hero title"], ["heroAccent", "Hero accent"], ["heroIntro", "Hero intro", "long"], ["heroCtaLabel", "Hero CTA label"], ["heroImageUrl", "Hero Google Drive link"], ["heroAsideTitle", "Hero aside title"], ["heroAsideBody", "Hero aside copy", "long"], ["heroFooterIndex", "Hero footer index"], ["heroFooterDescriptor", "Hero footer descriptor"], ["tickerItems", "Ticker items (separate with |)", "long"]] },
  { title: "About section", fields: [["aboutRailLabel", "Section rail label"], ["aboutEyebrow", "About eyebrow"], ["aboutTitle", "About title"], ["aboutAccent", "About accent"], ["aboutBody", "About body", "long"], ["aboutQuote", "About quotation", "long"], ["aboutImageUrl", "About Google Drive link"], ["aboutCaptionLeft", "Image caption left"], ["aboutCaptionRight", "Image caption right"]] },
  { title: "Programmes & services", fields: [["programsRailLabel", "Programmes rail label"], ["programsEyebrow", "Programmes eyebrow"], ["programsTitle", "Programmes title"], ["programsAccent", "Programmes accent"], ["programsSummary", "Programmes summary", "long"], ["audioImageLabel", "Audio image label"], ["audioCaptionLabel", "Audio caption label"], ["servicesRailLabel", "Services rail label"], ["servicesEyebrow", "Services eyebrow"], ["servicesTitle", "Services title"], ["servicesAccent", "Services accent"], ["servicesSummary", "Services summary", "long"]] },
  { title: "Events & journal", fields: [["eventEyebrow", "Events eyebrow"], ["eventTitle", "Events title"], ["eventAccent", "Events accent"], ["eventBody", "Events body", "long"], ["eventCtaLabel", "Event CTA label"], ["eventImageUrl", "Event Google Drive link"], ["eventImageLabel", "Event image label"], ["journalRailLabel", "Journal rail label"], ["journalEyebrow", "Journal eyebrow"], ["journalTitle", "Journal title"], ["journalAccent", "Journal accent"]] },
  { title: "Contact, footer & social", fields: [["contactRailLabel", "Contact rail label"], ["contactEyebrow", "Contact eyebrow"], ["contactTitle", "Contact title"], ["contactAccent", "Contact accent"], ["contactBody", "Contact body", "long"], ["contactEmail", "Contact email"], ["contactLocation", "Location"], ["footerNavigateLabel", "Footer navigation label"], ["footerFollowLabel", "Footer social label"], ["footerBuiltLine", "Footer location line"], ["instagramUrl", "Instagram URL"], ["youtubeUrl", "YouTube URL"], ["facebookUrl", "Facebook URL"]] },
] as const;

function SettingsManager() {
  const utils = trpc.useUtils();
  const settingsQuery = trpc.admin.settings.get.useQuery();
  const save = trpc.admin.settings.update.useMutation({ onSuccess: () => { utils.admin.settings.get.invalidate(); utils.public.homepage.invalidate(); toast.success("Site direction saved."); }, onError: mutationError("Site direction") });
  const [form, setForm] = useState<Record<string, any>>({});
  useEffect(() => { if (settingsQuery.data) setForm(settingsQuery.data as unknown as Record<string, any>); }, [settingsQuery.data]);
  if (settingsQuery.isLoading) return <ManagerLoading label="Loading site direction" />;
  if (settingsQuery.isError) return <ManagerError label="Site direction could not be loaded" />;
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate(form as any); };
  return <form className="desk-settings-form" onSubmit={submit}><div className="desk-page-intro"><div><p className="eyebrow">Public site direction</p><h2>Set the room<br /><em>before the story.</em></h2><p>These fields control the public landing page, from its first headline to its contact details and social links.</p></div><button className="desk-primary" type="submit" disabled={save.isPending}><Save size={16} /> {save.isPending ? "Saving…" : "Save direction"}</button></div>{settingGroups.map((group) => <section className="desk-form-panel" key={group.title}><h3>{group.title}</h3><div className="desk-field-grid">{group.fields.map(([key, label, kind]) => <Field key={key} label={label} value={String(form[key] ?? "")} multiline={kind === "long"} onChange={(value) => setForm((current) => ({ ...current, [key]: value }))} />)}</div></section>)}</form>;
}

function Field({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) { return <label className={`desk-field ${multiline ? "is-wide" : ""}`}><span>{label}</span>{multiline ? <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}</label>; }

function ManagerLoading({ label }: { label: string }) { return <div className="desk-loading"><CircleDot size={18} /><span>{label}…</span></div>; }
function ManagerError({ label }: { label: string }) { return <div className="desk-manager-error"><CircleDot size={18} /><strong>{label}.</strong><span>Refresh the page or try again in a moment.</span></div>; }

function CollectionChrome({ eyebrow, title, accent, description, actionLabel, onCreate, children }: { eyebrow: string; title: string; accent: string; description: string; actionLabel: string; onCreate: () => void; children: ReactNode }) { return <div><section className="desk-page-intro"><div><p className="eyebrow">{eyebrow}</p><h2>{title}<br /><em>{accent}</em></h2><p>{description}</p></div><button className="desk-primary" type="button" onClick={onCreate}><Plus size={16} /> {actionLabel}</button></section>{children}</div>; }

function ProgramsManager() {
  const utils = trpc.useUtils(); const list = trpc.admin.programs.list.useQuery(); const create = trpc.admin.programs.create.useMutation({ onSuccess: () => refresh(), onError: mutationError("Programme") }); const update = trpc.admin.programs.update.useMutation({ onSuccess: () => refresh(), onError: mutationError("Programme") }); const remove = trpc.admin.programs.remove.useMutation({ onSuccess: () => refresh(), onError: mutationError("Programme") }); const publish = trpc.admin.programs.setPublished.useMutation({ onSuccess: () => refresh(), onError: mutationError("Programme publishing state") }); const [editing, setEditing] = useState<any | null>(null);
  const refresh = () => { utils.admin.programs.list.invalidate(); utils.public.homepage.invalidate(); utils.admin.dashboard.invalidate(); toast.success("Programme updated."); };
  const blank = { title: "", subtitle: "", description: "", tag: "Radio", imageUrl: "", featureTitle: "", featureSubtitle: "", sortOrder: (list.data?.length ?? 0) + 1, isPublished: true };
  const save = () => { if (!editing?.title || !editing?.description) return toast.error("Add a programme title and description."); const { id, ...values } = editing; id ? update.mutate({ id, ...values }) : create.mutate(values); setEditing(null); };
  return <CollectionChrome eyebrow="Programmes / public signals" title="Tune the" accent="programme guide." description="Create, publish, order, and feature the voices that carry Kasha into the week." actionLabel="Add programme" onCreate={() => setEditing(blank)}>{list.isLoading ? <ManagerLoading label="Loading programmes" /> : list.isError ? <ManagerError label="Programmes could not be loaded" /> : <ContentTable rows={list.data ?? []} columns={["Programme", "Format", "Signal", "Status"]} render={(item: any) => <><div><strong>{item.title}</strong><small>{item.subtitle}</small></div><span>{item.tag}</span><span className="desk-truncate">{item.description}</span><StatusBadge published={item.isPublished} /></>} onEdit={setEditing} onDelete={(item) => { if (confirm(`Remove ${item.title}?`)) remove.mutate({ id: item.id }); }} onPublish={(item) => publish.mutate({ id: item.id, isPublished: !item.isPublished })} />}{editing && <ProgrammeEditor value={editing} onChange={setEditing} onClose={() => setEditing(null)} onSave={save} saving={create.isPending || update.isPending} />}</CollectionChrome>;
}

function ServicesManager() {
  const utils = trpc.useUtils(); const list = trpc.admin.services.list.useQuery(); const create = trpc.admin.services.create.useMutation({ onSuccess: () => refresh(), onError: mutationError("Service") }); const update = trpc.admin.services.update.useMutation({ onSuccess: () => refresh(), onError: mutationError("Service") }); const remove = trpc.admin.services.remove.useMutation({ onSuccess: () => refresh(), onError: mutationError("Service") }); const publish = trpc.admin.services.setPublished.useMutation({ onSuccess: () => refresh(), onError: mutationError("Service publishing state") }); const [editing, setEditing] = useState<any | null>(null);
  const refresh = () => { utils.admin.services.list.invalidate(); utils.public.homepage.invalidate(); utils.admin.dashboard.invalidate(); toast.success("Service updated."); };
  const blank = { title: "", description: "", iconKey: "mic", sortOrder: (list.data?.length ?? 0) + 1, isPublished: true };
  const save = () => { if (!editing?.title || !editing?.description) return toast.error("Add a service title and description."); const { id, ...values } = editing; id ? update.mutate({ id, ...values }) : create.mutate(values); setEditing(null); };
  return <CollectionChrome eyebrow="Services / creative practice" title="Shape what" accent="Kasha makes." description="Keep the public offer current, considered, and ready for the next project." actionLabel="Add service" onCreate={() => setEditing(blank)}>{list.isLoading ? <ManagerLoading label="Loading services" /> : list.isError ? <ManagerError label="Services could not be loaded" /> : <ContentTable rows={list.data ?? []} columns={["Service", "Icon", "Description", "Status"]} render={(item: any) => <><div><strong>{item.title}</strong><small>Order {item.sortOrder}</small></div><span className="desk-mono">{item.iconKey}</span><span className="desk-truncate">{item.description}</span><StatusBadge published={item.isPublished} /></>} onEdit={setEditing} onDelete={(item) => { if (confirm(`Remove ${item.title}?`)) remove.mutate({ id: item.id }); }} onPublish={(item) => publish.mutate({ id: item.id, isPublished: !item.isPublished })} />}{editing && <ServiceEditor value={editing} onChange={setEditing} onClose={() => setEditing(null)} onSave={save} saving={create.isPending || update.isPending} />}</CollectionChrome>;
}

function EventsManager() {
  const utils = trpc.useUtils(); const list = trpc.admin.events.list.useQuery(); const create = trpc.admin.events.create.useMutation({ onSuccess: () => refresh(), onError: mutationError("Event") }); const update = trpc.admin.events.update.useMutation({ onSuccess: () => refresh(), onError: mutationError("Event") }); const remove = trpc.admin.events.remove.useMutation({ onSuccess: () => refresh(), onError: mutationError("Event") }); const publish = trpc.admin.events.setPublished.useMutation({ onSuccess: () => refresh(), onError: mutationError("Event publishing state") }); const [editing, setEditing] = useState<any | null>(null);
  const refresh = () => { utils.admin.events.list.invalidate(); utils.public.homepage.invalidate(); utils.admin.dashboard.invalidate(); toast.success("Event updated."); };
  const blank = { title: "", description: "", imageUrl: "", ctaLabel: "Learn more", ctaTarget: "#contact", sortOrder: (list.data?.length ?? 0) + 1, isPublished: true };
  const save = () => { if (!editing?.title || !editing?.description || !editing?.imageUrl) return toast.error("Add an event title, description, and image URL."); const { id, ...values } = editing; id ? update.mutate({ id, ...values }) : create.mutate(values); setEditing(null); };
  return <CollectionChrome eyebrow="Events / public room" title="Make the" accent="next room ready." description="Publish event promotion cards, calls-to-action, visual cues, and the story behind each gathering." actionLabel="Add event" onCreate={() => setEditing(blank)}>{list.isLoading ? <ManagerLoading label="Loading events" /> : list.isError ? <ManagerError label="Events could not be loaded" /> : <ContentTable rows={list.data ?? []} columns={["Event", "CTA", "Image", "Status"]} render={(item: any) => <><div><strong>{item.title}</strong><small>Order {item.sortOrder}</small></div><span>{item.ctaLabel}</span><span className="desk-truncate">{item.imageUrl}</span><StatusBadge published={item.isPublished} /></>} onEdit={setEditing} onDelete={(item) => { if (confirm(`Remove ${item.title}?`)) remove.mutate({ id: item.id }); }} onPublish={(item) => publish.mutate({ id: item.id, isPublished: !item.isPublished })} />}{editing && <EventEditor value={editing} onChange={setEditing} onClose={() => setEditing(null)} onSave={save} saving={create.isPending || update.isPending} />}</CollectionChrome>;
}

function JournalManager() {
  const utils = trpc.useUtils(); const list = trpc.admin.journal.list.useQuery(); const create = trpc.admin.journal.create.useMutation({ onSuccess: () => refresh(), onError: mutationError("Journal entry") }); const update = trpc.admin.journal.update.useMutation({ onSuccess: () => refresh(), onError: mutationError("Journal entry") }); const remove = trpc.admin.journal.remove.useMutation({ onSuccess: () => refresh(), onError: mutationError("Journal entry") }); const publish = trpc.admin.journal.setPublished.useMutation({ onSuccess: () => refresh(), onError: mutationError("Journal publishing state") }); const [editing, setEditing] = useState<any | null>(null);
  const refresh = () => { utils.admin.journal.list.invalidate(); utils.public.homepage.invalidate(); utils.admin.dashboard.invalidate(); toast.success("Journal entry updated."); };
  const blank = { title: "", category: "Field note", dateLabel: "Field note / 01", body: "", sortOrder: (list.data?.length ?? 0) + 1, isPublished: true };
  const save = () => { if (!editing?.title || !editing?.category || !editing?.dateLabel) return toast.error("Add a title, category, and display date."); const { id, ...values } = editing; id ? update.mutate({ id, ...values }) : create.mutate(values); setEditing(null); };
  return <CollectionChrome eyebrow="Journal / cultural archive" title="Keep the" accent="field notes close." description="Edit the live notes and conversations that give the landing page its editorial aftertaste." actionLabel="Add journal note" onCreate={() => setEditing(blank)}>{list.isLoading ? <ManagerLoading label="Loading journal notes" /> : list.isError ? <ManagerError label="Journal notes could not be loaded" /> : <ContentTable rows={list.data ?? []} columns={["Story", "Category", "Display date", "Status"]} render={(item: any) => <><div><strong>{item.title}</strong><small>Order {item.sortOrder}</small></div><span>{item.category}</span><span>{item.dateLabel}</span><StatusBadge published={item.isPublished} /></>} onEdit={setEditing} onDelete={(item) => { if (confirm(`Remove ${item.title}?`)) remove.mutate({ id: item.id }); }} onPublish={(item) => publish.mutate({ id: item.id, isPublished: !item.isPublished })} />}{editing && <JournalEditor value={editing} onChange={setEditing} onClose={() => setEditing(null)} onSave={save} saving={create.isPending || update.isPending} />}</CollectionChrome>;
}

function ContentTable({ rows, columns, render, onEdit, onDelete, onPublish }: { rows: any[]; columns: string[]; render: (row: any) => ReactNode; onEdit: (row: any) => void; onDelete: (row: any) => void; onPublish: (row: any) => void }) { return <section className="desk-table-wrap"><div className="desk-table-head">{columns.map((column) => <span key={column}>{column}</span>)}<span>Actions</span></div>{!rows.length ? <p className="desk-empty">No entries here yet. Add the first one when the signal is ready.</p> : rows.map((row) => <div className="desk-table-row" key={row.id}>{render(row)}<div className="desk-row-actions"><button type="button" onClick={() => onPublish(row)}>{row.isPublished ? "Unpublish" : "Publish"}</button><button type="button" onClick={() => onEdit(row)}>Edit</button><button className="danger" type="button" onClick={() => onDelete(row)} aria-label="Delete"><Trash2 size={15} /></button></div></div>)}</section>; }

function StatusBadge({ published }: { published: boolean }) { return <span className={`desk-status ${published ? "published" : "draft"}`}>{statusLabel(published)}</span>; }

function EditorSheet({ title, description, onClose, onSave, saving, children }: { title: string; description: string; onClose: () => void; onSave: () => void; saving: boolean; children: ReactNode }) { return <div className="desk-sheet-backdrop" role="dialog" aria-modal="true" aria-label={title}><section className="desk-sheet"><header><div><p className="eyebrow">Kasha desk / editor</p><h3>{title}</h3><p>{description}</p></div><button type="button" onClick={onClose} className="desk-icon-button" aria-label="Close editor"><X size={18} /></button></header><div className="desk-sheet-fields">{children}</div><footer><button type="button" className="desk-quiet-button" onClick={onClose}>Cancel</button><button type="button" className="desk-primary" onClick={onSave} disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save changes"}</button></footer></section></div>; }

function ProgrammeEditor({ value, onChange, onClose, onSave, saving }: any) { return <EditorSheet title={value.id ? "Edit programme" : "Add programme"} description="Define the public programme card and its optional featured signal." onClose={onClose} onSave={onSave} saving={saving}><EditorFields value={value} onChange={onChange} fields={[["title", "Programme title"], ["subtitle", "Subtitle / translation"], ["tag", "Format tag"], ["sortOrder", "Display order", "number"], ["description", "Description", "long"], ["imageUrl", "Feature Google Drive link"], ["featureTitle", "Feature title"], ["featureSubtitle", "Feature subtitle"], ["isPublished", "Publish now", "boolean"]]} /></EditorSheet>; }
function ServiceEditor({ value, onChange, onClose, onSave, saving }: any) { return <EditorSheet title={value.id ? "Edit service" : "Add service"} description="Describe what Kasha can make and select a simple visual signal." onClose={onClose} onSave={onSave} saving={saving}><EditorFields value={value} onChange={onChange} fields={[["title", "Service title"], ["iconKey", "Icon", "select", ["mic", "camera", "calendar", "radio", "sparkles", "film"]], ["sortOrder", "Display order", "number"], ["description", "Description", "long"], ["isPublished", "Publish now", "boolean"]]} /></EditorSheet>; }
function EventEditor({ value, onChange, onClose, onSave, saving }: any) { return <EditorSheet title={value.id ? "Edit event" : "Add event"} description="Place the next Kasha event into the public event feature." onClose={onClose} onSave={onSave} saving={saving}><EditorFields value={value} onChange={onChange} fields={[["title", "Event title"], ["ctaLabel", "CTA label"], ["ctaTarget", "CTA target"], ["sortOrder", "Display order", "number"], ["description", "Event description", "long"], ["imageUrl", "Event Google Drive link"], ["isPublished", "Publish now", "boolean"]]} /></EditorSheet>; }
function JournalEditor({ value, onChange, onClose, onSave, saving }: any) { return <EditorSheet title={value.id ? "Edit journal note" : "Add journal note"} description="Publish one concise story marker to the public journal list." onClose={onClose} onSave={onSave} saving={saving}><EditorFields value={value} onChange={onChange} fields={[["title", "Story title"], ["category", "Category"], ["dateLabel", "Display date"], ["sortOrder", "Display order", "number"], ["body", "Full note", "long"], ["isPublished", "Publish now", "boolean"]]} /></EditorSheet>; }

function EditorFields({ value, onChange, fields }: { value: any; onChange: (value: any) => void; fields: any[] }) { return <div className="desk-field-grid">{fields.map(([key, label, type, options]) => { const current = value[key] ?? (type === "boolean" ? false : ""); if (type === "boolean") return <label className="desk-toggle-field" key={key}><span>{label}</span><input type="checkbox" checked={Boolean(current)} onChange={(event) => onChange({ ...value, [key]: event.target.checked })} /><i /></label>; if (type === "select") return <label className="desk-field" key={key}><span>{label}</span><select value={String(current)} onChange={(event) => onChange({ ...value, [key]: event.target.value })}>{options.map((option: string) => <option key={option} value={option}>{option}</option>)}</select></label>; const long = type === "long"; return <label className={`desk-field ${long ? "is-wide" : ""}`} key={key}><span>{label}</span>{long ? <textarea rows={4} value={String(current)} onChange={(event) => onChange({ ...value, [key]: event.target.value })} /> : <input type={type === "number" ? "number" : "text"} value={String(current)} onChange={(event) => onChange({ ...value, [key]: type === "number" ? Number(event.target.value) : event.target.value })} />}</label>; })}</div>; }

function InboxManager() {
  const utils = trpc.useUtils(); const list = trpc.admin.inquiries.list.useQuery(); const status = trpc.admin.inquiries.updateStatus.useMutation({ onSuccess: () => { utils.admin.inquiries.list.invalidate(); utils.admin.dashboard.invalidate(); toast.success("Inbox status updated."); }, onError: mutationError("Inbox status") }); const remove = trpc.admin.inquiries.remove.useMutation({ onSuccess: () => { utils.admin.inquiries.list.invalidate(); utils.admin.dashboard.invalidate(); toast.success("Message archived."); }, onError: mutationError("Inbox message") });
  return <div><section className="desk-page-intro"><div><p className="eyebrow">Inbox / public contact</p><h2>Hear what the<br /><em>room is asking.</em></h2><p>Every note from the landing-page contact form arrives here. Mark your progress as you follow up.</p></div></section>{list.isLoading ? <ManagerLoading label="Opening the inbox" /> : list.isError ? <ManagerError label="Inbox could not be loaded" /> : <section className="desk-inbox-list">{!list.data?.length ? <p className="desk-empty">No enquiries yet. Public contact notes will appear here.</p> : list.data.map((item) => <article key={item.id}><header><div><StatusBadge published={item.status === "replied"} /><strong>{item.name}</strong><a href={`mailto:${item.email}`}>{item.email}</a></div><time>{dateTime(item.createdAt)}</time></header><p>{item.brief}</p><footer><label>Progress<select value={item.status} onChange={(event) => status.mutate({ id: item.id, status: event.target.value as any })}><option value="new">New</option><option value="read">Read</option><option value="replied">Replied</option><option value="archived">Archived</option></select></label><button className="danger" type="button" onClick={() => { if (confirm("Delete this public note?")) remove.mutate({ id: item.id }); }}><Trash2 size={15} /> Delete</button></footer></article>)}</section>}</div>;
}

function MediaManager() {
  const utils = trpc.useUtils(); const list = trpc.admin.media.list.useQuery(); const connectDrive = trpc.admin.media.connectDrive.useMutation({ onSuccess: () => { utils.admin.media.list.invalidate(); toast.success("Google Drive image connected to the Kasha media desk."); setDriveLink(""); setFileName(""); setAltText(""); setCategory("Editorial image"); }, onError: mutationError("Google Drive image") }); const remove = trpc.admin.media.remove.useMutation({ onSuccess: () => { utils.admin.media.list.invalidate(); toast.success("Media reference removed."); }, onError: mutationError("Media item") });
  const [driveLink, setDriveLink] = useState(""); const [fileName, setFileName] = useState(""); const [altText, setAltText] = useState(""); const [category, setCategory] = useState("Editorial image");
  const submit = () => { if (!driveLink.trim() || !fileName.trim() || !altText.trim()) return toast.error("Add a Google Drive sharing link, image name, and useful alt text."); connectDrive.mutate({ driveLink, fileName, altText, category }); };
  return <div>
    <section className="desk-page-intro"><div><p className="eyebrow">Media desk / visual archive</p><h2>Give the story<br /><em>its image.</em></h2><p>Upload the image to Google Drive, set General access to Anyone with the link, then connect its sharing link here for use across Kasha.</p></div></section>
    <section className="desk-media-upload">
      <div><Link2 size={26} /><div><h3>Connect a Drive image</h3><p>Paste a Google Drive sharing link. Kasha converts supported links into display-ready image sources.</p></div></div>
      <Field label="Google Drive sharing link" value={driveLink} onChange={setDriveLink} />
      <Field label="Image name" value={fileName} onChange={setFileName} />
      <Field label="Alt text" value={altText} onChange={setAltText} />
      <Field label="Category" value={category} onChange={setCategory} />
      <button className="desk-primary" type="button" onClick={submit} disabled={connectDrive.isPending}>{connectDrive.isPending ? "Connecting…" : "Connect Drive image"} <ArrowUpRight size={16} /></button>
    </section>
    {list.isLoading ? <ManagerLoading label="Loading media" /> : list.isError ? <ManagerError label="Media desk could not be loaded" /> : <section className="desk-media-grid">{!list.data?.length ? <p className="desk-empty">No uploaded media yet. The Kasha visual archive starts with the next image.</p> : list.data.map((item) => <article key={item.id}><img src={item.url} alt={item.altText} /><div><strong>{item.fileName}</strong><small>{item.category}</small><code>{item.url}</code></div><footer><button type="button" onClick={() => { navigator.clipboard.writeText(item.url); toast.success("Media URL copied."); }}>Copy URL</button><button className="danger" type="button" onClick={() => { if (confirm(`Remove ${item.fileName}?`)) remove.mutate({ id: item.id }); }}><Trash2 size={15} /></button></footer></article>)}</section>}
  </div>;
}
