import React from "react";
import { Copy } from "lucide-react";
import { showError, showSuccess } from "../../component/ui/toast";

export default function InfoRow({ label, value, copyLabel }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value || ""));
      showSuccess(copyLabel || "Copied!");
    } catch {
      showError("Copy failed");
    }
  };

  return (
    <div className="tw:rounded-2xl tw:bg-white tw:border tw:border-lightPurple tw:p-3 tw:flex tw:items-center tw:justify-between">
      <div className="tw:text-sm tw:min-w-0">
        <div className="tw:text-gray-500">{label}</div>
        <div className="tw:font-medium tw:break-all tw:truncate">
          {value || "—"}
        </div>
      </div>
      <button
        onClick={copy}
        className="tw:rounded-xl! tw:p-2 tw:hover:bg-lightPurple/60"
        title="Copy"
      >
        <Copy className="tw:size-5" />
      </button>
    </div>
  );
}
