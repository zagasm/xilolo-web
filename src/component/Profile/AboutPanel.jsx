import { truncate } from "../../utils/helpers";

function safeValue(v) {
  if (v === undefined || v === null || v === "") return "—";
  if (typeof v === "string" || typeof v === "number") return v;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "object") {
    return v?.organiser || v?.name || v?.title || "—";
  }
  return String(v);
}

export default function AboutPanel({ user }) {
  if (!user) return null;

  const isOrganiserProfileData =
    !!user?.organiser || (!!user?.userId && !!user?.allEvents);

  const displayName =
    user?.name ||
    (typeof user?.organiser === "string" ? user.organiser : user?.organiser?.organiser) ||
    user?.userName ||
    "This profile";

  const aboutText = String(
    user?.about ||
      user?.organiser?.about ||
      ""
  ).trim();

  const organiserName =
    typeof user?.organiser === "string"
      ? user.organiser
      : user?.organiser?.organiser ||
        user?.organiser?.name ||
        user?.name ||
        "—";

  const rows = isOrganiserProfileData
    ? [
        ["Organizer Name", organiserName],
        ["Email", truncate(user?.email, 22)],
        ["KYC Status", user?.kyc_status ?? user?.kyc?.status],
        ["Followers", user?.numberOfFollowers ?? user?.followers_count],
        ["Tickets Sold", user?.tickets_total ?? user?.successfulPayments],
        ["Ranking", user?.rank],
      ]
    : [
        ["Username", user?.userName],
        ["Email", truncate(user?.email, 22)],
        ["Phone", user?.phoneNumber],
        ["Gender", user?.gender],
        ["DOB", user?.dob],
        ["Age", user?.age],
      ];

  return (
    <div className="tw:mt-3 tw:rounded-[28px] tw:border tw:border-gray-100 tw:bg-white tw:p-5 tw:shadow-[0_14px_34px_rgba(15,23,42,0.05)] tw:md:p-6">
      <div className="tw:flex tw:flex-col tw:gap-5">
        <div className="tw:overflow-hidden tw:rounded-3xl tw:border tw:border-slate-100 tw:bg-[radial-gradient(circle_at_top,rgba(0,245,255,0.10),transparent_40%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] tw:p-5">
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.22em] tw:text-slate-500">
            About
          </div>
          <div className="tw:mt-2 tw:text-lg tw:font-semibold tw:text-slate-900">
            {isOrganiserProfileData ? `Meet ${displayName}` : `More about ${displayName}`}
          </div>
          <p className="tw:mt-3 tw:text-sm tw:leading-7 tw:text-slate-600 tw:md:text-[15px]">
            {aboutText ||
              (isOrganiserProfileData
                ? "This organizer has not added a public introduction yet, but you can still explore their events and profile activity."
                : "This member has not added a public introduction yet. Profile details will appear here once updated.")}
          </p>
        </div>

        <div>
          <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.2em] tw:text-slate-500">
            Profile Snapshot
          </div>
          <div className="tw:mt-4 tw:grid tw:grid-cols-1 tw:gap-3 tw:sm:grid-cols-2">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="tw:rounded-2xl tw:border tw:border-slate-100 tw:bg-slate-50/70 tw:p-4"
              >
                <div className="tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-[0.16em] tw:text-slate-500">
                  {label}
                </div>
                <div className="tw:mt-2 tw:text-sm tw:font-medium tw:leading-6 tw:text-slate-900">
                  {safeValue(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
