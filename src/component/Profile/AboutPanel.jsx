// src/component/Profile/AboutPanel.jsx
//
// Web mirror of the app's profile "about" block.
//
// DESIGN SOURCE OF TRUTH (read-only): xilolo-app
//   Own profile   lib/.../user_and_organizer_profile_screen/
//                 user_main_profile_screen_revamp.dart
//                   About Me card (40 circle chip + user icon, title 17/w700,
//                   body 13/1.35, empty -> full-width 46 outlined pill with a
//                   dotted-plus and "Add About Me")           :777-898
//                   copy: l10n aboutMe / aboutMeHint / addAboutMe
//   Other user    lib/.../profile/screens/organizer_profile.dart
//                   About card — title 16/w600, body 14/1.5 muted, and the card
//                   is NOT rendered at all when the bio is empty  :583-614
//   Info cards    lib/.../profile/screens/user_profile_screen.dart
//                   card: card fill, r12, hairline border, p16, title 16/w600
//                   row: 100px label column (14, textSecondary) + value (14,
//                   textPrimary)                              :284-339
//                   card titles "Personal Information" / "Account Status" /
//                   "Social"                                  :213-241
//
// Rows are the SAME fields the panel already read (nothing new is fetched or
// invented); only the card anatomy and the section titles moved to the app's.
import React from "react";
import { Link } from "react-router-dom";
import { Pencil, PlusCircle, User as UserIcon } from "lucide-react";

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

function InfoCard({ title, rows }) {
  const visible = rows.filter(([, value]) => value !== undefined);
  if (!visible.length) return null;

  return (
    <div className="tw:rounded-xl tw:border tw:border-hairline tw:bg-paper-raised tw:p-4">
      <div className="tw:text-[16px] tw:font-semibold tw:text-body">{title}</div>
      <div className="tw:mt-3 tw:space-y-2">
        {visible.map(([label, value]) => (
          <div key={label} className="tw:flex tw:items-start">
            <span className="tw:w-[100px] tw:shrink-0 tw:text-[14px] tw:text-muted">
              {label}
            </span>
            <span className="tw:min-w-0 tw:flex-1 tw:text-[14px] tw:text-body">
              {safeValue(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * @param showInfoCards  the "Personal Information" / "Account Status" /
 *   "Social" cards come from ONE app screen — user_profile_screen.dart's About
 *   TAB (:205-241) — which the web has no tab for. The own profile
 *   (revamp:332-346) and the organiser profile (organizer_profile.dart:271-296)
 *   have no such cards at all, so they are suppressed there; a plain user
 *   reached by a share link still shows them, which is the only place the app
 *   does.
 */
export default function AboutPanel({
  user,
  isOwnProfile = false,
  showInfoCards = false,
}) {
  if (!user) return null;

  const isOrganiserProfileData =
    !!user?.organiser || (!!user?.userId && !!user?.allEvents);

  const aboutText = String(
    user?.about || user?.organiser?.about || "",
  ).trim();

  const organiserName =
    typeof user?.organiser === "string"
      ? user.organiser
      : user?.organiser?.organiser || user?.organiser?.name || user?.name || "—";

  return (
    <div className="tw:space-y-[10px]">
      {/* ── biography ─────────────────────────────────────────────────────── */}
      {isOwnProfile ? (
        <div className="tw:rounded-[22px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-[18px]">
          <div className="tw:flex tw:items-start tw:gap-3">
            <span className="tw:flex tw:size-10 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:border tw:border-hairline tw:bg-chip tw:text-body">
              <UserIcon className="tw:size-[21px]" />
            </span>
            <div className="tw:min-w-0 tw:flex-1">
              <div className="tw:flex tw:items-center tw:gap-2">
                <span className="tw:text-[17px] tw:font-bold! tw:text-body">
                  About Me
                </span>
                {aboutText && (
                  <Link
                    to="/profile/edit-profile"
                    aria-label="Edit About Me"
                    className="tw:ml-auto tw:text-muted tw:hover:text-body"
                  >
                    <Pencil className="tw:size-[18px]" />
                  </Link>
                )}
              </div>
              <div
                className={`tw:mt-2 tw:text-[13px] tw:leading-[1.35] ${
                  aboutText ? "tw:text-body" : "tw:text-muted"
                }`}
              >
                {aboutText ||
                  "Tell others a little about yourself, your events, or brand."}
              </div>
            </div>
          </div>

          {!aboutText && (
            <Link
              to="/profile/edit-profile"
              className="tw:mt-[18px] tw:flex tw:h-[46px] tw:w-full tw:items-center tw:justify-center tw:gap-3 tw:rounded-full tw:border tw:border-hairline tw:text-[13px] tw:font-semibold tw:text-body"
            >
              <PlusCircle className="tw:size-[18px]" />
              Add About Me
            </Link>
          )}
        </div>
      ) : (
        aboutText && (
          <div className="tw:rounded-[24px] tw:border tw:border-hairline tw:bg-paper-raised tw:px-5 tw:py-4">
            <div className="tw:text-[16px] tw:font-semibold tw:text-body">
              About
            </div>
            <div className="tw:mt-2 tw:text-[14px] tw:leading-[1.5] tw:text-muted">
              {aboutText}
            </div>
          </div>
        )
      )}

      {/* ── snapshot rows (app card + 100px label column anatomy) ───────────
          plain-user profile only; see showInfoCards above ──────────────── */}
      {showInfoCards &&
        (isOrganiserProfileData ? (
        <>
          <InfoCard
            title="Personal Information"
            rows={[
              ["Organizer Name", organiserName],
              ["Email", truncate(user?.email, 22)],
            ]}
          />
          <InfoCard
            title="Account Status"
            rows={[["KYC Status", user?.kyc_status ?? user?.kyc?.status]]}
          />
          <InfoCard
            title="Social"
            rows={[
              ["Followers", user?.numberOfFollowers ?? user?.followers_count],
              [
                "Tickets Sold",
                user?.tickets_total ?? user?.successfulPayments,
              ],
              ["Ranking", user?.rank],
            ]}
          />
        </>
      ) : (
        <>
          <InfoCard
            title="Personal Information"
            rows={[
              ["Username", user?.userName],
              ["Email", truncate(user?.email, 22)],
              ["Phone", user?.phoneNumber],
              ["Gender", user?.gender],
              ["DOB", user?.dob],
              ["Age", user?.age],
            ]}
          />
          <InfoCard
            title="Account Status"
            rows={[
              ["Email Verified", user?.email_verified ?? user?.emailVerified],
              ["Phone Verified", user?.phone_verified ?? user?.phoneVerified],
            ]}
          />
          <InfoCard
            title="Social"
            rows={[
              [
                "Followers",
                user?.followers_count ?? user?.followersCount ?? user?.numberOfFollowers,
              ],
              [
                "Following",
                user?.followings_count ?? user?.followingsCount,
              ],
            ]}
          />
        </>
        ))}
    </div>
  );
}
