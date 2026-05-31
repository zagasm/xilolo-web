import { useCallback, useEffect, useState } from "react";
import { Copy, LoaderCircle, QrCode, RotateCcw, ShieldCheck, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../auth/AuthContext";
import { showError, showPromise } from "../../component/ui/toast";

function Stat({ label, value }) {
  return (
    <div className="tw:rounded-2xl tw:bg-[#f5efe7] tw:p-4">
      <div className="tw:text-xs tw:uppercase tw:tracking-wide tw:text-gray-500">{label}</div>
      <div className="tw:mt-1 tw:text-2xl tw:font-semibold tw:text-gray-900">{value ?? 0}</div>
    </div>
  );
}

export default function EventCheckinControlPage() {
  const { eventId } = useParams();
  const { token } = useAuth();
  const [accesses, setAccesses] = useState([]);
  const [stats, setStats] = useState(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [accessResponse, statsResponse] = await Promise.all([
        api.get(`/api/v1/events/${eventId}/checkin-access`, authHeaders(token)),
        api.get(`/api/v1/events/${eventId}/checkin-stats`, authHeaders(token)),
      ]);
      setAccesses(accessResponse?.data?.data || []);
      setStats(statsResponse?.data?.data || null);
    } catch (error) {
      showError(error?.response?.data?.message || "Could not load check-in controls");
    } finally {
      setLoading(false);
    }
  }, [eventId, token]);

  useEffect(() => void load(), [load]);

  const activeAccess = accesses.find((access) => access.is_active && !access.revoked_at) || null;

  async function perform(label, request) {
    setPending(label);
    try {
      const response = await showPromise(request, {
        loading: "Updating check-in access…",
        success: "Check-in access updated",
        error: "Could not update check-in access",
      });
      setGeneratedCode(response?.data?.data?.access_code || "");
      await load();
    } finally {
      setPending("");
    }
  }

  return (
    <main className="tw:min-h-screen tw:bg-[#fff8f0] tw:px-4 tw:py-24">
      <div className="tw:mx-auto tw:max-w-5xl">
        <div className="tw:flex tw:flex-col tw:gap-4 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
          <div>
            <div className="tw:flex tw:items-center tw:gap-2 tw:text-primary"><ShieldCheck className="tw:h-5 tw:w-5" /> Check-in management</div>
            <h1 className="tw:mt-2 tw:text-2xl tw:font-semibold tw:text-gray-900">{stats?.event_title || "Event check-in"}</h1>
          </div>
          <div className="tw:flex tw:flex-wrap tw:gap-2">
            <button className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-xl tw:bg-primary tw:px-4 tw:py-2.5 tw:text-sm tw:text-white" onClick={() => perform("generate", api.post(`/api/v1/events/${eventId}/checkin-access`, {}, authHeaders(token)))} disabled={!!pending}>
              {pending === "generate" ? <LoaderCircle className="tw:h-4 tw:w-4 tw:animate-spin" /> : <QrCode className="tw:h-4 tw:w-4" />} Generate code
            </button>
            {activeAccess ? <button className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-xl tw:border tw:border-gray-300 tw:bg-white tw:px-4 tw:py-2.5 tw:text-sm" onClick={() => perform("rotate", api.post(`/api/v1/events/${eventId}/checkin-access/${activeAccess.id}/rotate`, {}, authHeaders(token)))} disabled={!!pending}><RotateCcw className="tw:h-4 tw:w-4" /> Rotate</button> : null}
          </div>
        </div>

        {generatedCode ? <div className="tw:mt-5 tw:rounded-2xl tw:border tw:border-emerald-200 tw:bg-emerald-50 tw:p-4"><div className="tw:text-sm">Copy this code now. It is only shown once.</div><div className="tw:mt-2 tw:flex tw:flex-wrap tw:items-center tw:gap-3"><code className="tw:break-all tw:text-base">{generatedCode}</code><button className="tw:inline-flex tw:items-center tw:gap-1 tw:text-sm tw:text-emerald-800" onClick={() => navigator.clipboard.writeText(generatedCode)}><Copy className="tw:h-4 tw:w-4" /> Copy</button></div></div> : null}

        <div className="tw:mt-6 tw:grid tw:grid-cols-2 tw:gap-3 tw:lg:grid-cols-5">
          <Stat label="Purchased" value={stats?.tickets_sold} />
          <Stat label="Checked in" value={stats?.checked_in} />
          <Stat label="Checked out" value={stats?.checked_out} />
          <Stat label="Remaining" value={stats?.remaining} />
          <Stat label="Active staff" value={stats?.active_sessions} />
        </div>

        <section className="tw:mt-6 tw:rounded-2xl tw:border tw:border-gray-200 tw:bg-white tw:p-4">
          <div className="tw:flex tw:items-center tw:gap-2"><Users className="tw:h-5 tw:w-5" /><h2 className="tw:text-lg tw:font-medium">Active check-in staff</h2></div>
          {loading ? <LoaderCircle className="tw:mt-4 tw:h-5 tw:w-5 tw:animate-spin" /> : stats?.checkin_staff?.length ? <div className="tw:mt-4 tw:grid tw:gap-3 tw:md:grid-cols-2">{stats.checkin_staff.map((staff) => <div key={staff.session_id} className="tw:rounded-xl tw:bg-gray-50 tw:p-3 tw:text-sm"><div className="tw:font-medium">{staff.device_label || "Unnamed device"}</div><div className="tw:mt-1 tw:text-xs tw:text-gray-500">IP: {staff.ip_address || "Unavailable"}</div><div className="tw:text-xs tw:text-gray-500">Last active: {staff.last_used_at ? new Date(staff.last_used_at).toLocaleString() : "Never"}</div></div>)}</div> : <p className="tw:mt-3 tw:text-sm tw:text-gray-500">No scanner sessions are active.</p>}
        </section>

        {activeAccess ? <button className="tw:mt-4 tw:text-sm tw:text-red-700" onClick={() => perform("revoke", api.patch(`/api/v1/events/${eventId}/checkin-access/${activeAccess.id}/revoke`, {}, authHeaders(token)))} disabled={!!pending}>Revoke current code ending in {activeAccess.plain_code_last_four}</button> : null}
      </div>
    </main>
  );
}
