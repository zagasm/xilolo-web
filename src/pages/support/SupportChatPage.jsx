import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Transition } from "@headlessui/react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import {
  ChevronLeft,
  Headphones,
  Loader2,
  MessageCircle,
  MessageSquarePlus,
  Plus,
  Search,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, authHeaders } from "../../lib/apiClient";
import { Button, Chip, EmptyState, Input } from "../../component/ui";

window.Pusher = Pusher;

function getToken() {
  return localStorage.getItem("token") || "";
}

function buildEcho(token) {
  const key = import.meta.env.VITE_REVERB_APP_KEY;
  const host = import.meta.env.VITE_REVERB_HOST;
  const port = import.meta.env.VITE_REVERB_PORT;
  const scheme = import.meta.env.VITE_REVERB_SCHEME || "https";
  const apiUrl = import.meta.env.VITE_API_URL || "https://api.xilolo.com";

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

const HIDDEN_SCROLLBAR_STYLE = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

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
  const [conversationSearch, setConversationSearch] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const echoRef = useRef(null);
  const endRef = useRef(null);

  const hasAccess = isSubscriptionActive(subscriptionStatus);
  const isClosed = activeConversation?.status === "closed";
  const filteredConversations = useMemo(() => {
    const term = conversationSearch.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((conversation) => {
      const label = `${conversation.subject || "Support chat"} ${
        conversation.latest_message?.body || ""
      }`;
      return label.toLowerCase().includes(term);
    });
  }, [conversationSearch, conversations]);

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

  const conversationList = (
    <div
      className="xilolo-support-scroll tw:mt-5 tw:flex tw:flex-1 tw:flex-col tw:gap-3 tw:overflow-y-auto"
      style={HIDDEN_SCROLLBAR_STYLE}
    >
      <div className="tw:flex tw:items-center tw:justify-between">
        <span className="tw:font-display tw:text-base tw:font-bold tw:text-ink">
          Recent
        </span>
        <Chip>{conversations.length}</Chip>
      </div>

      {loading ? (
        <div className="tw:flex tw:items-center tw:gap-2 tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4 tw:text-sm tw:text-muted-strong">
          <Loader2 className="tw:animate-spin" size={16} aria-hidden="true" />
          Loading support chats
        </div>
      ) : !hasAccess ? (
        <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4 tw:text-sm tw:leading-6 tw:text-muted-strong">
          Support chat is available with an active Xilolo subscription.
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:p-4 tw:text-sm tw:leading-6 tw:text-muted-strong">
          No matching chats yet.
        </div>
      ) : (
        <div className="tw:flex tw:flex-col tw:gap-3">
          {filteredConversations.map((conversation) => {
            const active = activeConversation?.id === conversation.id;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => {
                  openConversation(conversation);
                  setMobileDrawerOpen(false);
                }}
                className={[
                  "tw:flex tw:min-h-16 tw:w-full tw:flex-col tw:gap-1 tw:rounded-card tw:border tw:px-4 tw:py-3 tw:text-left tw:transition-colors",
                  active
                    ? "tw:border-accent tw:bg-paper-raised"
                    : "tw:border-hairline tw:bg-paper-raised tw:hover:border-accent/40",
                ].join(" ")}
              >
                <span className="tw:flex tw:items-center tw:justify-between tw:gap-2">
                  <span className="tw:min-w-0 tw:truncate tw:text-sm tw:font-semibold tw:text-ink">
                    {conversation.subject || "Support chat"}
                  </span>
                  <Chip active={conversation.status !== "closed"}>
                    {statusLabel(conversation.status)}
                  </Chip>
                </span>
                <span className="tw:line-clamp-2 tw:text-xs tw:leading-5 tw:text-muted">
                  {conversation.latest_message?.body || "No messages yet"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <main className="tw:min-h-screen tw:bg-paper tw:px-2 tw:pb-2 tw:pt-[72px] tw:font-sans tw:text-ink tw:sm:px-3 tw:sm:pb-4 tw:md:px-5 tw:md:pt-[88px]">
      <style>{`
        .xilolo-support-scroll::-webkit-scrollbar{display:none;}
        @supports (height: 100dvh) {
          .xilolo-support-shell{height:calc(100dvh - 96px);}
          @media (max-width:520px){.xilolo-support-shell{height:calc(100dvh - 78px);}}
        }
      `}</style>

      <Transition show={mobileDrawerOpen}>
        <div className="tw:fixed tw:inset-0 tw:z-70 tw:lg:hidden">
          <Transition.Child
            enter="tw:transition-opacity tw:duration-200"
            enterFrom="tw:opacity-0"
            enterTo="tw:opacity-100"
            leave="tw:transition-opacity tw:duration-150"
            leaveFrom="tw:opacity-100"
            leaveTo="tw:opacity-0"
          >
            <button
              type="button"
              aria-label="Close support history"
              className="tw:absolute tw:inset-0 tw:bg-ink/48"
              onClick={() => setMobileDrawerOpen(false)}
            />
          </Transition.Child>

          <Transition.Child
            enter="tw:transition tw:duration-200 tw:ease-out"
            enterFrom="tw:-translate-x-full"
            enterTo="tw:translate-x-0"
            leave="tw:transition tw:duration-150 tw:ease-in"
            leaveFrom="tw:translate-x-0"
            leaveTo="tw:-translate-x-full"
          >
            <aside className="tw:relative tw:flex tw:h-full tw:w-[min(84vw,330px)] tw:flex-col tw:border-r tw:border-hairline tw:bg-paper tw:p-4">
              <div className="tw:flex tw:items-center tw:justify-between">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={createConversation}
                  disabled={!hasAccess || creating}
                >
                  {creating ? (
                    <Loader2 className="tw:animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <Plus size={16} aria-hidden="true" />
                  )}
                  New chat
                </Button>

                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="tw:grid tw:size-11 tw:shrink-0 tw:place-items-center tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:text-accent-deep tw:transition-colors tw:hover:bg-chip"
                  aria-label="Close support history"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="tw:relative tw:mt-5 tw:flex tw:items-center">
                <Input
                  value={conversationSearch}
                  onChange={(event) => setConversationSearch(event.target.value)}
                  placeholder="Search"
                  aria-label="Search support chats"
                  style={{ paddingRight: 42 }}
                />
                <Search
                  className="tw:pointer-events-none tw:absolute tw:right-3.5 tw:size-4 tw:text-muted"
                  aria-hidden="true"
                />
              </div>

              {conversationList}
            </aside>
          </Transition.Child>
        </div>
      </Transition>

      <section
        className="xilolo-support-shell tw:mx-auto tw:flex tw:h-[calc(100vh-104px)] tw:min-h-0 tw:w-full tw:max-w-[1200px] tw:overflow-hidden tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:max-[520px]:h-[calc(100vh-82px)]"
        aria-label="Xilolo support chat"
      >
        <aside className="tw:hidden tw:w-[290px] tw:shrink-0 tw:flex-col tw:border-r tw:border-hairline tw:bg-paper tw:p-4 tw:lg:flex">
          <div className="tw:flex tw:items-center tw:justify-between">
            <button
              type="button"
              onClick={createConversation}
              disabled={!hasAccess || creating}
              className="tw:grid tw:size-11 tw:place-items-center tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:text-accent-deep tw:transition-colors tw:hover:bg-chip tw:disabled:cursor-not-allowed tw:disabled:opacity-50"
              aria-label="Start new support chat"
            >
              {creating ? (
                <Loader2 className="tw:animate-spin" size={16} aria-hidden="true" />
              ) : (
                <Plus size={17} aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="tw:grid tw:size-11 tw:place-items-center tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:text-accent-deep tw:transition-colors tw:hover:bg-chip"
              aria-label="Close support chat"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="tw:relative tw:mt-5 tw:flex tw:items-center">
            <Input
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
              placeholder="Search"
              aria-label="Search support chats"
              style={{ paddingRight: 42 }}
            />
            <Search
              className="tw:pointer-events-none tw:absolute tw:right-3.5 tw:size-4 tw:text-muted"
              aria-hidden="true"
            />
          </div>

          {conversationList}
        </aside>

        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
          <div className="tw:flex tw:h-14 tw:shrink-0 tw:items-center tw:justify-between tw:px-3 tw:lg:hidden">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <MessageCircle size={17} aria-hidden="true" />
              Recent
            </Button>

            <button
              type="button"
              onClick={createConversation}
              disabled={!hasAccess || creating}
              className="tw:grid tw:size-11 tw:place-items-center tw:rounded-pill tw:border tw:border-hairline tw:bg-paper-raised tw:text-accent-deep tw:transition-colors tw:hover:bg-chip tw:disabled:cursor-not-allowed tw:disabled:opacity-50"
              aria-label="New support chat"
            >
              {creating ? (
                <Loader2 className="tw:animate-spin" size={18} aria-hidden="true" />
              ) : (
                <Plus size={18} aria-hidden="true" />
              )}
            </button>
          </div>

          <div
            className="xilolo-support-scroll tw:flex tw:flex-1 tw:flex-col tw:overflow-y-auto tw:px-3 tw:pb-3 tw:sm:px-4 tw:md:px-6"
            style={HIDDEN_SCROLLBAR_STYLE}
          >
            <div className="tw:mx-auto tw:flex tw:min-h-full tw:w-full tw:max-w-5xl tw:flex-col">
              <div className="tw:pb-4 tw:pt-4 tw:text-center tw:sm:pt-6 tw:md:pb-6 tw:md:pt-7">
                <div className="tw:mx-auto tw:mb-4 tw:grid tw:size-14 tw:place-items-center tw:rounded-pill tw:border tw:border-hairline tw:bg-accent-soft tw:text-accent-deep tw:sm:size-16">
                  <Headphones size={22} aria-hidden="true" />
                </div>

                <span className="tw:block tw:font-display tw:text-2xl tw:font-extrabold tw:tracking-[-0.01em] tw:text-ink tw:sm:text-3xl tw:md:text-4xl">
                  Xilolo Support
                </span>

                <span className="tw:mt-2 tw:block tw:text-sm tw:text-muted tw:md:text-base">
                  {activeConversation
                    ? `Status: ${statusLabel(activeConversation.status)}`
                    : "Start a chat and our team can reply in real time."}
                </span>
              </div>

              {error && (
                <div
                  role="alert"
                  className="tw:mx-auto tw:mb-4 tw:w-full tw:max-w-4xl tw:rounded-card tw:border tw:border-danger/30 tw:bg-paper-raised tw:px-4 tw:py-2.5 tw:text-sm tw:text-danger"
                >
                  {error}
                </div>
              )}

              <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-4xl tw:flex-1 tw:flex-col tw:gap-4 tw:pb-4">
                <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-4">
                  {threadLoading || loading ? (
                    <div className="tw:m-auto tw:flex tw:items-center tw:gap-2 tw:rounded-card tw:border tw:border-hairline tw:bg-paper tw:p-5 tw:text-sm tw:text-muted-strong">
                      <Loader2 className="tw:animate-spin" size={18} aria-hidden="true" />
                      Loading support chat
                    </div>
                  ) : !hasAccess ? (
                    <EmptyState
                      icon={Headphones}
                      title="Support chat is available to users with an active subscription."
                    />
                  ) : !activeConversation ? (
                    <EmptyState
                      icon={MessageSquarePlus}
                      title="Start a new support chat or select one from your recent chats."
                      action={
                        <Button
                          type="button"
                          variant="primary"
                          size="lg"
                          onClick={createConversation}
                          disabled={creating}
                        >
                          {creating ? (
                            <Loader2 className="tw:animate-spin" size={16} aria-hidden="true" />
                          ) : (
                            <MessageSquarePlus size={16} aria-hidden="true" />
                          )}
                          New chat
                        </Button>
                      }
                    />
                  ) : messages.length === 0 ? (
                    <EmptyState
                      icon={MessageCircle}
                      title="Send your first message. Xilolo Support will reply here."
                    />
                  ) : (
                    <>
                      {messages.map((message) => {
                        const isUser = message.sender_type === "user";

                        return (
                          <div
                            key={message.id}
                            className={[
                              "tw:flex tw:w-full",
                              isUser ? "tw:justify-end" : "tw:justify-start",
                            ].join(" ")}
                          >
                            <div
                              className={[
                                "tw:max-w-[86%] tw:whitespace-pre-wrap tw:break-words tw:rounded-card tw:px-4 tw:py-3 tw:text-sm tw:leading-6 tw:sm:max-w-[78%]",
                                isUser
                                  ? "tw:bg-accent tw:font-medium tw:text-ink"
                                  : "tw:border tw:border-hairline tw:bg-chip tw:text-ink",
                              ].join(" ")}
                            >
                              {message.body}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={endRef} />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {activeConversation && !isClosed && (
            <div className="tw:mx-4 tw:mb-3 tw:flex tw:flex-wrap tw:items-center tw:justify-between tw:gap-2.5 tw:rounded-card tw:border tw:border-hairline tw:bg-paper tw:px-4 tw:py-2.5 tw:text-sm tw:text-muted-strong tw:md:mx-8">
              <span>Done with this issue?</span>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={closeConversation}
                disabled={closing}
              >
                {closing ? (
                  <Loader2 className="tw:animate-spin" size={14} aria-hidden="true" />
                ) : (
                  <XCircle size={14} aria-hidden="true" />
                )}
                Close chat
              </Button>
            </div>
          )}

          <form
            className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:pb-16 tw:sm:px-4 tw:md:px-6 tw:md:pb-3"
            onSubmit={handleSubmit}
          >
            <Input
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
              className="tw:min-w-0 tw:flex-1"
            />
            <button
              type="submit"
              disabled={!input.trim() || !hasAccess || sending || isClosed}
              className="tw:grid tw:size-12 tw:shrink-0 tw:place-items-center tw:rounded-pill tw:bg-accent tw:text-ink tw:transition-colors tw:hover:bg-ink tw:hover:text-paper-raised tw:disabled:cursor-not-allowed tw:disabled:opacity-50"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="tw:animate-spin" size={18} aria-hidden="true" />
              ) : (
                <Send size={18} aria-hidden="true" />
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
