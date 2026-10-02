import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Clock3,
  Heart,
  LoaderCircle,
  MapPin,
  MessageCircle,
  MonitorSmartphone,
  Radio,
  ReceiptText,
  RefreshCcw,
  Share2,
  Signal,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SideBarNav from "../pageAssets/SideBarNav";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../auth/AuthContext";
import { showError } from "../../component/ui/toast";

/* ── Palette ────────────────────────────────────────────────────────────────
   Brand accent first, then a muted spread that survives a projector. Kept in
   one place so every chart in the page agrees. */
const BRAND = "#16909C";
const SERIES = {
  accent: BRAND,
  ink: "#2F2A26",
  violet: "#6D5DFB",
  amber: "#D98A0B",
  emerald: "#0F9D6E",
  red: "#D64545",
  soft: "#BFE9EC",
  sand: "#DED6CD",
};
const PIE_COLORS = [SERIES.accent, SERIES.violet, SERIES.amber, SERIES.emerald, SERIES.red];

const GRID = { fontSize: 11, fill: "#8A837C" };
const TOOLTIP_STYLE = {
  borderRadius: 16,
  border: "1px solid #ded6cd",
  boxShadow: "0 12px 30px rgba(47,42,38,0.10)",
  fontSize: 12,
  padding: "10px 12px",
};

const cx = (...classes) => classes.filter(Boolean).join(" ");

function getErrorMessage(error, fallback = "Could not load analytics.") {
  return error?.response?.data?.message || error?.message || fallback;
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(num(value));
}

function count(value) {
  return new Intl.NumberFormat("en-NG").format(num(value));
}

function minutes(value) {
  const total = Math.round(num(value));
  if (total < 60) return `${count(total)}m`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${count(hours)}h ${rest}m` : `${count(hours)}h`;
}

function timeAgo(iso, reference = Date.now()) {
  if (!iso) return "just now";
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "just now";

  const seconds = Math.max(0, Math.round((reference - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function initialsOf(label) {
  const parts = String(label || "Viewer").trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "V";
}

/* ── Shell pieces ───────────────────────────────────────────────────────── */

function Card({ children, className = "", part }) {
  return (
    <section
      data-analytics-part={part}
      className={cx(
        "tw:rounded-4xl tw:border tw:border-[#ded6cd] tw:bg-white tw:p-4 tw:shadow-sm tw:md:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

function Panel({ title, icon: Icon, hint, action, children, part }) {
  return (
    <Card part={part}>
      <div className="tw:mb-4 tw:flex tw:flex-wrap tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:flex tw:items-start tw:gap-3">
          <span className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-accent-soft tw:text-accent-deep">
            <Icon className="tw:h-4 tw:w-4" />
          </span>
          <div>
            <span className="tw:block tw:text-base tw:font-semibold tw:text-gray-900">{title}</span>
            {hint ? <span className="tw:block tw:mt-0.5 tw:text-xs tw:text-gray-500">{hint}</span> : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone = "default", part }) {
  return (
    <div
      data-analytics-part={part}
      className="tw:flex tw:items-start tw:justify-between tw:gap-3 tw:rounded-3xl tw:border tw:border-[#ded6cd] tw:bg-[#faf8f6] tw:p-4"
    >
      <div className="tw:min-w-0">
        <span className="tw:block tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
          {label}
        </span>
        <span className="tw:mt-1.5 tw:block tw:text-2xl tw:font-bold tw:text-gray-900 tw:md:text-3xl">
          {value}
        </span>
        {sub ? <span className="tw:mt-1 tw:block tw:text-xs tw:text-gray-500">{sub}</span> : null}
      </div>
      <span
        className={cx(
          "tw:flex tw:h-10 tw:w-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-2xl",
          tone === "brand" ? "tw:bg-accent tw:text-white" : "tw:bg-accent-soft tw:text-accent-deep",
        )}
      >
        <Icon className="tw:h-5 tw:w-5" />
      </span>
    </div>
  );
}

function StatusPill({ status }) {
  const value = String(status || "unknown").toLowerCase();
  const live = value === "live";
  const ended = value === "ended" || value === "completed";

  return (
    <span
      data-analytics-part="status-pill"
      className={cx(
        "tw:inline-flex tw:shrink-0 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold",
        live
          ? "tw:border-emerald-200 tw:bg-emerald-50 tw:text-emerald-700"
          : ended
            ? "tw:border-[#ded6cd] tw:bg-white tw:text-gray-600"
            : "tw:border-amber-200 tw:bg-amber-50 tw:text-amber-800",
      )}
    >
      <span className="tw:h-2 tw:w-2 tw:rounded-full tw:bg-current" />
      {live ? "Live now" : ended ? "Ended" : String(status || "Unknown")}
    </span>
  );
}

function EmptyChart({ label = "Nothing recorded yet" }) {
  return (
    <div className="tw:flex tw:h-[240px] tw:flex-col tw:items-center tw:justify-center tw:gap-2 tw:rounded-3xl tw:border tw:border-dashed tw:border-[#ded6cd] tw:bg-[#faf8f6] tw:text-center">
      <BarChart3 className="tw:h-5 tw:w-5 tw:text-gray-400" />
      <span className="tw:text-sm tw:text-gray-500">{label}</span>
    </div>
  );
}

function ChartFrame({ children, empty, height = 260, emptyLabel }) {
  if (empty) return <EmptyChart label={emptyLabel} />;
  return <div className="tw:w-full" style={{ height }}>{children}</div>;
}

function axisProps() {
  return {
    tick: GRID,
    axisLine: false,
    tickLine: false,
  };
}

/* ── Top viewers ────────────────────────────────────────────────────────────
   Ranked, with a watch-time bar so "who actually stayed" reads at a glance.
   Deliberately no email column: an organiser does not need a viewer's contact
   details to read their own event, and the API no longer sends them. */
function TopViewers({ viewers, meta, loading, onPage }) {
  const topWatch = Math.max(1, ...viewers.map((viewer) => num(viewer.watch_minutes)));
  const page = meta?.current_page || 1;
  const lastPage = meta?.last_page || 1;

  return (
    <Panel
      title="Top viewers"
      icon={Users}
      hint="Ranked by watch time. Signed-in viewers only."
      part="top-viewers"
      action={
        <div className="tw:flex items-center tw:gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => onPage(page - 1)}
            className="tw:rounded-full tw:border tw:border-[#ded6cd] tw:bg-white tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-gray-700 tw:transition tw:hover:bg-[#f4f1ee] tw:disabled:opacity-50"
          >
            Previous
          </button>
          <span className="tw:text-xs tw:text-gray-500">
            {page} / {lastPage}
          </span>
          <button
            type="button"
            disabled={loading || page >= lastPage}
            onClick={() => onPage(page + 1)}
            className="tw:rounded-full tw:border tw:border-[#ded6cd] tw:bg-white tw:px-3 tw:py-1.5 tw:text-xs tw:font-semibold tw:text-gray-700 tw:transition tw:hover:bg-[#f4f1ee] tw:disabled:opacity-50"
          >
            Next
          </button>
        </div>
      }
    >
      {loading && !viewers.length ? (
        <p className="tw:text-sm tw:text-gray-500">Loading viewers…</p>
      ) : viewers.length ? (
        <div className="tw:space-y-2">
          {viewers.map((viewer, index) => (
            <div
              key={viewer.user_id || index}
              data-analytics-part="viewer-row"
              className="tw:flex tw:items-center tw:gap-3 tw:rounded-3xl tw:bg-[#faf8f6] tw:px-3 tw:py-3"
            >
              <span className="tw:w-5 tw:shrink-0 tw:text-sm tw:font-semibold tw:text-gray-400">
                {index + 1 + (page - 1) * 10}
              </span>

              <span className="tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-accent-soft tw:text-xs tw:font-semibold tw:text-accent-deep">
                {initialsOf(viewer.name)}
              </span>

              <div className="tw:min-w-0 tw:flex-1">
                <div className="tw:truncate tw:text-sm tw:font-semibold tw:text-gray-900">
                  {viewer.name || "Viewer"}
                </div>
                <div className="tw:mt-1 tw:h-1.5 tw:w-full tw:overflow-hidden tw:rounded-full tw:bg-[#eee7e0]">
                  <div
                    className="tw:h-full tw:rounded-full tw:bg-accent"
                    style={{ width: `${Math.max(4, (num(viewer.watch_minutes) / topWatch) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="tw:shrink-0 tw:text-right">
                <div className="tw:text-sm tw:font-semibold tw:text-gray-900">
                  {minutes(viewer.watch_minutes)}
                </div>
                <div className="tw:text-xs tw:text-gray-500">
                  {count(viewer.total_sessions)} {num(viewer.total_sessions) === 1 ? "session" : "sessions"}
                  {viewer.last_seen ? ` · ${timeAgo(viewer.last_seen)}` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="tw:text-sm tw:text-gray-600">No viewer sessions have been recorded.</p>
      )}
    </Panel>
  );
}

/* ── DEV fixture ────────────────────────────────────────────────────────────
   `?fixture=1` renders this page against fixed payloads with no auth, so the
   design can be reviewed (and measured) without an organiser account. The
   shapes mirror EventLiveAnalyticsService exactly. Never in a production build:
   the flag is checked behind import.meta.env.DEV. */
const FIXTURE = {
  dashboard: {
    overview: {
      event_title: "Lagos Afrobeat Night — Live Band & DJ Set",
      event_status: "live",
      current_viewers: 128,
      peak_viewers: 412,
      unique_viewers: 1863,
      total_watch_minutes: 9421,
      tickets_sold: 214,
      gross_revenue: 3210000,
      organizer_earning: 1926000,
      chat_messages: 934,
      attendance_type: "streamed",
    },
    revenue: {
      sales_timeline: [
        { date: "Sep 6", tickets: 12, revenue: 180000 },
        { date: "Sep 7", tickets: 31, revenue: 465000 },
        { date: "Sep 8", tickets: 24, revenue: 360000 },
        { date: "Sep 9", tickets: 48, revenue: 720000 },
        { date: "Sep 10", tickets: 39, revenue: 585000 },
        { date: "Sep 11", tickets: 60, revenue: 900000 },
      ],
    },
    engagement: {
      likes: 1240,
      comments: 934,
      shares: 118,
      timeline: [
        { time: "20:00", likes: 60, comments: 40, shares: 4 },
        { time: "20:15", likes: 180, comments: 120, shares: 11 },
        { time: "20:30", likes: 320, comments: 210, shares: 22 },
        { time: "20:45", likes: 280, comments: 240, shares: 31 },
        { time: "21:00", likes: 400, comments: 324, shares: 50 },
      ],
    },
    watch_time: {
      total_watch_minutes: 9421,
      watch_time_distribution: [
        { range: "0–5m", users: 420 },
        { range: "5–15m", users: 610 },
        { range: "15–30m", users: 480 },
        { range: "30–60m", users: 260 },
        { range: "60m+", users: 93 },
      ],
    },
    devices: {
      device_types: [
        { label: "Android", count: 980 },
        { label: "iOS", count: 540 },
        { label: "Desktop", count: 240 },
        { label: "Tablet", count: 103 },
      ],
    },
    locations: {
      top_cities: [
        { label: "Lagos", count: 720 },
        { label: "Abuja", count: 310 },
        { label: "Port Harcourt", count: 168 },
        { label: "Aba", count: 121 },
        { label: "London", count: 64 },
      ],
    },
    stream_health: {
      stream_status: "live",
      uptime_minutes: 96,
      buffering_reports: 7,
      playback_errors: 3,
    },
    attendance_report: {
      registered_users: 2310,
      ticket_buyers: 214,
      attended_users: 1863,
      attendance_rate: 81,
    },
    viewer_timeline: [
      { time: "20:00", viewers: 40, joins: 40, leaves: 0 },
      { time: "20:15", viewers: 180, joins: 150, leaves: 10 },
      { time: "20:30", viewers: 340, joins: 180, leaves: 20 },
      { time: "20:45", viewers: 412, joins: 96, leaves: 24 },
      { time: "21:00", viewers: 388, joins: 40, leaves: 64 },
      { time: "21:15", viewers: 296, joins: 22, leaves: 114 },
      { time: "21:30", viewers: 128, joins: 12, leaves: 180 },
    ],
    realtime: { current_viewers: 128, active_sessions: 141 },
  },
  realtime: { current_viewers: 128, active_sessions: 141, peak_viewers: 412, last_updated: new Date().toISOString() },
  topViewers: [
    { user_id: "tv1", name: "Miracle Chigozie", watch_minutes: 96, total_sessions: 2, last_seen: new Date(Date.now() - 60000).toISOString() },
    { user_id: "tv2", name: "Henry Falolu", watch_minutes: 88, total_sessions: 1, last_seen: new Date(Date.now() - 240000).toISOString() },
    { user_id: "tv3", name: "Ngozi Bell", watch_minutes: 74, total_sessions: 3, last_seen: new Date(Date.now() - 900000).toISOString() },
    { user_id: "tv4", name: "Tunde Adeyemi", watch_minutes: 61, total_sessions: 1, last_seen: new Date(Date.now() - 3600000).toISOString() },
    { user_id: "tv5", name: "Amaka Obi", watch_minutes: 42, total_sessions: 1, last_seen: new Date(Date.now() - 7200000).toISOString() },
  ],
  topViewersMeta: { current_page: 1, last_page: 3, per_page: 10, total: 24 },
};

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function EventStreamAnalyticsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [params] = useSearchParams();
  const fixtureMode = import.meta.env.DEV && params.get("fixture") === "1";

  const [dashboard, setDashboard] = useState(fixtureMode ? FIXTURE.dashboard : null);
  const [realtime, setRealtime] = useState(fixtureMode ? FIXTURE.realtime : null);
  const [loading, setLoading] = useState(!fixtureMode);
  const [refreshing, setRefreshing] = useState(false);
  const [topViewers, setTopViewers] = useState(fixtureMode ? FIXTURE.topViewers : []);
  const [topViewersMeta, setTopViewersMeta] = useState(fixtureMode ? FIXTURE.topViewersMeta : null);
  const [topViewersLoading, setTopViewersLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const loadDashboard = useCallback(async ({ background = false } = {}) => {
    if (fixtureMode) return;
    if (!eventId || !token) return;

    if (background) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get(`/api/v1/events/${eventId}/analytics/dashboard`, authHeaders(token));
      const nextDashboard = response?.data?.data || null;
      const attendanceType = String(nextDashboard?.overview?.attendance_type || "").toLowerCase();

      if (attendanceType === "physical") {
        showError("Stream analytics are only available for streamed events.");
        navigate(`/event/view/${eventId}`, { replace: true });
        return;
      }

      setDashboard(nextDashboard);
      setRealtime(nextDashboard?.realtime || null);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId, fixtureMode, navigate, token]);

  const loadRealtime = useCallback(async () => {
    if (fixtureMode) return;
    if (!eventId || !token) return;

    try {
      const response = await api.get(`/api/v1/events/${eventId}/analytics/realtime`, authHeaders(token));
      setRealtime(response?.data?.data || null);
    } catch (error) {
      if (!import.meta.env.PROD) console.warn("[analytics] realtime refresh failed", error);
    }
  }, [eventId, fixtureMode, token]);

  const loadTopViewers = useCallback(async (page = 1) => {
    if (fixtureMode) return;
    if (!eventId || !token) return;

    setTopViewersLoading(true);
    try {
      const response = await api.get(
        `/api/v1/events/${eventId}/analytics/top-viewers?page=${page}&per_page=10`,
        authHeaders(token),
      );
      setTopViewers(response?.data?.data || []);
      setTopViewersMeta(response?.data?.meta || null);
    } catch (error) {
      showError(getErrorMessage(error, "Could not load top viewers."));
    } finally {
      setTopViewersLoading(false);
    }
  }, [eventId, fixtureMode, token]);

  useEffect(() => {
    loadDashboard();
    loadTopViewers();
  }, [loadDashboard, loadTopViewers]);

  useEffect(() => {
    const timer = window.setInterval(loadRealtime, 8000);
    return () => window.clearInterval(timer);
  }, [loadRealtime]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const overview = dashboard?.overview || {};
  const revenue = dashboard?.revenue || {};
  const engagement = dashboard?.engagement || {};
  const watchTime = dashboard?.watch_time || {};
  const devices = dashboard?.devices || {};
  const locations = dashboard?.locations || {};
  const streamHealth = dashboard?.stream_health || {};
  const attendance = dashboard?.attendance_report || {};
  const viewerTimeline = dashboard?.viewer_timeline || [];
  const watchDistribution = watchTime.watch_time_distribution || [];

  const currentViewers = realtime?.current_viewers ?? overview.current_viewers ?? 0;
  const lastUpdated = realtime?.last_updated || overview.last_updated || null;

  const engagementPie = useMemo(
    () =>
      [
        { name: "Likes", value: num(engagement.likes) },
        { name: "Comments", value: num(engagement.comments) },
        { name: "Shares", value: num(engagement.shares) },
      ].filter((item) => item.value > 0),
    [engagement],
  );

  if (loading) {
    return (
      <div className="tw:min-h-screen tw:bg-white">
        <SideBarNav />
        <div className="page_wrapper tw:flex tw:min-h-[70vh] tw:items-center tw:justify-center">
          <LoaderCircle className="tw:h-8 tw:w-8 tw:animate-spin tw:text-accent" />
        </div>
      </div>
    );
  }

  return (
    <div className="tw:min-h-screen tw:bg-white" data-analytics-part="analytics-page">
      <SideBarNav />

      {/* page_wrapper is the app shell's own content offset (300px, 70px when the
          nav collapses) — the bootstrap col + tw:lg:ml-30 pair used here before
          put the page under the fixed sidebar. */}
      <div className="page_wrapper overflow-hidden">
        <div className="tw:mx-auto tw:max-w-[1240px] tw:space-y-6 tw:pb-16 tw:pt-2 tw:2xl:max-w-[1520px]">
          {/* Hero: what is happening right now, then the two things a host asks
              first — how many are watching, and how much has come in. */}
          <Card part="hero">
            <div className="tw:flex tw:flex-col tw:gap-5 tw:lg:flex-row tw:lg:items-center tw:lg:justify-between">
              <div className="tw:flex tw:items-start tw:gap-3">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                  className="tw:mt-1 tw:flex tw:h-9 tw:w-9 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-[#ded6cd] tw:bg-white tw:text-gray-700 tw:transition tw:hover:bg-[#f4f1ee]"
                >
                  <ArrowLeft className="tw:h-4 tw:w-4" />
                </button>

                <div className="tw:min-w-0">
                  <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
                    <span className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
                      Stream analytics
                    </span>
                    <StatusPill status={overview.event_status} />
                  </div>
                  <h1 className="tw:mt-2 tw:text-2xl tw:font-bold tw:text-gray-900 tw:md:text-3xl">
                    {overview.event_title || "Event stream analytics"}
                  </h1>
                  <p className="tw:mt-1 tw:text-sm tw:text-gray-500">
                    Updated {timeAgo(lastUpdated, now)} · refreshes every 8 seconds
                  </p>
                </div>
              </div>

              <div className="tw:flex tw:items-center tw:gap-4">
                <div className="tw:text-right">
                  <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-gray-500">
                    Watching now
                  </div>
                  <div
                    data-analytics-part="watching-now"
                    className="tw:text-3xl tw:font-bold tw:text-gray-900 tw:md:text-4xl"
                  >
                    {count(currentViewers)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loadDashboard({ background: true })}
                  disabled={refreshing}
                  className="tw:inline-flex tw:h-11 tw:shrink-0 tw:items-center tw:justify-center tw:gap-2 tw:rounded-full tw:bg-accent tw:px-5 tw:text-sm tw:font-semibold tw:text-white tw:transition tw:hover:bg-accent-deep tw:disabled:opacity-60"
                >
                  {refreshing ? (
                    <LoaderCircle className="tw:h-4 tw:w-4 tw:animate-spin" />
                  ) : (
                    <RefreshCcw className="tw:h-4 tw:w-4" />
                  )}
                  Refresh
                </button>
              </div>
            </div>
          </Card>

          {/* Audience and money first: the two questions that decide whether the
              evening worked. */}
          <section className="tw:grid tw:grid-cols-2 tw:gap-4 tw:xl:grid-cols-4">
            <Kpi
              part="kpi-peak"
              icon={TrendingUp}
              tone="brand"
              label="Peak viewers"
              value={count(overview.peak_viewers)}
              sub="Most watching at once"
            />
            <Kpi
              part="kpi-unique"
              icon={Users}
              label="Unique viewers"
              value={count(overview.unique_viewers)}
              sub="Different people who watched"
            />
            <Kpi
              part="kpi-watch"
              icon={Clock3}
              label="Watch time"
              value={minutes(overview.total_watch_minutes)}
              sub="Total across everyone"
            />
            <Kpi
              part="kpi-tickets"
              icon={Ticket}
              label="Tickets sold"
              value={count(overview.tickets_sold)}
              sub="Your own exact count"
            />
          </section>

          <section className="tw:grid tw:grid-cols-2 tw:gap-4 tw:xl:grid-cols-4">
            <Kpi
              part="kpi-gross"
              icon={ReceiptText}
              label="Gross revenue"
              value={money(overview.gross_revenue)}
            />
            <Kpi
              part="kpi-earning"
              icon={Sparkles}
              label="Your earning"
              value={money(overview.organizer_earning)}
              sub="60% streamed ticket share"
            />
            <Kpi
              part="kpi-chat"
              icon={MessageCircle}
              label="Chat messages"
              value={count(overview.chat_messages)}
            />
            <Kpi
              part="kpi-likes"
              icon={Heart}
              label="Likes"
              value={count(engagement.likes)}
            />
          </section>

          {/* Audience over time is the headline chart: full width. */}
          <Panel
            part="viewer-timeline"
            title="Audience over time"
            icon={Signal}
            hint="Viewers present, and joins against leaves"
          >
            <ChartFrame empty={!viewerTimeline.length} height={280} emptyLabel="No audience data yet">
              <ResponsiveContainer>
                <AreaChart data={viewerTimeline} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={SERIES.accent} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={SERIES.accent} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#eee7e0" vertical={false} />
                  <XAxis dataKey="time" {...axisProps()} />
                  <YAxis allowDecimals={false} {...axisProps()} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="viewers"
                    name="Viewers"
                    stroke={SERIES.accent}
                    strokeWidth={2}
                    fill="url(#viewersFill)"
                  />
                  <Line type="monotone" dataKey="joins" name="Joins" stroke={SERIES.emerald} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="leaves" name="Leaves" stroke={SERIES.red} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartFrame>
          </Panel>

          <section className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-2">
            <Panel
              part="sales-timeline"
              title="Tickets sold per day"
              icon={ReceiptText}
              hint="Ticket count — revenue lives in the tiles above"
            >
              <ChartFrame empty={!revenue.sales_timeline?.length} height={260} emptyLabel="No sales yet">
                <ResponsiveContainer>
                  <BarChart data={revenue.sales_timeline || []} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#eee7e0" vertical={false} />
                    <XAxis dataKey="date" {...axisProps()} />
                    <YAxis allowDecimals={false} {...axisProps()} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => count(value)} />
                    <Bar dataKey="tickets" name="Tickets" fill={SERIES.accent} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>

            <Panel
              part="engagement-mix"
              title="How they engaged"
              icon={Heart}
              hint="Likes, comments and shares"
            >
              <ChartFrame empty={!engagementPie.length} height={260} emptyLabel="No reactions yet">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={engagementPie}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={58}
                      outerRadius={96}
                      paddingAngle={2}
                    >
                      {engagementPie.map((entry, index) => (
                        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => count(value)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>
          </section>

          <section className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-2">
            <Panel
              part="engagement-timeline"
              title="Engagement over time"
              icon={Share2}
              hint="Reactions as the stream went on"
            >
              <ChartFrame empty={!engagement.timeline?.length} height={260} emptyLabel="No engagement yet">
                <ResponsiveContainer>
                  <LineChart data={engagement.timeline || []} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#eee7e0" vertical={false} />
                    <XAxis dataKey="time" {...axisProps()} />
                    <YAxis allowDecimals={false} {...axisProps()} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="likes" name="Likes" stroke={SERIES.red} strokeWidth={2} dot={false} />
                    <Line
                      type="monotone"
                      dataKey="comments"
                      name="Comments"
                      stroke={SERIES.accent}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line type="monotone" dataKey="shares" name="Shares" stroke={SERIES.amber} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>

            <Panel
              part="watch-distribution"
              title="How long people stayed"
              icon={Clock3}
              hint="Viewers by watch length"
            >
              <ChartFrame empty={!watchDistribution.length} height={260} emptyLabel="No watch data yet">
                <ResponsiveContainer>
                  <BarChart data={watchDistribution} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#eee7e0" vertical={false} />
                    <XAxis dataKey="range" {...axisProps()} />
                    <YAxis allowDecimals={false} {...axisProps()} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => count(value)} />
                    <Bar dataKey="users" name="Viewers" fill={SERIES.violet} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>
          </section>

          <section className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-3">
            <Panel part="devices" title="Devices" icon={MonitorSmartphone} hint="What they watched on">
              <ChartFrame empty={!devices.device_types?.length} height={240} emptyLabel="No device data yet">
                <ResponsiveContainer>
                  <BarChart
                    data={(devices.device_types || []).slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="4 4" stroke="#eee7e0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} {...axisProps()} />
                    <YAxis type="category" dataKey="label" width={72} {...axisProps()} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => count(value)} />
                    <Bar dataKey="count" name="Viewers" fill={SERIES.accent} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>

            <Panel part="locations" title="Where they watched" icon={MapPin} hint="Top cities">
              <div className="tw:space-y-2">
                {(locations.top_cities || []).slice(0, 6).map((item) => (
                  <div
                    key={item.label}
                    className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:rounded-2xl tw:bg-[#faf8f6] tw:px-3 tw:py-2.5 tw:text-sm"
                  >
                    <span className="tw:truncate tw:text-gray-700">{item.label}</span>
                    <span className="tw:shrink-0 tw:font-semibold tw:text-gray-900">{count(item.count)}</span>
                  </div>
                ))}
                {!locations.top_cities?.length ? (
                  <p className="tw:text-sm tw:text-gray-600">No location data yet.</p>
                ) : null}
              </div>
            </Panel>

            <Panel part="stream-health" title="Stream health" icon={Activity} hint="How the feed held up">
              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <Kpi
                  icon={Radio}
                  label="Status"
                  value={
                    streamHealth.stream_status
                      ? String(streamHealth.stream_status).replace(/^./, (c) => c.toUpperCase())
                      : "Unknown"
                  }
                />
                <Kpi icon={Clock3} label="Uptime" value={`${count(streamHealth.uptime_minutes)}m`} />
                <Kpi icon={Video} label="Buffering" value={count(streamHealth.buffering_reports)} />
                <Kpi icon={Video} label="Errors" value={count(streamHealth.playback_errors)} />
              </div>
            </Panel>
          </section>

          <section className="tw:grid tw:grid-cols-1 tw:items-start tw:gap-6 tw:xl:grid-cols-2">
            <Panel part="attendance" title="Attendance" icon={Ticket} hint="Registered against attended">
              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <Kpi icon={Users} label="Registered" value={count(attendance.registered_users)} />
                <Kpi icon={Ticket} label="Buyers" value={count(attendance.ticket_buyers)} />
                <Kpi icon={Radio} label="Attended" value={count(attendance.attended_users)} />
                <Kpi icon={BarChart3} label="Turn-up rate" value={`${num(attendance.attendance_rate)}%`} tone="brand" />
              </div>
            </Panel>

            <TopViewers
              viewers={topViewers}
              meta={topViewersMeta}
              loading={topViewersLoading}
              onPage={loadTopViewers}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
