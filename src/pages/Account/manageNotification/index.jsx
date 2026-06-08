import React, { useState } from "react";
import SideBarNav from "../../pageAssets/SideBarNav";
import "./manageNotificationStyling.css";

function AccountNotification() {
  const [notifications, setNotifications] = useState({
    // Activity
    activityLikedEvents: false,
    activityOrganizersYouFollow: true,
    activityReminders: true,
    activityFeedbackRequests: true,

    // Preferences (channels)
    prefPush: true,
    prefSms: false,
    prefEmail: true,

    // Help & updates
    helpManageNotification: true,
    helpNewsletter: true,
    helpFollowedOrganizers: false,
    helpReminders: false,
    helpFeedbackRequests: true,
    helpLikedEvents: false,
  });

  // Which accordion(s) are open
  const [open, setOpen] = useState({
    email: true,
    sms: false,
    push: false,
  });

  const toggleSwitch = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    // later: call API here & use toast
    // showSuccess("Notification preference updated");
  };

  const toggleAccordion = (section) => {
    setOpen((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleUpdate = () => {
    // TODO: Plug into API later
    // api.post("/api/v1/user/notification-preferences", notifications)
    //   .then(() => showSuccess("Notification settings updated"))
    //   .catch(() => showError("Unable to update notification settings"));
    console.log("Updated notification preferences:", notifications);
  };

  return (
    <div className="container-flui m-0 p-0">
      <SideBarNav />

      <div className="page_wrapper overflow-hidden">
        <div className="row p-0">
          <div className="col account_section">
            <div className="tw:px-4 tw:py-4 tw:md:px-8 tw:md:py-8">
              <div className="tw:max-w-7xl tw:mx-auto tw:flex tw:flex-col tw:gap-6">
                {/* Header */}
                <div className="tw:space-y-1">
                  <span className="tw:text-2xl tw:md:text-3xl tw:font-semibold tw:text-gray-900">
                    Manage notifications
                  </span>
                  <span className="tw:block tw:text-sm tw:md:text-base tw:text-gray-500">
                    Choose how you’d like Xilolo to reach you. Open each
                    preference to fine-tune what you receive.
                  </span>
                </div>

                {/* Preferences / Accordions */}
                <main className="tw:flex tw:flex-col tw:gap-4 tw:md:gap-5">
                  {/* PUSH NOTIFICATIONS */}
                  <section className="tw:rounded-2xl tw:border tw:border-gray-100 tw:bg-white tw:shadow-[0_10px_26px_rgba(15,23,42,0.04),0_0_14px_rgba(0,245,255,0.04)]">
                    {/* Accordion header */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion("push")}
                      className="tw:w-full tw:flex tw:items-center tw:justify-between tw:px-4 tw:py-3 tw:md:px-5 tw:md:py-4 tw:gap-3 tw:text-left focus:tw:outline-none"
                    >
                      <div className="tw:flex tw:flex-col tw:gap-0.5">
                        <span className="tw:text-sm tw:md:text-base tw:font-semibold tw:text-gray-900">
                          Push notifications
                        </span>
                        <span className="tw:text-xs tw:md:text-[13px] tw:text-gray-500">
                          Alerts that show on your device when you’re using the
                          app.
                        </span>
                      </div>

                      <div className="tw:flex tw:items-center tw:gap-3">
                        {/* Master toggle for Push */}
                        <div className="switch-container">
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={notifications.prefPush}
                              onChange={() => toggleSwitch("prefPush")}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="slider" />
                          </label>
                        </div>

                        {/* Chevron */}
                        <svg
                          className={`tw:w-4 tw:h-4 tw:text-gray-500 tw:transition-transform ${open.push ? "tw:rotate-180" : ""
                            }`}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.6}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </div>
                    </button>

                    {/* Accordion body */}
                    {open.push && (
                      <div className="tw:px-4 tw:pb-4 tw:md:px-5 tw:md:pb-5 tw:border-t tw:border-gray-100">
                        <ul className="tw:space-y-1 tw:mt-3">
                          <li>
                            <span className="account_link tw:w-full">
                              <div className="tw:flex tw:flex-col">
                                <span className="tw:text-sm tw:text-gray-900">
                                  Events you liked
                                </span>
                                <span className="tw:text-[12px] tw:text-gray-400 tw:mt-0.5">
                                  Get push alerts when events you liked are
                                  updated or go live.
                                </span>
                              </div>
                              <div className="switch-container">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={notifications.activityLikedEvents}
                                    onChange={() =>
                                      toggleSwitch("activityLikedEvents")
                                    }
                                  />
                                  <span className="slider" />
                                </label>
                              </div>
                            </span>
                          </li>

                          <li>
                            <span className="account_link tw:w-full">
                              <div className="tw:flex tw:flex-col">
                                <span className="tw:text-sm tw:text-gray-900">
                                  Organizers you follow
                                </span>
                                <span className="tw:text-[12px] tw:text-gray-400 tw:mt-0.5">
                                  New events and important updates from your
                                  followed organizers.
                                </span>
                              </div>
                              <div className="switch-container">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={
                                      notifications.activityOrganizersYouFollow
                                    }
                                    onChange={() =>
                                      toggleSwitch(
                                        "activityOrganizersYouFollow"
                                      )
                                    }
                                  />
                                  <span className="slider" />
                                </label>
                              </div>
                            </span>
                          </li>

                          <li>
                            <span className="account_link tw:w-full">
                              <div className="tw:flex tw:flex-col">
                                <span className="tw:text-sm tw:text-gray-900">
                                  Event reminders
                                </span>
                                <span className="tw:text-[12px] tw:text-gray-400 tw:mt-0.5">
                                  Reminders shortly before events start.
                                </span>
                              </div>
                              <div className="switch-container">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={notifications.activityReminders}
                                    onChange={() =>
                                      toggleSwitch("activityReminders")
                                    }
                                  />
                                  <span className="slider" />
                                </label>
                              </div>
                            </span>
                          </li>

                          <li>
                            <span className="account_link tw:w-full">
                              <div className="tw:flex tw:flex-col">
                                <span className="tw:text-sm tw:text-gray-900">
                                  Feedback requests
                                </span>
                                <span className="tw:text-[12px] tw:text-gray-400 tw:mt-0.5">
                                  Push prompts to rate events you attended.
                                </span>
                              </div>
                              <div className="switch-container">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={
                                      notifications.activityFeedbackRequests
                                    }
                                    onChange={() =>
                                      toggleSwitch("activityFeedbackRequests")
                                    }
                                  />
                                  <span className="slider" />
                                </label>
                              </div>
                            </span>
                          </li>

                          <li>
                            <span className="account_link tw:w-full">
                              <div className="tw:flex tw:flex-col">
                                <span className="tw:text-sm tw:text-gray-900">
                                  Smart suggestions
                                </span>
                                <span className="tw:text-[12px] tw:text-gray-400 tw:mt-0.5">
                                  Helpful nudges to fine-tune your push
                                  settings.
                                </span>
                              </div>
                              <div className="switch-container">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={
                                      notifications.helpManageNotification
                                    }
                                    onChange={() =>
                                      toggleSwitch("helpManageNotification")
                                    }
                                  />
                                  <span className="slider" />
                                </label>
                              </div>
                            </span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </section>

                  {/* SMS */}
                  <section className="tw:rounded-2xl tw:border tw:border-gray-100 tw:bg-white tw:shadow-[0_10px_26px_rgba(15,23,42,0.04),0_0_14px_rgba(0,245,255,0.04)]">
                    <button
                      type="button"
                      onClick={() => toggleAccordion("sms")}
                      className="tw:w-full tw:flex tw:items-center tw:justify-between tw:px-4 tw:py-3 tw:md:px-5 tw:md:py-4 tw:gap-3 tw:text-left focus:tw:outline-none"
                    >
                      <div className="tw:flex tw:flex-col tw:gap-0.5">
                        <span className="tw:text-sm tw:md:text-base tw:font-semibold tw:text-gray-900">
                          SMS notifications
                        </span>
                        <span className="tw:text-xs tw:md:text-[13px] tw:text-gray-500">
                          Text messages for key updates like tickets and event
                          reminders.
                        </span>
                      </div>

                      <div className="tw:flex tw:items-center tw:gap-3">
                        <div className="switch-container">
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={notifications.prefSms}
                              onChange={() => toggleSwitch("prefSms")}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="slider" />
                          </label>
                        </div>
                        <svg
                          className={`tw:w-4 tw:h-4 tw:text-gray-500 tw:transition-transform ${open.sms ? "tw:rotate-180" : ""
                            }`}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.6}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </div>
                    </button>

                    {open.sms && (
                      <div className="tw:px-4 tw:pb-4 tw:md:px-5 tw:md:pb-5 tw:border-t tw:border-gray-100">
                        <ul className="tw:space-y-1 tw:mt-3">
                          <li>
                            <span className="account_link tw:w-full">
                              <div className="tw:flex tw:flex-col">
                                <span className="tw:text-sm tw:text-gray-900">
                                  Event reminders via SMS
                                </span>
                                <span className="tw:text-[12px] tw:text-gray-400 tw:mt-0.5">
                                  One-off reminders for upcoming events you’re
                                  attending.
                                </span>
                              </div>
                              <div className="switch-container">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={notifications.helpReminders}
                                    onChange={() =>
                                      toggleSwitch("helpReminders")
                                    }
                                  />
                                  <span className="slider" />
                                </label>
                              </div>
                            </span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </section>

                  {/* EMAIL */}
                  <section className="tw:rounded-2xl tw:border tw:border-gray-100 tw:bg-white tw:shadow-[0_10px_26px_rgba(15,23,42,0.04),0_0_14px_rgba(0,245,255,0.04)]">
                    <button
                      type="button"
                      onClick={() => toggleAccordion("email")}
                      className="tw:w-full tw:flex tw:items-center tw:justify-between tw:px-4 tw:py-3 tw:md:px-5 tw:md:py-4 tw:gap-3 tw:text-left focus:tw:outline-none"
                    >
                      <div className="tw:flex tw:flex-col tw:gap-0.5">
                        <span className="tw:text-sm tw:md:text-base tw:font-semibold tw:text-gray-900">
                          Email notifications
                        </span>
                        <span className="tw:text-xs tw:md:text-[13px] tw:text-gray-500">
                          Summaries, receipts, and updates sent to your inbox.
                        </span>
                      </div>

                      <div className="tw:flex tw:items-center tw:gap-3">
                        <div className="switch-container">
                          <label className="switch">
                            <input
                              type="checkbox"
                              checked={notifications.prefEmail}
                              onChange={() => toggleSwitch("prefEmail")}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="slider" />
                          </label>
                        </div>
                        <svg
                          className={`tw:w-4 tw:h-4 tw:text-gray-500 tw:transition-transform ${open.email ? "tw:rotate-180" : ""
                            }`}
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.6}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                          />
                        </svg>
                      </div>
                    </button>

                    {open.email && (
                      <div className="tw:px-4 tw:pb-4 tw:md:px-5 tw:md:pb-5 tw:border-t tw:border-gray-100">
                        <ul className="tw:space-y-1 tw:mt-3">
                          <li>
                            <span className="account_link tw:w-full">
                              <div className="tw:flex tw:flex-col">
                                <span className="tw:text-sm tw:text-gray-900">
                                  Xilolo newsletter
                                </span>
                                <span className="tw:text-[12px] tw:text-gray-400 tw:mt-0.5">
                                  Product updates, tips, and creator stories.
                                </span>
                              </div>
                              <div className="switch-container">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={notifications.helpNewsletter}
                                    onChange={() =>
                                      toggleSwitch("helpNewsletter")
                                    }
                                  />
                                  <span className="slider" />
                                </label>
                              </div>
                            </span>
                          </li>

                          <li>
                            <span className="account_link tw:w-full">
                              <div className="tw:flex tw:flex-col">
                                <span className="tw:text-sm tw:text-gray-900">
                                  Followed organizers digest
                                </span>
                                <span className="tw:text-[12px] tw:text-gray-400 tw:mt-0.5">
                                  Occasional round-ups from organizers you
                                  follow.
                                </span>
                              </div>
                              <div className="switch-container">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={
                                      notifications.helpFollowedOrganizers
                                    }
                                    onChange={() =>
                                      toggleSwitch("helpFollowedOrganizers")
                                    }
                                  />
                                  <span className="slider" />
                                </label>
                              </div>
                            </span>
                          </li>

                          <li>
                            <span className="account_link tw:w-full">
                              <div className="tw:flex tw:flex-col">
                                <span className="tw:text-sm tw:text-gray-900">
                                  Event feedback emails
                                </span>
                                <span className="tw:text-[12px] tw:text-gray-400 tw:mt-0.5">
                                  Requests to review events in your inbox.
                                </span>
                              </div>
                              <div className="switch-container">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={notifications.helpFeedbackRequests}
                                    onChange={() =>
                                      toggleSwitch("helpFeedbackRequests")
                                    }
                                  />
                                  <span className="slider" />
                                </label>
                              </div>
                            </span>
                          </li>

                          <li>
                            <span className="account_link tw:w-full">
                              <div className="tw:flex tw:flex-col">
                                <span className="tw:text-sm tw:text-gray-900">
                                  Liked events digest
                                </span>
                                <span className="tw:text-[12px] tw:text-gray-400 tw:mt-0.5">
                                  Occasional summary of events you’ve shown
                                  interest in.
                                </span>
                              </div>
                              <div className="switch-container">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={notifications.helpLikedEvents}
                                    onChange={() =>
                                      toggleSwitch("helpLikedEvents")
                                    }
                                  />
                                  <span className="slider" />
                                </label>
                              </div>
                            </span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </section>
                </main>

                {/* Update button */}
                <div className="tw:pt-2 tw:mt-2 tw:border-t tw:border-gray-100">
                  <div className="tw:flex tw:flex-col tw:items-stretch tw:md:flex-row tw:md:items-center tw:justify-between tw:gap-3">
                    <button
                      style={{
                        borderRadius: 20,
                      }}
                      type="button"
                      onClick={handleUpdate}
                      className="tw:inline-flex tw:w-full tw:justify-center tw:md:w-auto tw:items-center tw:rounded-xl tw:bg-primary tw:px-5 tw:py-2.5 tw:text-sm tw:font-medium tw:text-white tw:hover:bg-primarySecond tw:transition tw:shadow-[0_10px_24px_rgba(0,0,0,0.14),0_0_14px_rgba(0,245,255,0.12)]"
                    >
                      Update preferences
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountNotification;
