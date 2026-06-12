import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
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
  Ticket,
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

const COLORS = ["#00A7B5", "#6D5DFB", "#F59E0B", "#10B981", "#EF4444", "#334155"];

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

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-4 tw:shadow-sm">
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div>
          <span className="tw:block tw:text-xs tw:font-semibold tw:uppercase tw:text-slate-500">{label}</span>
          <span className="tw:block tw:mt-2 tw:text-2xl tw:font-bold tw:text-slate-950">{value}</span>
        </div>
        <span className="tw:flex tw:h-10 tw:w-10 tw:items-center tw:justify-center tw:rounded-xl tw:bg-[#e9fbfd] tw:text-primary">
          <Icon className="tw:h-5 tw:w-5" />
        </span>
      </div>
      {hint ? <span className="tw:block tw:mt-2 tw:text-xs tw:text-slate-500">{hint}</span> : null}
    </div>
  );
}

function Panel({ title, icon: Icon, children, action }) {
  return (
    <section className="tw:rounded-2xl tw:border tw:border-slate-200 tw:bg-white tw:p-5 tw:shadow-sm">
      <div className="tw:mb-4 tw:flex tw:items-center tw:justify-between tw:gap-3">
        <div className="tw:flex tw:items-center tw:gap-2">
          <Icon className="tw:h-5 tw:w-5 tw:text-primary" />
          <span className="tw:block tw:text-base tw:font-semibold tw:text-slate-950">{title}</span>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="tw:flex tw:h-[260px] tw:items-center tw:justify-center tw:rounded-2xl tw:border tw:border-dashed tw:border-slate-200 tw:text-sm tw:text-slate-500">
      No data yet
    </div>
  );
}

function ChartFrame({ children, empty }) {
  if (empty) return <EmptyChart />;

  return <div className="tw:h-[280px] tw:w-full">{children}</div>;
}

function TopViewersTable({ viewers, meta, loading, onPage }) {
  return (
    <Panel
      title="Top Viewers"
      icon={Users}
      action={
        <div className="tw:text-xs tw:text-slate-500">
          Page {meta?.current_page || 1} of {meta?.last_page || 1}
        </div>
      }
    >
      <div className="tw:overflow-x-auto">
        <table className="tw:w-full tw:min-w-[720px] tw:text-left tw:text-sm">
          <thead>
            <tr className="tw:border-b tw:border-slate-200 tw:text-xs tw:uppercase tw:text-slate-500">
              <th className="tw:py-3">Viewer</th>
              <th className="tw:py-3">Email</th>
              <th className="tw:py-3">Watch minutes</th>
              <th className="tw:py-3">Sessions</th>
              <th className="tw:py-3">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="tw:py-6 tw:text-slate-500" colSpan={5}>
                  Loading viewers...
                </td>
              </tr>
            ) : viewers.length ? (
              viewers.map((viewer) => (
                <tr key={viewer.user_id} className="tw:border-b tw:border-slate-100">
                  <td className="tw:py-3 tw:font-medium tw:text-slate-900">{viewer.name || "Viewer"}</td>
                  <td className="tw:py-3 tw:text-slate-600">{viewer.email || "Not available"}</td>
                  <td className="tw:py-3 tw:text-slate-900">{viewer.watch_minutes ?? 0}</td>
                  <td className="tw:py-3 tw:text-slate-600">{viewer.total_sessions ?? 0}</td>
                  <td className="tw:py-3 tw:text-slate-600">{viewer.last_seen || "Not available"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="tw:py-6 tw:text-slate-500" colSpan={5}>
                  No viewer sessions have been recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="tw:mt-4 tw:flex tw:justify-end tw:gap-2">
        <button
          type="button"
          disabled={loading || (meta?.current_page || 1) <= 1}
          onClick={() => onPage((meta?.current_page || 1) - 1)}
          className="tw:rounded-xl tw:border tw:border-slate-200 tw:px-3 tw:py-2 tw:text-sm tw:font-semibold tw:text-slate-700 disabled:tw:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={loading || (meta?.current_page || 1) >= (meta?.last_page || 1)}
          onClick={() => onPage((meta?.current_page || 1) + 1)}
          className="tw:rounded-xl tw:border tw:border-slate-200 tw:px-3 tw:py-2 tw:text-sm tw:font-semibold tw:text-slate-700 disabled:tw:opacity-50"
        >
          Next
        </button>
      </div>
    </Panel>
  );
}

export default function EventStreamAnalyticsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topViewers, setTopViewers] = useState([]);
  const [topViewersMeta, setTopViewersMeta] = useState(null);
  const [topViewersLoading, setTopViewersLoading] = useState(false);

  const loadDashboard = useCallback(async ({ background = false } = {}) => {
    if (!eventId || !token) return;

    if (background) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await api.get(`/api/v1/events/${eventId}/analytics/dashboard`, authHeaders(token));
      const nextDashboard = response?.data?.data || null;
      setDashboard(nextDashboard);
      setRealtime(nextDashboard?.realtime || null);
    } catch (error) {
      showError(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventId, token]);

  const loadRealtime = useCallback(async () => {
    if (!eventId || !token) return;

    try {
      const response = await api.get(`/api/v1/events/${eventId}/analytics/realtime`, authHeaders(token));
      setRealtime(response?.data?.data || null);
    } catch (error) {
      if (!import.meta.env.PROD) console.warn("[analytics] realtime refresh failed", error);
    }
  }, [eventId, token]);

  const loadTopViewers = useCallback(async (page = 1) => {
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
  }, [eventId, token]);

  useEffect(() => {
    loadDashboard();
    loadTopViewers();
  }, [loadDashboard, loadTopViewers]);

  useEffect(() => {
    const timer = window.setInterval(loadRealtime, 8000);
    return () => window.clearInterval(timer);
  }, [loadRealtime]);

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

  const engagementPie = useMemo(() => [
    { name: "Likes", value: num(engagement.likes) },
    { name: "Comments", value: num(engagement.comments) },
    { name: "Shares", value: num(engagement.shares) },
  ].filter((item) => item.value > 0), [engagement]);

  if (loading) {
    return (
      <div className="tw:min-h-screen tw:bg-[#f8fafc]">
        <SideBarNav />
        <div className="tw:flex tw:min-h-screen tw:items-center tw:justify-center">
          <LoaderCircle className="tw:h-8 tw:w-8 tw:animate-spin tw:text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="tw:min-h-screen tw:bg-[#f8fafc] tw:text-slate-900">
      <div className="tw:mt-20 tw:pb-16 tw:px-4 tw:py-6 tw:md:ml-[280px] tw:md:px-8">
        <div className="tw:mx-auto tw:max-w-7xl tw:space-y-6">
          <div className="tw:flex tw:flex-col tw:gap-4 tw:md:flex-row tw:md:items-center tw:md:justify-between">
            <div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="tw:mb-4 tw:inline-flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold tw:text-slate-600 tw:hover:text-primary"
              >
                <ArrowLeft className="tw:h-4 tw:w-4" />
                Back
              </button>
              <div className="tw:flex tw:items-center tw:gap-3">
                <span className="tw:flex tw:h-11 tw:w-11 tw:items-center tw:justify-center tw:rounded-2xl tw:bg-primary tw:text-white">
                  <BarChart3 className="tw:h-5 tw:w-5" />
                </span>
                <div>
                  <span className="tw:block tw:text-2xl tw:font-bold tw:text-slate-950 tw:md:text-3xl">
                    {overview.event_title || "Event stream analytics"}
                  </span>
                  <span className="tw:block tw:text-sm tw:text-slate-500">
                    Status: {overview.event_status || "unknown"} • Updated {realtime?.last_updated || "now"}
                  </span>
                </div>
              </div>
            </div>
            <button
              style={{ borderRadius: 16, fontSize: 12 }}
              type="button"
              onClick={() => loadDashboard({ background: true })}
              disabled={refreshing}
              className="tw:inline-flex tw:h-11 tw:items-center tw:justify-center tw:gap-2 tw:rounded-xl tw:bg-primary tw:px-4 tw:text-sm tw:font-semibold tw:text-white disabled:tw:opacity-60"
            >
              {refreshing ? <LoaderCircle className="tw:h-4 tw:w-4 tw:animate-spin" /> : <RefreshCcw className="tw:h-4 tw:w-4" />}
              Refresh
            </button>
          </div>

          <section className="tw:grid tw:grid-cols-1 tw:gap-4 tw:md:grid-cols-2 tw:xl:grid-cols-4">
            <StatCard icon={Radio} label="Current viewers" value={realtime?.current_viewers ?? overview.current_viewers ?? 0} hint="Organizer account excluded" />
            <StatCard icon={Signal} label="Peak viewers" value={overview.peak_viewers ?? 0} />
            <StatCard icon={Users} label="Unique viewers" value={overview.unique_viewers ?? 0} />
            <StatCard icon={Clock3} label="Watch minutes" value={overview.total_watch_minutes ?? 0} />
            <StatCard icon={Ticket} label="Tickets sold" value={overview.tickets_sold ?? 0} />
            <StatCard icon={ReceiptText} label="Gross revenue" value={money(overview.gross_revenue)} />
            <StatCard icon={ReceiptText} label="Organizer earning" value={money(overview.organizer_earning)} hint="60% streamed ticket share" />
            <StatCard icon={MessageCircle} label="Chat messages" value={overview.chat_messages ?? 0} />
          </section>

          <section className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-3">
            <Panel title="Viewer Timeline" icon={Signal}>
              <ChartFrame empty={!viewerTimeline.length}>
                <ResponsiveContainer>
                  <AreaChart data={viewerTimeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" hide />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="viewers" stroke="#00A7B5" fill="#BFF6FB" />
                    <Line type="monotone" dataKey="joins" stroke="#10B981" />
                    <Line type="monotone" dataKey="leaves" stroke="#EF4444" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>

            <Panel title="Sales Timeline" icon={ReceiptText}>
              <ChartFrame empty={!revenue.sales_timeline?.length}>
                <ResponsiveContainer>
                  <BarChart data={revenue.sales_timeline || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tickets" fill="#00A7B5" />
                    <Bar dataKey="revenue" fill="#6D5DFB" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>

            <Panel title="Engagement Mix" icon={Heart}>
              <ChartFrame empty={!engagementPie.length}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={engagementPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                      {engagementPie.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>
          </section>

          <section className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-2">
            <Panel title="Engagement Timeline" icon={Share2}>
              <ChartFrame empty={!engagement.timeline?.length}>
                <ResponsiveContainer>
                  <LineChart data={engagement.timeline || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" hide />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="likes" stroke="#EF4444" />
                    <Line type="monotone" dataKey="comments" stroke="#00A7B5" />
                    <Line type="monotone" dataKey="shares" stroke="#F59E0B" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>

            <Panel title="Watch Time Distribution" icon={Clock3}>
              <ChartFrame empty={!watchDistribution.length}>
                <ResponsiveContainer>
                  <BarChart data={watchDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="users" fill="#6D5DFB" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>
          </section>

          <section className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-2">
            <Panel title="Devices" icon={MonitorSmartphone}>
              <ChartFrame empty={!devices.device_types?.length}>
                <ResponsiveContainer>
                  <BarChart data={devices.device_types || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00A7B5" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>
          </section>

          <section className="tw:grid tw:grid-cols-1 tw:gap-6 tw:xl:grid-cols-3">
            <Panel title="Stream Health" icon={Video}>
              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <StatCard icon={Signal} label="Status" value={streamHealth.stream_status || "unknown"} />
                <StatCard icon={Clock3} label="Uptime" value={`${streamHealth.uptime_minutes || 0}m`} />
                <StatCard icon={Video} label="Buffering" value={streamHealth.buffering_reports || 0} />
                <StatCard icon={Video} label="Errors" value={streamHealth.playback_errors || 0} />
              </div>
            </Panel>

            <Panel title="Attendance" icon={Ticket}>
              <div className="tw:grid tw:grid-cols-2 tw:gap-3">
                <StatCard icon={Users} label="Registered" value={attendance.registered_users || 0} />
                <StatCard icon={Ticket} label="Buyers" value={attendance.ticket_buyers || 0} />
                <StatCard icon={Radio} label="Attended" value={attendance.attended_users || 0} />
                <StatCard icon={BarChart3} label="Rate" value={`${attendance.attendance_rate || 0}%`} />
              </div>
            </Panel>

            <Panel title="Locations" icon={MapPin}>
              <div className="tw:space-y-3">
                {(locations.top_cities || []).slice(0, 6).map((item) => (
                  <div key={item.label} className="tw:flex tw:items-center tw:justify-between tw:rounded-xl tw:bg-slate-50 tw:px-3 tw:py-2 tw:text-sm">
                    <span className="tw:text-slate-700">{item.label}</span>
                    <span className="tw:font-semibold tw:text-slate-950">{item.count}</span>
                  </div>
                ))}
                {!locations.top_cities?.length ? <div className="tw:text-sm tw:text-slate-500">No location data yet.</div> : null}
              </div>
            </Panel>
          </section>

          <TopViewersTable
            viewers={topViewers}
            meta={topViewersMeta}
            loading={topViewersLoading}
            onPage={loadTopViewers}
          />
        </div>
      </div>
    </div>
  );
}
