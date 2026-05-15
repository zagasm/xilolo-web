import { useCallback, useEffect, useRef, useState } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import {
  ArrowLeft,
  Headphones,
  Loader2,
  MessageSquarePlus,
  Send,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../../lib/apiClient";

window.Pusher = Pusher;

function getToken() {
  return localStorage.getItem("token") || "";
}

function buildEcho(token) {
  const key = import.meta.env.VITE_REVERB_APP_KEY;
  const host = import.meta.env.VITE_REVERB_HOST;
  const port = import.meta.env.VITE_REVERB_PORT;
  const scheme = import.meta.env.VITE_REVERB_SCHEME || "https";
  const apiUrl = import.meta.env.VITE_API_URL || "";

  if (!token || !key || !host || !port || !apiUrl) return null;

  const useTLS = scheme === "https";
  const base = String(apiUrl).replace(/\/+$/, "");

  return new Echo({
    broadcaster: "pusher",
    key,
    cluster: "mt1",
    wsHost: host,
    wsPort: Number(port),
    wssPort: Number(port),
    forceTLS: useTLS,
    encrypted: useTLS,
    enabledTransports: useTLS ? ["wss"] : ["ws", "wss"],
    authEndpoint: `${base}/api/v1/realtime/pusher/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  });
}

function isSubscriptionActive(status) {
  return Boolean(
    status?.has_active_subscription ||
      status?.subscription?.isActive ||
      status?.subscription?.status === "active"
  );
}

function normalizeMessages(messages = []) {
  return messages
    .filter((message) => message?.body || message?.content)
    .map((message) => ({
      id: message.id || `${message.sender_type}-${message.created_at}`,
      body: message.body || message.content,
      sender_type:
        message.sender_type || (message.role === "assistant" ? "admin" : "user"),
      created_at: message.created_at,
    }));
}

function normalizeConversations(payload) {
  return payload?.data?.data || payload?.data || payload || [];
}

function statusLabel(status) {
  return String(status || "open").replaceAll("_", " ");
}

export default function SupportChatPage() {
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  const echoRef = useRef(null);
  const endRef = useRef(null);

  const hasAccess = isSubscriptionActive(subscriptionStatus);
  const isClosed = activeConversation?.status === "closed";

  const upsertConversation = useCallback((conversation) => {
    if (!conversation?.id) return;

    setConversations((items) => {
      const next = items.filter((item) => item.id !== conversation.id);
      return [conversation, ...next].sort(
        (a, b) =>
          new Date(b.last_message_at || b.updated_at || b.created_at || 0) -
          new Date(a.last_message_at || a.updated_at || a.created_at || 0)
      );
    });
  }, []);

  const subscribeConversation = useCallback((id) => {
    echoRef.current?.disconnect();
    echoRef.current = null;

    if (!id) return;

    const echo = buildEcho(getToken());
    if (!echo) return;

    echoRef.current = echo;
    echo.private(`support.conversation.${id}`).listen(".support.message.sent", (payload) => {
      const incoming = payload?.message;
      if (!incoming?.id) return;

      setMessages((items) => {
        if (items.some((item) => item.id === incoming.id)) return items;
        return [...items, ...normalizeMessages([incoming])];
      });

      setActiveConversation((current) =>
        current?.id === id
          ? {
              ...current,
              latest_message: incoming,
              last_message_at: incoming.created_at,
              status:
                incoming.sender_type === "admin"
                  ? "pending_user"
                  : "pending_admin",
            }
          : current
      );

      setConversations((items) =>
        items.map((item) =>
          item.id === id
            ? {
                ...item,
                latest_message: incoming,
                last_message_at: incoming.created_at,
                status:
                  incoming.sender_type === "admin"
                    ? "pending_user"
                    : "pending_admin",
              }
            : item
        )
      );
    });
  }, []);

  const openConversation = useCallback(
    async (conversation) => {
      if (!conversation?.id) return;

      setThreadLoading(true);
      setError("");

      try {
        const response = await api.get(
          `/api/v1/support/conversations/${conversation.id}`,
          authHeaders()
        );
        const nextConversation = response.data?.data;
        setActiveConversation(nextConversation);
        setMessages(normalizeMessages(nextConversation?.messages || []));
        subscribeConversation(nextConversation?.id);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load this chat.");
      } finally {
        setThreadLoading(false);
      }
    },
    [subscribeConversation]
  );

  const loadConversations = useCallback(async () => {
    const listResponse = await api.get("/api/v1/support/conversations", authHeaders());
    const list = normalizeConversations(listResponse.data);
    setConversations(list);

    const firstOpen = list.find((item) => item.status !== "closed") || list[0];
    if (firstOpen) {
      await openConversation(firstOpen);
    }
  }, [openConversation]);

  useEffect(() => {
    let ignore = false;

    async function boot() {
      setLoading(true);
      setError("");

      try {
        const subscription = await api.get("/api/v1/user/subscription", authHeaders());
        const status = subscription.data?.data || subscription.data || null;
        if (ignore) return;
        setSubscriptionStatus(status);

        if (isSubscriptionActive(status)) {
          await loadConversations();
        }
      } catch (err) {
        if (!ignore) {
          setError(err?.response?.data?.message || "Unable to load support chat.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    boot();

    return () => {
      ignore = true;
      echoRef.current?.disconnect();
      echoRef.current = null;
    };
  }, [loadConversations]);

  useEffect(() => {
    requestAnimationFrame(() =>
      endRef.current?.scrollIntoView({ behavior: "smooth" })
    );
  }, [messages.length, activeConversation?.id]);

  const createConversation = async () => {
    if (!hasAccess || creating) return;

    setCreating(true);
    setError("");

    try {
      const response = await api.post(
        "/api/v1/support/conversations",
        { subject: "Support chat" },
        authHeaders()
      );
      const conversation = response.data?.data;
      upsertConversation(conversation);
      setActiveConversation(conversation);
      setMessages(normalizeMessages(conversation?.messages || []));
      subscribeConversation(conversation?.id);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create a support chat.");
    } finally {
      setCreating(false);
    }
  };

  const closeConversation = async () => {
    if (!activeConversation?.id || isClosed || closing) return;

    setClosing(true);
    setError("");

    try {
      const response = await api.patch(
        `/api/v1/support/conversations/${activeConversation.id}/close`,
        {},
        authHeaders()
      );
      const closed = response.data?.data;
      setActiveConversation((current) => ({ ...current, ...closed }));
      upsertConversation({ ...activeConversation, ...closed });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to close this chat.");
    } finally {
      setClosing(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const body = input.trim();
    if (!body || sending || !hasAccess || isClosed) return;

    setInput("");
    setSending(true);
    setError("");

    try {
      let conversation = activeConversation;

      if (!conversation?.id) {
        const response = await api.post(
          "/api/v1/support/conversations",
          { subject: "Support chat", message: body },
          authHeaders()
        );
        conversation = response.data?.data;
        upsertConversation(conversation);
        setActiveConversation(conversation);
        setMessages(normalizeMessages(conversation?.messages || []));
        subscribeConversation(conversation?.id);
        return;
      }

      const optimistic = {
        id: `local-${Date.now()}`,
        body,
        sender_type: "user",
        created_at: new Date().toISOString(),
      };

      setMessages((items) => [...items, optimistic]);
      const response = await api.post(
        `/api/v1/support/conversations/${conversation.id}/messages`,
        { message: body },
        authHeaders()
      );
      const saved = response.data?.data;
      setMessages((items) => [
        ...items.filter((item) => item.id !== optimistic.id),
        ...normalizeMessages([saved]),
      ]);
      upsertConversation({
        ...conversation,
        latest_message: saved,
        last_message_at: saved?.created_at,
        status: "pending_admin",
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Message failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="tw:min-h-[calc(100vh-84px)] tw:bg-[#f6f3ee] tw:px-4 tw:pb-28 tw:pt-6 tw:md:px-6 tw:md:py-10">
      <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-6xl tw:flex-col tw:gap-4">
        <div className="tw:mt-15 tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
          <div>
            <button
              style={{ borderRadius: "9999px" }}
              type="button"
              onClick={() => navigate(-1)}
              className="tw:mb-3 tw:inline-flex tw:items-center tw:gap-2 tw:border tw:border-black/10 tw:bg-white/80 tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-800 tw:shadow-sm tw:transition hover:tw:bg-white"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <span className="tw:mt-1 tw:block tw:text-2xl tw:font-black tw:leading-tight tw:text-primary tw:md:text-4xl">
              Xilolo Support Chat
            </span>
          </div>

          {hasAccess ? (
            <button
              type="button"
              onClick={createConversation}
              disabled={creating}
              className="tw:inline-flex tw:w-fit tw:items-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-4 tw:py-3 tw:text-sm tw:font-bold tw:text-white tw:shadow-[0_14px_34px_rgba(17,17,17,0.18)] tw:transition hover:tw:bg-black disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
            >
              {creating ? (
                <Loader2 className="tw:animate-spin" size={17} />
              ) : (
                <MessageSquarePlus size={17} />
              )}
              New chat
            </button>
          ) : null}
        </div>

        {error && (
          <div className="tw:rounded-2xl tw:border tw:border-orange-200 tw:bg-orange-50 tw:px-5 tw:py-3 tw:text-sm tw:font-medium tw:text-orange-800">
            {error}
          </div>
        )}

        <section className="tw:grid tw:min-h-[620px] tw:overflow-hidden tw:rounded-3xl tw:border tw:border-black/10 tw:bg-white tw:shadow-[0_24px_65px_rgba(17,17,17,0.12)] tw:lg:grid-cols-[320px_1fr]">
          <aside className="tw:border-b tw:border-gray-100 tw:bg-white tw:lg:border-b-0 tw:lg:border-r">
            <div className="tw:flex tw:items-center tw:justify-between tw:border-b tw:border-gray-100 tw:px-4 tw:py-4">
              <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-black tw:text-gray-900">
                <Headphones size={18} />
                Chat history
              </div>
              <span className="tw:rounded-full tw:bg-gray-100 tw:px-2 tw:py-1 tw:text-xs tw:font-bold tw:text-gray-500">
                {conversations.length}
              </span>
            </div>

            <div className="tw:max-h-[220px] tw:overflow-y-auto tw:lg:max-h-[640px]">
              {loading ? (
                <div className="tw:grid tw:min-h-32 tw:place-items-center tw:text-gray-400">
                  <Loader2 className="tw:animate-spin" size={22} />
                </div>
              ) : !hasAccess ? (
                <div className="tw:p-4 tw:text-sm tw:font-medium tw:text-gray-500">
                  Support chat is available to users with an active subscription.
                </div>
              ) : conversations.length === 0 ? (
                <div className="tw:p-4 tw:text-sm tw:font-medium tw:text-gray-500">
                  No support chats yet. Start a new chat when you need help.
                </div>
              ) : (
                conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => openConversation(conversation)}
                    className={[
                      "tw:block tw:w-full tw:border-b tw:border-gray-100 tw:px-4 tw:py-3 tw:text-left tw:transition hover:tw:bg-gray-50",
                      activeConversation?.id === conversation.id
                        ? "tw:bg-gray-100"
                        : "tw:bg-white",
                    ].join(" ")}
                  >
                    <div className="tw:mb-1 tw:flex tw:items-center tw:justify-between tw:gap-2">
                      <span className="tw:truncate tw:text-sm tw:font-bold tw:text-gray-900">
                        {conversation.subject || "Support chat"}
                      </span>
                      <span
                        className={[
                          "tw:shrink-0 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-[10px] tw:font-black tw:uppercase",
                          conversation.status === "closed"
                            ? "tw:bg-gray-200 tw:text-gray-600"
                            : "tw:bg-emerald-50 tw:text-emerald-700",
                        ].join(" ")}
                      >
                        {statusLabel(conversation.status)}
                      </span>
                    </div>
                    <p className="tw:line-clamp-2 tw:text-xs tw:leading-5 tw:text-gray-500">
                      {conversation.latest_message?.body || "No messages yet"}
                    </p>
                  </button>
                ))
              )}
            </div>
          </aside>

          <div className="tw:flex tw:min-h-[620px] tw:flex-col">
            <header className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-100 tw:bg-white tw:px-4 tw:py-4 tw:md:px-5">
              <div className="tw:min-w-0">
                <span className="tw:block tw:truncate tw:text-base tw:font-black tw:text-gray-900 tw:md:text-lg">
                  {activeConversation?.subject || "Support chat"}
                </span>
                <span className="tw:mt-0.5 tw:block tw:text-xs tw:font-semibold tw:text-gray-500">
                  {activeConversation
                    ? `Status: ${statusLabel(activeConversation.status)}`
                    : "Create or select a chat to begin"}
                </span>
              </div>

              {activeConversation && !isClosed ? (
                <button
                  type="button"
                  onClick={closeConversation}
                  disabled={closing}
                  className="tw:inline-flex tw:items-center tw:gap-2 tw:rounded-xl tw:border tw:border-red-200 tw:bg-red-50 tw:px-3 tw:py-2 tw:text-xs tw:font-bold tw:text-red-700 tw:transition hover:tw:bg-red-100 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                >
                  {closing ? (
                    <Loader2 className="tw:animate-spin" size={15} />
                  ) : (
                    <XCircle size={15} />
                  )}
                  Close chat
                </button>
              ) : null}
            </header>

            <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-3 tw:overflow-y-auto tw:bg-slate-50 tw:p-4 tw:md:p-6">
              {threadLoading ? (
                <div className="tw:m-auto tw:grid tw:w-full tw:max-w-md tw:place-items-center tw:rounded-2xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-white tw:p-6 tw:text-center tw:text-gray-500">
                  <Loader2 className="tw:animate-spin" size={24} />
                </div>
              ) : !hasAccess ? (
                <div className="tw:m-auto tw:w-full tw:max-w-md tw:rounded-2xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-white tw:p-6 tw:text-center tw:text-sm tw:font-medium tw:text-gray-600">
                  Support chat is available to users with an active subscription.
                </div>
              ) : !activeConversation ? (
                <div className="tw:m-auto tw:w-full tw:max-w-md tw:rounded-2xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-white tw:p-6 tw:text-center tw:text-sm tw:font-medium tw:text-gray-600">
                  Start a new chat or select one from your history.
                </div>
              ) : messages.length === 0 ? (
                <div className="tw:m-auto tw:w-full tw:max-w-md tw:rounded-2xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-white tw:p-6 tw:text-center tw:text-sm tw:font-medium tw:text-gray-600">
                  Send your first message and Xilolo Support can reply in real time.
                </div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={[
                        "tw:max-w-[82%] tw:whitespace-pre-wrap tw:break-words tw:rounded-2xl tw:px-4 tw:py-3 tw:text-sm tw:leading-relaxed tw:md:max-w-[620px] tw:md:text-base",
                        message.sender_type === "admin"
                          ? "tw:self-start tw:border tw:border-gray-200 tw:bg-white tw:text-gray-800"
                          : "tw:self-end tw:bg-primary tw:text-white",
                      ].join(" ")}
                    >
                      {message.body}
                    </div>
                  ))}
                  <div ref={endRef} />
                </>
              )}
            </div>

            <form
              className="tw:grid tw:grid-cols-[1fr_48px] tw:gap-3 tw:border-t tw:border-gray-100 tw:bg-white tw:p-4"
              onSubmit={handleSubmit}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={
                  isClosed
                    ? "This chat is closed"
                    : activeConversation
                      ? "Message Xilolo Support..."
                      : "Create a new chat to send a message..."
                }
                disabled={!hasAccess || loading || sending || isClosed}
                className="tw:min-w-0 tw:rounded-xl tw:border tw:border-gray-300 tw:px-4 tw:text-base tw:text-gray-900 tw:outline-none tw:transition focus:tw:border-[#111111] focus:tw:ring-4 focus:tw:ring-black/10 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
              />
              <button
                type="submit"
                disabled={!input.trim() || !hasAccess || sending || isClosed}
                className="tw:grid tw:h-12 tw:w-12 tw:place-items-center tw:rounded-xl tw:bg-primary tw:text-white tw:transition hover:tw:bg-black disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="tw:animate-spin" size={18} />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
