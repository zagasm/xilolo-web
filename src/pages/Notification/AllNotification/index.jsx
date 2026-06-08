import React, { useMemo, useState } from "react";
import { ChevronLeftIcon } from "lucide-react";
import SingleNotificationTemplate from "../../../component/Notification/singleNotification";
import useNotifications from "../../../component/Notification/useNotifications";
import { useAuth } from "../../auth/AuthContext";

function AllNotification() {
  const { token } = useAuth();
  const [filter, setFilter] = useState("all");
  const { notifications, loading, unreadCount, markOneAsRead, markAllAsRead } =
    useNotifications(token);

  const filteredItems = useMemo(() => {
    if (filter === "unread") {
      return notifications.filter((item) => !item.read_at);
    }
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="tw:mt-16 tw:min-h-[calc(100vh-4rem)] tw:bg-white tw:px-4 tw:py-6 tw:font-sans tw:sm:px-6 tw:md:px-8">
      <div className="tw:mx-auto tw:flex tw:max-w-3xl tw:flex-col tw:gap-4">
        <section className="tw:rounded-3xl tw:border tw:border-slate-200 tw:bg-[#ffffff] tw:p-5 tw:shadow-[0_14px_36px_rgba(15,23,42,0.06),0_0_18px_rgba(0,245,255,0.04)] tw:sm:p-6">
          <div className="tw:text-slate-700">
            <button
              style={{
                borderRadius: 16
              }}
              onClick={() => window.history.back()}
              className="tw:inline-flex tw:items-center tw:gap-1 tw:text-sm tw:font-medium tw:text-primary"
            >
              <ChevronLeftIcon className="tw:mr-2 tw:h-5 tw:w-5" />
              <span>Back</span>
            </button>
            <span className="tw:mt-3 tw:block tw:text-2xl tw:font-semibold tw:text-slate-900">
              Notifications
            </span>
            <span className="tw:mt-1 tw:block tw:text-sm tw:text-slate-500">
              Recent updates from your account and events.
            </span>
          </div>

          <div className="tw:mt-5 tw:flex tw:flex-col tw:gap-4 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
            <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-2">
              <span className="tw:rounded-full tw:bg-slate-100 tw:px-3 tw:py-1.5 tw:text-sm tw:text-slate-600">
                {notifications.length} total
              </span>
              <span className="tw:rounded-full tw:border tw:border-neon/20 tw:bg-neon/10 tw:px-3 tw:py-1.5 tw:text-sm tw:text-primary">
                {unreadCount} unread
              </span>
            </div>

            <button
              style={{
                borderRadius: 16
              }}
              type="button"
              className="tw:rounded-full tw:border tw:border-slate-200 tw:bg-[#ffffff] tw:px-4 tw:py-2 tw:text-sm tw:font-medium tw:text-slate-700 tw:transition hover:tw:border-neon/40 hover:tw:shadow-[0_0_18px_rgba(0,245,255,0.08)] disabled:tw:opacity-60"
              onClick={() => markAllAsRead({ toast: true })}
              disabled={unreadCount === 0 || loading}
            >
              Mark all as read
            </button>
          </div>

          <div className="tw:mt-4 tw:flex tw:flex-wrap tw:gap-3">
            <button
              style={{
                borderRadius: 16
              }}
              type="button"
              onClick={() => setFilter("all")}
              className={`tw:rounded-full tw:border tw:px-4 tw:py-2 tw:text-sm tw:font-medium ${filter === "all"
                ? "tw:border-slate-900 tw:bg-slate-900 tw:text-white tw:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_14px_rgba(0,245,255,0.12)]"
                : "tw:border-slate-200 tw:bg-white tw:text-slate-600"
                }`}
            >
              All updates
            </button>
            <button
              style={{
                borderRadius: 16
              }}
              type="button"
              onClick={() => setFilter("unread")}
              className={`tw:rounded-full tw:border tw:px-4 tw:py-2 tw:text-sm tw:font-medium ${filter === "unread"
                ? "tw:border-slate-900 tw:bg-slate-900 tw:text-white tw:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_14px_rgba(0,245,255,0.12)]"
                : "tw:border-slate-200 tw:bg-white tw:text-slate-600"
                }`}
            >
              Unread only
              {unreadCount > 0 && (
                <span className="tw:ml-2 tw:inline-flex tw:h-2 tw:w-2 tw:rounded-full tw:bg-neon tw:shadow-[0_0_10px_rgba(0,245,255,0.65)]" />
              )}
            </button>
          </div>
        </section>

        <section className="tw:overflow-hidden ">
          <div className="tw:flex tw:flex-col tw:gap-2">
            {loading ? (
              <div className="tw:p-8 tw:text-center tw:text-sm tw:text-slate-500">
                Loading notifications...
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="tw:p-8 tw:text-center tw:text-sm tw:text-slate-500">
                You are all caught up. Check back later for updates.
              </div>
            ) : (
              filteredItems.map((notification) => (
                <SingleNotificationTemplate
                  key={notification.id}
                  notification={notification}
                  onClick={() => markOneAsRead(notification.id, { toast: true })}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AllNotification;
