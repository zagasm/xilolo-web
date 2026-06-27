// pages/event/EditEvent.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, authHeaders } from "../../lib/apiClient";
import { useAuth } from "../auth/AuthContext";
import EventCreationWizard from "./CreateEvent/EventForm/EventCreationWizard"; // same wizard as Create

export default function EditEvent() {
  const { eventId } = useParams();
  const { token } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(
          `/api/v1/events/${eventId}/view`,
          authHeaders(token)
        );
        const data = res?.data?.data || res?.data;
        if (mounted) setEvent(data);
      } catch (err) {
        if (mounted) setError(err?.response?.data?.message || "Failed to load event");
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [eventId, token]);

  if (loading) {
    return (
      <div className="tw:w-full tw:min-h-screen tw:flex tw:items-center tw:justify-center tw:bg-[#e5e4e2]">
        <span className="tw:block tw:text-sm">Loading event…</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="tw:w-full tw:min-h-screen tw:flex tw:items-center tw:justify-center tw:bg-[#e5e4e2]">
        <span className="tw:block tw:text-sm tw:text-red-500">
          {error || "Event not found"}
        </span>
      </div>
    );
  }
  const eventTypeId = event.currentEvent.eventTypeFullDetails.id


  return (
    <div className="">
      <div className="tw:w-full tw:min-h-screen tw:bg-[#e5e4e2] tw:pt-2 tw:md:pt-24 tw:lg:px-4">
        <div className="row p-0 mt-5 ">
          <div className="col ">
            <EventCreationWizard
              eventTypeId={eventTypeId}
              mode="edit"
              eventId={eventId}
              initialEvent={event}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
