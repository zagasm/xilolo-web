import { useCallback, useEffect, useRef, useState } from "react";
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { ArrowLeft, Headphones, Loader2, Send } from "lucide-react";
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
      sender_type: message.sender_type || (message.role === "assistant" ? "admin" : "user"),
      created_at: message.created_at,
    }));
}

export default function SupportChatPage() {
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const echoRef = useRef(null);
  const endRef = useRef(null);

  const hasAccess = isSubscriptionActive(subscriptionStatus);

  const subscribeConversation = useCallback((id) => {
    if (!id || echoRef.current) return;

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
    });
  }, []);

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

        if (!isSubscriptionActive(status)) return;

        const listResponse = await api.get("/api/v1/support/conversations", authHeaders());
        const existing = listResponse.data?.data?.data?.[0] || listResponse.data?.data?.[0];

        if (existing?.id) {
          setConversationId(existing.id);
          const showResponse = await api.get(`/api/v1/support/conversations/${existing.id}`, authHeaders());
          setMessages(normalizeMessages(showResponse.data?.data?.messages || []));
          subscribeConversation(existing.id);
        }
      } catch (err) {
        if (!ignore) setError(err?.response?.data?.message || "Unable to load support chat.");
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
  }, [subscribeConversation]);

  useEffect(() => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, [messages.length]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const body = input.trim();
    if (!body || sending || !hasAccess) return;

    setInput("");
    setSending(true);
    setError("");

    try {
      if (!conversationId) {
        const response = await api.post(
          "/api/v1/support/conversations",
          { subject: "Support chat", message: body },
          authHeaders()
        );
        const nextId = response.data?.data?.id;
        setConversationId(nextId);
        setMessages(
          normalizeMessages(
            response.data?.data?.messages ||
              (response.data?.data?.latest_message ? [response.data.data.latest_message] : [])
          )
        );
        subscribeConversation(nextId);
        return;
      }

      const optimistic = {
        id: `local-${Date.now()}`,
        body,
        sender_type: "user",
        created_at: new Date().toISOString(),
      };
      setMessages((items) => [...items, optimistic]);
      await api.post(`/api/v1/support/conversations/${conversationId}/messages`, { message: body }, authHeaders());
    } catch (err) {
      setError(err?.response?.data?.message || "Message failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="tw:min-h-[calc(100vh-84px)] tw:bg-[#f6f3ee] tw:px-4 tw:py-6 tw:md:px-6 tw:md:py-10">
      <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-5xl tw:flex-col tw:gap-4">
        <div className="tw:md:mt-10 tw:flex tw:flex-col tw:gap-3 tw:sm:flex-row tw:sm:items-center tw:sm:justify-between">
          <div>
            <button
            style={{
              borderRadius: "9999px",
            }}
              type="button"
              onClick={() => navigate(-1)}
              className="tw:mb-3 tw:inline-flex tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-black/10 tw:bg-white/80 tw:px-4 tw:py-2 tw:text-sm tw:font-semibold tw:text-gray-800 tw:shadow-sm tw:transition hover:tw:bg-white"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <span className="tw:mt-1 tw:block tw:text-2xl tw:font-black tw:leading-tight tw:text-[#111111] tw:md:text-4xl">
              Xilolo Support Chat
            </span>
          </div>
        </div>

        <section className="tw:flex tw:h-[min(760px,calc(100vh-180px))] tw:min-h-[560px] tw:flex-col tw:overflow-hidden tw:rounded-[24px] tw:border tw:border-black/10 tw:bg-white tw:shadow-[0_24px_65px_rgba(17,17,17,0.12)]">
          

          {error && (
            <div className="tw:border-b tw:border-orange-200 tw:bg-orange-50 tw:px-5 tw:py-3 tw:text-sm tw:font-medium tw:text-orange-800">
              {error}
            </div>
          )}

          <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-3 tw:overflow-y-auto tw:bg-slate-50 tw:p-4 tw:md:p-6">
            {loading ? (
              <div className="tw:m-auto tw:grid tw:w-full tw:max-w-md tw:place-items-center tw:rounded-2xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-white tw:p-6 tw:text-center tw:text-gray-500">
                <Loader2 className="tw:animate-spin" size={24} />
              </div>
            ) : !hasAccess ? (
              <div className="tw:m-auto tw:w-full tw:max-w-md tw:rounded-2xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-white tw:p-6 tw:text-center tw:text-sm tw:font-medium tw:text-gray-600">
                Support chat is available to users with an active subscription.
              </div>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="tw:m-auto tw:w-full tw:max-w-md tw:rounded-2xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-white tw:p-6 tw:text-center tw:text-sm tw:font-medium tw:text-gray-600">
                    Send your first message and an admin can reply here in real time.
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={[
                      "tw:max-w-[82%] tw:whitespace-pre-wrap tw:break-words tw:rounded-2xl tw:px-4 tw:py-3 tw:text-sm tw:leading-relaxed tw:md:max-w-[620px] tw:md:text-base",
                      message.sender_type === "admin"
                        ? "tw:self-start tw:border tw:border-gray-200 tw:bg-white tw:text-gray-800"
                        : "tw:self-end tw:bg-[#111111] tw:text-white",
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
              placeholder="Message Xilolo Support..."
              disabled={!hasAccess || loading || sending}
              className="tw:min-w-0 tw:rounded-xl tw:border tw:border-gray-300 tw:px-4 tw:text-base tw:text-gray-900 tw:outline-none tw:transition focus:tw:border-[#111111] focus:tw:ring-4 focus:tw:ring-black/10 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || !hasAccess || sending}
              className="tw:grid tw:h-12 tw:w-12 tw:place-items-center tw:rounded-xl tw:bg-[#111111] tw:text-white tw:transition hover:tw:bg-black disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
              aria-label="Send message"
            >
              {sending ? <Loader2 className="tw:animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
