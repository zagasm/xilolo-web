import React from "react";

export default function MobileStickyBar({
  priceDisplay,
  dateTime,
  onGetTickets,
}) {
  return (
    <div
      data-bottom-dock
      className="tw:md:hidden tw:fixed tw:bottom-[70px] tw:left-0 tw:right-0 tw:z-50 tw:bg-[#F7EFFE] tw:border-t tw:border-primary/10 tw:px-5 tw:py-3 tw:flex tw:items-center tw:justify-between tw:gap-3"
    >
      <div>
        <div className="tw:text-lg tw:font-semibold">{priceDisplay}</div>
        <div className="tw:text-xs tw:text-gray-600">{dateTime}</div>
      </div>
      <button
      style={{
        borderRadius: 15
      }}
        className="tw:px-6 tw:h-11 tw:bg-primary tw:text-white tw:rounded-full! tw:font-medium"
        onClick={onGetTickets}
      >
        Get tickets
      </button>
    </div>
  );
}
