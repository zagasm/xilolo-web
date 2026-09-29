import React, { Fragment } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
} from "@headlessui/react";
import { CheckCircle2, VerifiedIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function EventCreationSuccessModal({
  open,
  onClose,
  eventId,
  variant = "created",
}) {
  const navigate = useNavigate();

  const copy =
    variant === "updated"
      ? {
          title: "Event updated",
          subtitle: "Your changes are now live for attendees.",
          description:
            "The event page reflects your latest updates. Feel free to share the link or continue tweaking details.",
          cta: "View updated event",
        }
      : {
          title: "Event created",
          subtitle: "You’re all set to share and promote your event.",
          description:
            "Invite attendees, preview the page, or head straight to the dashboard to manage ticketing and promotion.",
          cta: "View event",
        };

  const handleView = () => {
    if (!eventId) return;
    onClose?.();
    navigate(`/event/view/${eventId}`);
  };

  return (
    <Transition.Root show={open} as={Fragment} appear>
      <Dialog as="div" className="tw:relative tw:z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="tw:transition tw:duration-300 tw:ease-out"
          enterFrom="tw:opacity-0"
          enterTo="tw:opacity-100"
          leave="tw:transition tw:duration-200 tw:ease-in"
          leaveFrom="tw:opacity-100"
          leaveTo="tw:opacity-0"
        >
          <DialogBackdrop className="tw:fixed tw:inset-0 tw:z-40 tw:bg-black/45" />
        </Transition.Child>

        {/* Wrapper */}
        <div className="tw:fixed tw:inset-0 tw:z-50 tw:flex tw:items-center tw:justify-center tw:p-4">
          <Transition.Child
            as={Fragment}
            enter="tw:transition tw:duration-300 tw:ease-out"
            enterFrom="tw:opacity-0 tw:scale-95"
            enterTo="tw:opacity-100 tw:scale-100"
            leave="tw:transition tw:duration-200 tw:ease-in"
            leaveFrom="tw:opacity-100 tw:scale-100"
            leaveTo="tw:opacity-0 tw:scale-95"
          >
            <DialogPanel className="tw:w-full tw:max-w-md tw:overflow-hidden tw:rounded-[16px] tw:border tw:border-hairline tw:bg-paper-raised tw:p-6 tw:text-left tw:text-body">
              <div className="tw:flex tw:flex-col tw:items-center tw:gap-4">
                <div className="tw:grid tw:size-16 tw:place-items-center tw:rounded-full tw:bg-accent tw:text-white">
                  <VerifiedIcon className="tw:size-9" />
                </div>

                <h3 className="tw:block tw:font-display tw:text-[16px] tw:font-bold tw:text-body tw:text-center">
                  {copy.title}
                </h3>

                <p className="tw:text-center tw:text-[13px] tw:font-medium tw:text-muted">
                  {copy.subtitle}
                </p>

                <p className="tw:text-center tw:text-[12px] tw:text-ink-muted tw:px-3">
                  {copy.description}
                </p>

                <div className="tw:w-full tw:flex tw:flex-col tw:gap-3">
                  <button
                    style={{ fontSize: 13 }}
                    type="button"
                    onClick={handleView}
                    className="tw:w-full tw:rounded-full tw:bg-accent tw:px-4 tw:py-3 tw:text-[13px] tw:font-bold tw:text-white tw:transition tw:duration-150 tw:hover:brightness-95"
                  >
                    {copy.cta}
                  </button>

                  <button
                    style={{ fontSize: 13 }}
                    type="button"
                    onClick={onClose}
                    className="tw:w-full tw:rounded-full tw:border tw:border-hairline tw:px-4 tw:py-3 tw:text-[13px] tw:font-bold tw:text-body tw:transition tw:duration-150 tw:hover:border-accent"
                  >
                    Later
                  </button>
                </div>
              </div>
            </DialogPanel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
