import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

function MentionCard({ item, onAccept, onReject, isProcessing }) {
  const { event } = item || {};
  const owner = event?.owner;

  const taggedAt = item?.createdAt
    ? new Date(item.createdAt).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const statusLabelMap = {
    pending: "Pending",
    approved: "Accepted",
    rejected: "Rejected",
  };

  const statusColorMap = {
    pending: "tw:bg-amber-50 tw:text-amber-700 tw:ring-1 tw:ring-amber-200",
    approved:
      "tw:bg-emerald-50 tw:text-emerald-700 tw:ring-1 tw:ring-emerald-200",
    rejected: "tw:bg-rose-50 tw:text-rose-700 tw:ring-1 tw:ring-rose-200",
  };

  return (
    <div className="tw:relative tw:overflow-hidden tw:rounded-2xl tw:bg-white tw:p-4 tw:shadow-sm tw:ring-1 tw:ring-black/5">
      {/* top row */}
      <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
        <div className="tw:flex-1 tw:space-y-1.5">
          <span className="tw:block tw:text-[11px] tw:font-medium tw:uppercase tw:tracking-wide tw:text-gray-400">
            Event
          </span>
          <Link
            to={`/event/view/${event?.id}`}
            className="tw:text-sm tw:font-semibold tw:text-gray-900 tw:hover:text-primary tw:transition-colors"
          >
            {event?.title || "Untitled event"}
          </Link>
          <span className="tw:block tw:text-xs tw:text-gray-500">
            Hosted by{" "}
            <span className="tw:font-medium tw:text-gray-700">
              {owner?.name || "Unknown organiser"}
            </span>{" "}
            {owner?.user_name && (
              <span className="tw:text-[11px] tw:text-gray-400">
                · {owner.user_name}
              </span>
            )}
          </span>
        </div>

        <span
          className={`tw:inline-flex tw:items-center tw:gap-1 tw:rounded-full tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-medium ${
            statusColorMap[item.status] || "tw:bg-gray-100 tw:text-gray-700"
          }`}
        >
          <span
            className={`tw:h-1.5 tw:w-1.5 tw:rounded-full ${
              item.status === "approved"
                ? "tw:bg-emerald-500"
                : item.status === "rejected"
                ? "tw:bg-rose-500"
                : "tw:bg-amber-400"
            }`}
          />
          {statusLabelMap[item.status] || item.status}
        </span>
      </div>

      {/* main content */}
      <div className="tw:mt-4 tw:grid tw:gap-4 tw:md:grid-cols-[minmax(0,1.45fr),minmax(0,1.1fr)]">
        {/* event meta */}
        <div className="tw:space-y-1.5 tw:text-xs tw:text-gray-600">
          <div className="tw:flex tw:items-center tw:gap-1.5">
            <CalendarDays className="tw:h-4 tw:w-4 tw:text-gray-400" />
            <span>{event?.date_label || event?.date || "Date TBA"}</span>
          </div>
          <div className="tw:flex tw:items-center tw:gap-1.5">
            <Clock className="tw:h-4 tw:w-4 tw:text-gray-400" />
            <span>{event?.startTime || "Time TBA"}</span>
          </div>
          <div className="tw:flex tw:items-center tw:gap-1.5">
            <MapPin className="tw:h-4 tw:w-4 tw:text-gray-400" />
            <span>{event?.location || "Location TBA"}</span>
          </div>
          {event?.type && (
            <span className="tw:mt-1 tw:inline-flex tw:items-center tw:rounded-full tw:bg-gray-100 tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-medium tw:uppercase tw:text-gray-600">
              {event.type}
            </span>
          )}
        </div>

        {/* performer meta */}
        <div className="tw:rounded-xl tw:bg-lightPurple tw:p-3.5 tw:text-xs tw:text-gray-800">
          <span className="tw:block tw:text-[11px] tw:font-semibold tw:uppercase tw:tracking-wide tw:text-primary">
            You are tagged as
          </span>
          <span className="tw:block tw:mt-1 tw:text-sm tw:font-semibold tw:text-gray-900">
            {item.role
              ? item.role.charAt(0).toUpperCase() + item.role.slice(1)
              : "Performer"}
          </span>
          {item.bio && (
            <span className="tw:block tw:mt-1 tw:line-clamp-2 tw:text-xs tw:text-gray-600">
              “{item.bio}”
            </span>
          )}
          <span className="tw:block tw:mt-3 tw:text-[11px] tw:text-gray-500">
            Tagged on{" "}
            <span className="tw:font-medium tw:text-gray-700">
              {taggedAt || "—"}
            </span>
          </span>
        </div>
      </div>

      {/* footer actions */}
      <div className="tw:mt-4 tw:flex tw:flex-col tw:items-stretch tw:justify-between tw:gap-3 tw:border-t tw:border-gray-100 tw:pt-3 tw:sm:flex-row tw:sm:items-center">
        <Link
          to={`/event/view/${event?.id}`}
          className="tw:inline-flex tw:w-full tw:items-center tw:justify-start tw:gap-1.5 tw:text-xs tw:font-medium tw:text-primary tw:hover:text-primarySecond tw:sm:w-auto"
        >
          <span className="tw:h-1 tw:w-1 tw:rounded-full tw:bg-primary" />
          View event details
        </Link>

        {item.status === "pending" ? (
          <div className="tw:flex tw:flex-1 tw:justify-end tw:gap-2">
            <button
              style={{
                borderRadius: 12,
              }}
              type="button"
              disabled={isProcessing}
              onClick={() => onReject && onReject(item)}
              className="tw:inline-flex tw:flex-1 tw:items-center tw:justify-center tw:rounded-full! tw:border tw:border-gray-300 tw:bg-white tw:px-3 tw:py-2 tw:text-xs tw:font-medium tw:text-gray-700 tw:hover:bg-gray-50 tw:disabled:cursor-not-allowed tw:disabled:opacity-60 tw:sm:flex-none tw:sm:w-auto"
            >
              {isProcessing ? "Processing…" : "Reject"}
            </button>
            <button
              style={{
                borderRadius: 12,
              }}
              type="button"
              disabled={isProcessing}
              onClick={() => onAccept && onAccept(item)}
              className="tw:inline-flex tw:flex-1 tw:items-center tw:justify-center tw:rounded-full! tw:bg-primary tw:px-4 tw:py-2 tw:text-xs tw:font-semibold tw:text-white tw:hover:bg-primarySecond tw:disabled:cursor-not-allowed tw:disabled:opacity-60 tw:sm:flex-none tw:sm:w-auto"
            >
              {isProcessing ? "Processing…" : "Accept"}
            </button>
          </div>
        ) : (
          <div className="tw:flex tw:w-full tw:justify-end">
            <span className="tw:inline-flex tw:items-center tw:rounded-full tw:bg-gray-100 tw:px-3 tw:py-1 tw:text-[11px] tw:font-medium tw:text-gray-600">
              {item.status === "approved"
                ? "You accepted this invitation"
                : item.status === "rejected"
                ? "You rejected this invitation"
                : "Status updated"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default MentionCard;
