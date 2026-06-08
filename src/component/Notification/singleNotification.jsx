import React from "react";

const formatNotificationText = (value) => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => formatNotificationText(item))
      .filter(Boolean)
      .join(" ");
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .map(([key, val]) => {
        const formattedVal = formatNotificationText(val);
        return formattedVal ? `${key}: ${formattedVal}` : key;
      })
      .filter(Boolean)
      .join(" - ");
  }
  return "";
};

const pickNotificationText = (...values) => {
  for (const value of values) {
    const formatted = formatNotificationText(value);
    if (formatted) {
      return formatted;
    }
  }
  return "";
};

function SingleNotificationTemplate({ notification, onClick }) {
  const actorName = notification?.data?.actor?.name || "Someone";
  const title =
    pickNotificationText(
      notification?.data?.action,
      notification?.data?.message,
      notification?.message
    ) || "Notification";
  const messageBody =
    pickNotificationText(notification?.data?.message, notification?.message) ||
    `${actorName} updated your feed`;
  const isUnread = !notification?.read_at;
  const timeLabel = notification?.time_ago || notification?.created_at || "Just now";

  return (
    <div
      className={`tw:cursor-pointer tw:px-4 tw:py-4 tw:transition tw:duration-200 hover:tw:bg-slate-50 ${
        isUnread
          ? "tw:bg-[#ffffff]"
          : "tw:bg-[#ffffff]"
      }`}
      onClick={onClick}
      role="button"
    >
      <div className="tw:flex tw:items-start tw:gap-3">
        <span
          className={`tw:mt-1 tw:h-2 tw:w-2 tw:shrink-0 tw:rounded-full ${
            isUnread ? "tw:bg-neon tw:shadow-[0_0_10px_rgba(0,245,255,0.65)]" : "tw:bg-slate-300"
          }`}
        />

        <div className="tw:min-w-0 tw:flex-1">
          <div className="tw:flex tw:items-start tw:justify-between tw:gap-3">
            <span className="tw:block tw:text-sm tw:text-slate-900 sm:tw:text-[15px]">
            {messageBody}
            </span>
            <span className="tw:shrink-0 tw:text-xs tw:text-slate-400">{timeLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SingleNotificationTemplate;
