import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ImagePlus,
  Loader2,
  MessageCircle,
  Minus,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";

const INITIAL_AI_MESSAGE = {
  id: "ai-welcome",
  role: "assistant",
  content: "Hi, I am Xilolo AI. Ask about your wallet, events, streaming, KYC, or event setup.",
};

const SUGGESTED_PROMPTS = [
  "How much is in my wallet?",
  "Show me my upcoming events",
  "Do I have any live event right now?",
  "How do I set up OBS for my event?",
];

function getToken() {
  return localStorage.getItem("token") || "";
}

function normalizeMessages(messages = []) {
  return messages
    .filter((message) => message?.content || message?.body)
    .map((message) => ({
      id: message.id || `${message.role}-${message.created_at}`,
      role:
        message.role ||
        (message.sender_type === "admin" ? "assistant" : "user"),
      content: message.content || message.body,
      created_at: message.created_at,
      sender_type: message.sender_type,
    }));
}

function renderMessageText(text = "") {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function isSubscriptionActive(status) {
  return Boolean(
    status?.has_active_subscription ||
    status?.subscription?.isActive ||
    status?.subscription?.status === "active"
  );
}

export default function XiloloAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [gateError, setGateError] = useState("");
  const [aiConversations, setAiConversations] = useState([]);
  const [aiView, setAiView] = useState("list");
  const [aiListLoading, setAiListLoading] = useState(false);
  const [aiConversationId, setAiConversationId] = useState("");
  const [aiMessages, setAiMessages] = useState([INITIAL_AI_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isConsentRequired, setIsConsentRequired] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const endRef = useRef(null);

  const hasToken = Boolean(getToken());
  const hasAccess = hasToken && isSubscriptionActive(subscriptionStatus);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [aiMessages.length, isOpen, scrollToBottom]);

  useEffect(() => {
    if (!isOpen || !hasToken) return;

    let ignore = false;
    setStatusLoading(true);
    api
      .get("/api/v1/user/subscription", authHeaders())
      .then((response) => {
        if (!ignore) {
          setSubscriptionStatus(response.data?.data || response.data || null);
          setGateError("");
        }
      })
      .catch(() => {
        if (!ignore) setGateError("We could not verify your subscription right now.");
      })
      .finally(() => {
        if (!ignore) setStatusLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [isOpen, hasToken]);

  const loadAiConversations = useCallback(async () => {
    if (!hasAccess) return;
    setAiListLoading(true);
    try {
      const listResponse = await api.get("/api/v1/ai/conversations", authHeaders());
      setAiConversations(listResponse.data?.data?.data || listResponse.data?.data || []);
    } catch (error) {
      const code = error?.response?.data?.code;
      if (code === "AI_CONSENT_REQUIRED") setIsConsentRequired(true);
      if (code === "BLUE_BADGE_REQUIRED") setGateError("Xilolo AI is available to Blue Badge subscribers.");
      throw error;
    } finally {
      setAiListLoading(false);
    }
  }, [hasAccess]);

  const openAiConversation = useCallback(async (conversationId) => {
    if (!conversationId || !hasAccess) return "";

    const showResponse = await api.get(`/api/v1/ai/conversations/${conversationId}`, authHeaders());
    const loaded = normalizeMessages(showResponse.data?.data?.messages || []);
    setAiConversationId(conversationId);
    setAiMessages(loaded.length ? loaded : [INITIAL_AI_MESSAGE]);
    setAiView("chat");
    return conversationId;
  }, [hasAccess]);

  const startNewAiConversation = useCallback(async () => {
    if (!hasAccess) return "";

    const createResponse = await api.post("/api/v1/ai/conversations", {}, authHeaders());
    const conversation = createResponse.data?.data;
    const id = conversation?.id;
    setAiConversationId(id);
    setAiMessages([INITIAL_AI_MESSAGE]);
    setAiView("chat");
    if (conversation) {
      setAiConversations((items) => [conversation, ...items.filter((item) => item.id !== id)]);
    }
    return id;
  }, [hasAccess]);

  const loadAiConversation = useCallback(async () => {
    if (aiConversationId) return aiConversationId;
    return startNewAiConversation();
  }, [aiConversationId, startNewAiConversation]);

  const acceptConsent = async () => {
    setIsSending(true);
    try {
      await api.post("/api/v1/ai/consent", {}, authHeaders());
      setIsConsentRequired(false);
      await loadAiConversations();
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !hasAccess) return;
    loadAiConversations().catch(() => { });
  }, [hasAccess, isOpen, loadAiConversations]);

  const sendAiMessage = async (message) => {
    const conversationId = await loadAiConversation();
    setAiMessages((messages) => [
      ...messages,
      { id: `user-${Date.now()}`, role: "user", content: message },
    ]);

    const response = await api.post(
      `/api/v1/ai/conversations/${conversationId}/chat`,
      { message },
      authHeaders()
    );

    const reply = response.data?.data?.reply || "I could not process that request.";
    setAiMessages((messages) => [
      ...messages,
      { id: response.data?.data?.message?.id || `assistant-${Date.now()}`, role: "assistant", content: reply },
    ]);
  };

  const sendPrompt = async (message) => {
    const nextMessage = String(message || "").trim();
    if (!nextMessage || isSending || !hasAccess) return;

    setIsSending(true);
    setGateError("");
    try {
      await sendAiMessage(nextMessage);
    } catch (error) {
      const code = error?.response?.data?.code;
      if (code === "AI_CONSENT_REQUIRED") setIsConsentRequired(true);
      setGateError(error?.response?.data?.message || "Message failed. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = input.trim();
    setInput("");
    await sendPrompt(message);
  };

  const handleSuggestedPrompt = async (prompt) => {
    await sendPrompt(prompt);
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !hasAccess || isUploadingImage) return;

    setIsUploadingImage(true);
    setGateError("");

    try {
      const conversationId = await loadAiConversation();
      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", "event_poster");

      const response = await api.post(
        `/api/v1/ai/conversations/${conversationId}/upload`,
        formData,
        {
          ...authHeaders(),
          headers: {
            ...(authHeaders().headers || {}),
            Accept: "application/json",
          },
        }
      );

      const uploaded = response.data?.data;
      setAiMessages((messages) => [
        ...messages,
        {
          id: `asset-${Date.now()}`,
          role: "assistant",
          content: uploaded?.message || "Event poster uploaded. You can now ask Xilolo AI to use it for this event.",
          imageUrl: uploaded?.url,
        },
      ]);
    } catch (error) {
      setGateError(error?.response?.data?.message || "Image upload failed. Please try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const resetAiConversation = async () => {
    if (!aiConversationId) return;
    setIsSending(true);
    try {
      await api.delete(`/api/v1/ai/conversations/${aiConversationId}`, authHeaders());
      setAiConversations((items) => items.filter((item) => item.id !== aiConversationId));
      setAiConversationId("");
      setAiMessages([INITIAL_AI_MESSAGE]);
      setAiView("list");
    } finally {
      setIsSending(false);
    }
  };

  const accessMessage = useMemo(() => {
    if (!hasToken) return "Sign in to use Xilolo AI.";
    if (statusLoading) return "Checking your subscription...";
    if (!hasAccess) return "Xilolo AI is available to active subscribers.";
    return "";
  }, [hasAccess, hasToken, statusLoading]);

  return (
    <div className="tw:fixed tw:bottom-16 tw:right-4 tw:z-1050 tw:flex tw:flex-col tw:items-end tw:font-sans tw:md:bottom-[22px] tw:md:right-[22px]">
      {isOpen && (
        <section
          className="tw:mb-3.5 tw:flex tw:h-[min(610px,calc(100vh-112px))] tw:w-[min(520px,calc(100vw-28px))] tw:flex-col tw:overflow-hidden tw:rounded-[18px] tw:border tw:border-gray-900/10 tw:bg-white tw:text-zinc-900 tw:shadow-[0_24px_70px_rgba(15,23,42,0.22)] max-[520px]:tw:h-[min(600px,calc(100vh-92px))]"
          aria-label="Xilolo assistant"
        >
          <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-gray-200 tw:bg-white tw:px-[18px] tw:pb-3.5 tw:pt-[18px]">
            <div>
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[0.76rem] tw:font-extrabold tw:uppercase tw:text-[#111111]">
                <Sparkles size={14} /> Xilolo
              </span>
              <div className="tw:flex tw:items-center tw:gap-2">
                {aiView === "chat" && (
                  <button
                    type="button"
                    onClick={() => setAiView("list")}
                    className="tw:grid tw:h-7 tw:w-7 tw:place-items-center tw:rounded-lg tw:bg-zinc-100 tw:text-zinc-700"
                    aria-label="Back to AI conversations"
                  >
                    <ArrowLeft size={15} />
                  </button>
                )}
                <span className="tw:block tw:mt-1 tw:text-[1.08rem] tw:font-extrabold tw:leading-tight tw:text-zinc-900">
                  {aiView === "list" ? "Conversations" : "AI Assistant"}
                </span>
              </div>
            </div>
            <div className="tw:flex tw:gap-1.5">
              {aiView === "list" && hasAccess && (
                <button
                  type="button"
                  onClick={startNewAiConversation}
                  className="tw:grid tw:h-[34px] tw:w-[34px] tw:place-items-center tw:rounded-lg tw:border-0 tw:bg-zinc-100 tw:text-zinc-700 tw:transition hover:tw:bg-zinc-200"
                  aria-label="Start new AI conversation"
                >
                  <Plus size={17} />
                </button>
              )}
              {aiConversationId && (
                <button
                  type="button"
                  onClick={resetAiConversation}
                  className="tw:grid tw:h-[34px] tw:w-[34px] tw:place-items-center tw:rounded-lg tw:border-0 tw:bg-zinc-100 tw:text-zinc-700 tw:transition hover:tw:bg-zinc-200"
                  aria-label="Delete AI conversation"
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="tw:grid tw:h-[34px] tw:w-[34px] tw:place-items-center tw:rounded-lg tw:border-0 tw:bg-zinc-100 tw:text-zinc-700 tw:transition hover:tw:bg-zinc-200"
                aria-label="Minimize assistant"
              >
                <Minus size={16} />
              </button>
            </div>
          </div>

          <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-2.5 tw:overflow-y-auto tw:bg-slate-50 tw:p-4">
            {accessMessage ? (
              <div className="tw:m-auto tw:w-full tw:rounded-xl tw:border tw:border-dashed tw:border-gray-300 tw:bg-white tw:p-3.5 tw:text-center tw:text-[0.92rem] tw:text-zinc-600">
                {accessMessage}
              </div>
            ) : aiView === "list" ? (
              <div className="tw:flex tw:flex-col tw:gap-3">
                <button
                  type="button"
                  onClick={startNewAiConversation}
                  className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-[#111111] tw:px-4 tw:py-3 tw:text-sm tw:font-extrabold tw:text-white tw:transition hover:tw:bg-black"
                >
                  <Plus size={17} />
                  Start new conversation
                </button>

                {aiListLoading ? (
                  <div className="tw:grid tw:min-h-40 tw:place-items-center tw:text-zinc-500">
                    <Loader2 className="tw:animate-spin" size={24} />
                  </div>
                ) : aiConversations.length === 0 ? (
                  <div className="tw:rounded-2xl tw:border tw:border-dashed tw:border-zinc-300 tw:bg-white tw:p-4 tw:text-center tw:text-sm tw:font-medium tw:text-zinc-600">
                    No AI conversations yet. Start one when you need help with your account, events, or streaming.
                  </div>
                ) : (
                  <div className="tw:flex tw:flex-col tw:gap-2">
                    {aiConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => openAiConversation(conversation.id)}
                        className="tw:rounded-2xl tw:border tw:border-zinc-200 tw:bg-white tw:p-3 tw:text-left tw:transition hover:tw:border-zinc-300 hover:tw:bg-zinc-50"
                      >
                        <span className="tw:block tw:truncate tw:text-sm tw:font-extrabold tw:text-zinc-900">
                          {conversation.title || "Xilolo AI conversation"}
                        </span>
                        <span className="tw:mt-1 tw:block tw:text-xs tw:font-medium tw:text-zinc-500">
                          {conversation.total_messages || 0} messages
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={[
                      "tw:max-w-[86%] tw:whitespace-pre-wrap tw:break-words tw:rounded-[14px] tw:px-3 tw:py-2.5 tw:text-[0.92rem] tw:leading-[1.45] [&_strong]:tw:font-extrabold",
                      message.role === "user" || message.sender_type === "user"
                        ? "tw:self-end tw:bg-[#111111] tw:text-white"
                        : "tw:self-start tw:border tw:border-gray-200 tw:bg-white tw:text-zinc-800",
                    ].join(" ")}
                  >
                    {renderMessageText(message.content)}
                    {message.imageUrl && (
                      <img
                        className="tw:mt-2.5 tw:block tw:w-[min(260px,100%)] tw:rounded-[10px] tw:border tw:border-zinc-200"
                        src={message.imageUrl}
                        alt="Uploaded event poster"
                      />
                    )}
                  </div>
                ))}
                {aiMessages.length <= 1 && (
                  <div className="tw:mt-0.5 tw:flex tw:flex-wrap tw:gap-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSuggestedPrompt(prompt)}
                        disabled={isSending}
                        className="tw:rounded-full tw:border tw:border-zinc-300 tw:bg-white tw:px-3 tw:py-2 tw:text-[0.82rem] tw:font-bold tw:text-zinc-800 tw:transition hover:tw:border-[#111111] hover:tw:bg-[#111111] hover:tw:text-white disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={endRef} />
              </>
            )}
          </div>

          {(gateError || isConsentRequired) && (
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-2.5 tw:border-t tw:border-orange-200 tw:bg-orange-50 tw:px-3 tw:py-2.5 tw:text-[0.84rem] tw:text-orange-900">
              <span>{isConsentRequired ? "Accept Xilolo AI terms before using AI chat." : gateError}</span>
              {isConsentRequired && (
                <button
                  type="button"
                  onClick={acceptConsent}
                  disabled={isSending}
                  className="tw:rounded-lg tw:border-0 tw:bg-[#111111] tw:px-2.5 tw:py-1.5 tw:font-extrabold tw:text-white disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                >
                  Accept
                </button>
              )}
            </div>
          )}

          {aiView === "chat" && !accessMessage ? (
          <form className="tw:grid tw:grid-cols-[44px_1fr_44px] tw:gap-2 tw:border-t tw:border-gray-100 tw:bg-white tw:p-3" onSubmit={handleSubmit}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              className="tw:hidden"
              onChange={handleImageChange}
            />
            <button
              style={{
                borderRadius: input ? "10px" : "50%",
              }}
              type="button"
              className="tw:grid tw:h-11 tw:w-11 tw:place-items-center tw:rounded-[10px] tw:border tw:border-zinc-200 tw:bg-zinc-100 tw:text-[#111111] tw:transition hover:tw:bg-zinc-200 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
              onClick={() => fileInputRef.current?.click()}
              disabled={!hasAccess || isSending || isUploadingImage}
              aria-label="Attach event poster"
            >
              {isUploadingImage ? <Loader2 className="tw:animate-spin" size={18} /> : <ImagePlus size={18} />}
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Xilolo AI..."
              disabled={!hasAccess || isSending}
              className="tw:h-11 tw:min-w-0 tw:rounded-[10px] tw:border tw:border-zinc-200 tw:px-3 tw:text-[0.95rem] tw:text-zinc-900 tw:outline-none tw:transition focus:tw:border-[#111111] focus:tw:ring-4 focus:tw:ring-black/10 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
            />
            <button
              style={{
                borderRadius: input ? "10px" : "50%",
              }}
              type="submit"
              disabled={!input.trim() || !hasAccess || isSending}
              className="tw:grid tw:h-11 tw:w-11 tw:place-items-center tw:rounded-[10px] tw:border-0 tw:bg-[#111111] tw:text-white tw:transition hover:tw:bg-black disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
              aria-label="Send message"
            >
              {isSending ? <Loader2 className="tw:animate-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
          ) : null}
        </section>
      )}

      <button
        style={{
          borderRadius: isOpen ? "18px" : "44px",
        }}
        type="button"
        className="tw:grid tw:px-4 tw:py-3 tw:md:h-[58px] tw:md:w-[148px] tw:place-items-center tw:rounded-full tw:border-0 tw:bg-primary tw:text-white tw:shadow-[0_18px_38px_rgba(17,17,17,0.28)] tw:transition hover:tw:bg-black"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close Xilolo assistant" : "Open Xilolo assistant"}
      >
        {isOpen ? <X size={24} /> : <span className="tw:inline-flex tw:items-center tw:gap-2">
          <Sparkles className="tw:size-5 tw:md:size-7" />
          <span className="tw:block tw:text-xs tw:md:text-sm tw:font-medium tw:text-white">Xilolo AI</span>
        </span>}
      </button>
    </div>
  );
}
