import React, { useState } from "react";
import { api, authHeaders } from "../../lib/apiClient";
import { showPromise } from "../../component/ui/toast";
import { randomAvatar } from "../../utils/ui";

export default function Remarks({ eventId, remarks = [], onAppend }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submitRemark = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const p = api.post(
        `/api/v1/events/${eventId}/remark`,
        { remark: text.trim() },
        authHeaders()
      );
      const res = await showPromise(p, {
        loading: "Posting remark…",
        success: "Remark added",
        error: "Failed to add remark",
      });
      const newRemark = res?.data?.data || {
        remark: text.trim(),
        created_at: "just now",
        user: { firstName: "You", lastName: "", profileImage: null },
      };
      onAppend?.(newRemark);
      setText("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tw:px-5 tw:md:px-7 tw:py-5">
      <span className="tw:text-base tw:font-semibold tw:mb-4">Remarks</span>
      <div className="row">
        <div className="col-12 col-lg-6 tw:space-y-4">
          {remarks.map((r, i) => {
            const fullName =
              [r?.user?.firstName, r?.user?.lastName]
                .filter(Boolean)
                .join(" ") || "User";
            return (
              <div key={i} className="tw:flex tw:items-start tw:gap-3">
                <img
                  src={r?.user?.profileImage || randomAvatar(fullName || i)}
                  alt=""
                  className="tw:h-9 tw:w-9 tw:rounded-full tw:object-cover"
                />
                <div className="tw:bg-[#fafafa] tw:border tw:border-gray-100 tw:rounded-2xl tw:px-4 tw:py-3 tw:flex-1">
                  <div className="tw:text-sm tw:font-medium">{fullName}</div>
                  <p className="tw:text-sm tw:text-gray-700 tw:mt-1">
                    {r?.remark}
                  </p>
                  <div className="tw:text-xs tw:text-gray-500 tw:mt-1">
                    {r?.created_at}
                  </div>
                </div>
              </div>
            );
          })}
          {remarks.length === 0 && (
            <div className="tw:text-sm tw:text-gray-500">No remarks yet.</div>
          )}
        </div>

        <div className="col-12 col-lg-6">
          <div className="tw:bg-white tw:border tw:border-gray-100 tw:rounded-2xl tw:p-4 tw:h-full">
            <label className="tw:text-sm tw:text-gray-600">
              Write your remark…
            </label>
            <textarea
              className="tw:mt-2 tw:w-full tw:min-h-[140px] tw:rounded-xl tw:border tw:border-gray-200 tw:p-3 tw:focus:outline-none tw:focus:ring-2 tw:focus:ring-primary"
              placeholder="Write your remark…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="tw:mt-3 tw:flex tw:justify-end">
              <button
                style={{
                  borderRadius: 20,
                }}
                className="tw:px-5 tw:h-10 tw:bg-primary tw:text-white tw:rounded-full tw:disabled:opacity-50"
                disabled={!text.trim() || busy}
                onClick={submitRemark}
              >
                {busy ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
