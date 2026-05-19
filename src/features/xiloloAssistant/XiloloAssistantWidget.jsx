import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  ChevronLeft,
  ImagePlus,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";

const INITIAL_AI_MESSAGE = {
  id: "ai-welcome",
  role: "assistant",
  content:
    "Hi, I am Xilolo AI. Ask about your wallet, events, streaming, KYC, or event setup.",
};

const SUGGESTED_PROMPTS = [
  "How much is in my wallet?",
  "Show me my upcoming events",
  "Do I have any live event right now?",
  "How do I set up OBS for my event?",
];

const TYPEWRITER_SPEED = 14;

function getToken() {
  return localStorage.getItem("token") || "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function ThinkingBubble() {
  return (
    <div className="tw:flex tw:max-w-[86%] tw:self-start tw:items-center tw:gap-2 tw:rounded-2xl tw:border tw:border-zinc-200 tw:bg-white tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:text-zinc-600 tw:shadow-sm">
      <span className="tw:grid tw:h-7 tw:w-7 tw:place-items-center tw:rounded-full tw:bg-primary/10 tw:text-primary">
        <Bot size={15} />
      </span>

      <span>Xilolo is thinking</span>

      <span className="tw:inline-flex tw:items-center tw:gap-1">
        <span className="tw:h-1.5 tw:w-1.5 tw:animate-bounce tw:rounded-full tw:bg-zinc-400 [animation-delay:-0.2s]" />
        <span className="tw:h-1.5 tw:w-1.5 tw:animate-bounce tw:rounded-full tw:bg-zinc-400 [animation-delay:-0.1s]" />
        <span className="tw:h-1.5 tw:w-1.5 tw:animate-bounce tw:rounded-full tw:bg-zinc-400" />
      </span>
    </div>
  );
}

export default function XiloloAssistantWidget() {
  const isOpen = true;

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
  const [assistantStatus, setAssistantStatus] = useState("idle");
  const [isConsentRequired, setIsConsentRequired] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const endRef = useRef(null);
  const typingRequestRef = useRef(0);

  const hasToken = Boolean(getToken());
  const hasAccess = hasToken && isSubscriptionActive(subscriptionStatus);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [aiMessages.length, assistantStatus, isOpen, scrollToBottom]);

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
        if (!ignore) {
          setGateError("We could not verify your subscription right now.");
        }
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
      const listResponse = await api.get(
        "/api/v1/ai/conversations",
        authHeaders()
      );

      setAiConversations(
        listResponse.data?.data?.data || listResponse.data?.data || []
      );
    } catch (error) {
      const code = error?.response?.data?.code;

      if (code === "AI_CONSENT_REQUIRED") setIsConsentRequired(true);

      if (code === "BLUE_BADGE_REQUIRED") {
        setGateError("Xilolo AI is available to Blue Badge subscribers.");
      }

      throw error;
    } finally {
      setAiListLoading(false);
    }
  }, [hasAccess]);

  const openAiConversation = useCallback(
    async (conversationId) => {
      if (!conversationId || !hasAccess) return "";

      const showResponse = await api.get(
        `/api/v1/ai/conversations/${conversationId}`,
        authHeaders()
      );

      const loaded = normalizeMessages(showResponse.data?.data?.messages || []);

      setAiConversationId(conversationId);
      setAiMessages(loaded.length ? loaded : [INITIAL_AI_MESSAGE]);
      setAiView("chat");

      return conversationId;
    },
    [hasAccess]
  );

  const startNewAiConversation = useCallback(async () => {
    if (!hasAccess) return "";

    const createResponse = await api.post(
      "/api/v1/ai/conversations",
      {},
      authHeaders()
    );

    const conversation = createResponse.data?.data;
    const id = conversation?.id;

    setAiConversationId(id);
    setAiMessages([INITIAL_AI_MESSAGE]);
    setAiView("chat");

    if (conversation) {
      setAiConversations((items) => [
        conversation,
        ...items.filter((item) => item.id !== id),
      ]);
    }

    return id;
  }, [hasAccess]);

  const loadAiConversation = useCallback(async () => {
    if (aiConversationId) return aiConversationId;
    return startNewAiConversation();
  }, [aiConversationId, startNewAiConversation]);

  const typeAssistantReply = useCallback(
    async (reply, messageId) => {
      const requestId = Date.now();
      typingRequestRef.current = requestId;

      setAssistantStatus("typing");

      setAiMessages((messages) => [
        ...messages,
        {
          id: messageId,
          role: "assistant",
          content: "",
          isTyping: true,
        },
      ]);

      for (let index = 1; index <= reply.length; index += 1) {
        if (typingRequestRef.current !== requestId) return;

        const nextText = reply.slice(0, index);

        setAiMessages((messages) =>
          messages.map((message) =>
            message.id === messageId
              ? {
                ...message,
                content: nextText,
                isTyping: index < reply.length,
              }
              : message
          )
        );

        await sleep(TYPEWRITER_SPEED);
      }

      setAiMessages((messages) =>
        messages.map((message) =>
          message.id === messageId
            ? {
              ...message,
              content: reply,
              isTyping: false,
            }
            : message
        )
      );
    },
    []
  );

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

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
    };

    setAiMessages((messages) => [...messages, userMessage]);
    setAssistantStatus("thinking");

    const response = await api.post(
      `/api/v1/ai/conversations/${conversationId}/chat`,
      { message },
      authHeaders()
    );

    const reply =
      response.data?.data?.reply || "I could not process that request.";

    const assistantMessageId =
      response.data?.data?.message?.id || `assistant-${Date.now()}`;

    await typeAssistantReply(reply, assistantMessageId);
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

      setGateError(
        error?.response?.data?.message || "Message failed. Please try again."
      );
    } finally {
      setAssistantStatus("idle");
      setIsSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const message = input.trim();
    if (!message) return;

    setInput("");
    await sendPrompt(message);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
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
          content:
            uploaded?.message ||
            "Event poster uploaded. You can now ask Xilolo AI to use it for this event.",
          imageUrl: uploaded?.url,
        },
      ]);

      setAiView("chat");
    } catch (error) {
      setGateError(
        error?.response?.data?.message ||
        "Image upload failed. Please try again."
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const resetAiConversation = async () => {
    if (!aiConversationId) return;

    setIsSending(true);

    try {
      await api.delete(
        `/api/v1/ai/conversations/${aiConversationId}`,
        authHeaders()
      );

      setAiConversations((items) =>
        items.filter((item) => item.id !== aiConversationId)
      );

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
    <main className="tw:min-h-screen tw:bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.12),transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] tw:px-3 tw:pb-24 tw:pt-[92px] tw:font-sans tw:md:px-6 tw:md:pb-10 tw:md:pt-[104px]">
      <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-5xl tw:flex-col tw:gap-4">
        <div className="tw:flex tw:flex-col tw:gap-4">
          <div className="tw:flex tw:flex-col tw:gap-3">
            <button
              style={{
                borderRadius: 24,
                fontSize: 12
              }}
              type="button"
              onClick={() => window.history.back()}
              className="tw:inline-flex tw:w-24 tw:h-10 tw:items-center tw:gap-2 tw:rounded-full tw:border tw:border-zinc-200 tw:bg-white tw:px-3 tw:text-sm tw:font-bold tw:text-zinc-700 tw:shadow-sm tw:transition hover:tw:bg-zinc-50"
            >
              <ChevronLeft size={18} />
              Back
            </button>

            <div>
              <span className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[0.76rem] tw:font-extrabold tw:uppercase tw:tracking-wide tw:text-primary">
                <Sparkles size={14} /> Xilolo AI
              </span>

              <span className="tw:block tw:mt-1 tw:text-2xl tw:font-black tw:leading-tight tw:text-zinc-950 tw:md:text-3xl">
                Your smart Xilolo assistant
              </span>
            </div>
          </div>
        </div>

        <section
          className="tw:flex tw:h-[calc(100vh-182px)] tw:min-h-[560px] tw:w-full tw:overflow-hidden tw:rounded-[28px] tw:border tw:border-white/80 tw:bg-white/85 tw:text-zinc-900 tw:shadow-[0_30px_100px_rgba(15,23,42,0.14)] tw:backdrop-blur-xl max-[520px]:tw:h-[calc(100vh-166px)] max-[520px]:tw:min-h-[500px]"
          aria-label="Xilolo assistant"
        >
          <aside className="tw:hidden tw:w-[290px] tw:flex-col tw:border-r tw:border-zinc-200/80 tw:bg-white/70 tw:p-4 tw:lg:flex">
            <button
              style={{
                borderRadius: 24,
                fontSize: 12
              }}
              type="button"
              onClick={startNewAiConversation}
              disabled={!hasAccess || isSending}
              className="tw:flex tw:w-full tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-4 tw:py-3 tw:text-sm tw:font-extrabold tw:text-white tw:shadow-lg tw:shadow-primary/20 tw:transition hover:tw:bg-black disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
            >
              <Plus size={17} />
              New chat
            </button>

            <div className="tw:mt-5 tw:flex tw:items-center tw:justify-between">
              <span className="tw:block tw:text-xs tw:font-black tw:uppercase tw:tracking-wide tw:text-zinc-400">
                Conversations
              </span>

              {aiListLoading && (
                <Loader2 className="tw:animate-spin tw:text-zinc-400" size={15} />
              )}
            </div>

            <div className="tw:mt-3 tw:flex tw:flex-1 tw:flex-col tw:gap-2 tw:overflow-y-auto tw:pr-1">
              {aiConversations.length === 0 ? (
                <div className="tw:rounded-2xl tw:border tw:border-dashed tw:border-zinc-300 tw:bg-white tw:p-4 tw:text-sm tw:font-medium tw:text-zinc-500">
                  Your AI chats will appear here.
                </div>
              ) : (
                aiConversations.map((conversation) => (
                  <button
                    style={{
                      borderRadius: 24,
                      fontSize: 12
                    }}
                    key={conversation.id}
                    type="button"
                    onClick={() => openAiConversation(conversation.id)}
                    className={[
                      "tw:rounded-2xl tw:border tw:p-3 tw:text-left tw:transition",
                      conversation.id === aiConversationId
                        ? "tw:border-primary/30 tw:bg-primary/10"
                        : "tw:border-zinc-200 tw:bg-white hover:tw:border-zinc-300 hover:tw:bg-zinc-50",
                    ].join(" ")}
                  >
                    <span className="tw:block tw:truncate tw:text-sm tw:font-extrabold tw:text-zinc-900">
                      {conversation.title || "Xilolo AI conversation"}
                    </span>

                    <span className="tw:mt-1 tw:block tw:text-xs tw:font-semibold tw:text-zinc-500">
                      {conversation.total_messages || 0} messages
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
            <div className="tw:flex tw:items-center tw:justify-between tw:gap-3 tw:border-b tw:border-zinc-200/80 tw:bg-white/85 tw:px-4 tw:py-3.5 tw:backdrop-blur-xl tw:md:px-5">
              <div className="tw:flex tw:min-w-0 tw:items-center tw:gap-3">
                {aiView === "chat" && (
                  <button
                    type="button"
                    onClick={() => setAiView("list")}
                    className="tw:grid tw:h-9 tw:w-9 tw:place-items-center tw:rounded-full tw:bg-zinc-100 tw:text-zinc-700 tw:transition hover:tw:bg-zinc-200 tw:lg:hidden"
                    aria-label="Back to AI conversations"
                  >
                    <ArrowLeft size={17} />
                  </button>
                )}

                <div className="tw:grid tw:h-10 tw:w-10 tw:shrink-0 tw:place-items-center tw:rounded-2xl tw:bg-primary tw:text-white tw:shadow-lg tw:shadow-primary/20">
                  <Bot size={20} />
                </div>

                <div className="tw:min-w-0">
                  <span className="tw:block tw:truncate tw:text-base tw:font-black tw:text-zinc-950">
                    {aiView === "list" ? "Conversations" : "Xilolo AI"}
                  </span>

                  <span className="tw:block tw:truncate tw:text-xs tw:font-semibold tw:text-zinc-500">
                    {assistantStatus === "thinking"
                      ? "Thinking..."
                      : assistantStatus === "typing"
                        ? "Typing response..."
                        : "Wallet, events, streaming and account help"}
                  </span>
                </div>
              </div>

              <div className="tw:flex tw:items-center tw:gap-2">
                {aiView === "list" && hasAccess && (
                  <button
                    type="button"
                    onClick={startNewAiConversation}
                    className="tw:grid tw:h-9 tw:w-9 tw:place-items-center tw:rounded-full tw:bg-zinc-100 tw:text-zinc-700 tw:transition hover:tw:bg-zinc-200 tw:lg:hidden"
                    aria-label="Start new AI conversation"
                  >
                    <Plus size={17} />
                  </button>
                )}

                {aiConversationId && (
                  <button
                    type="button"
                    onClick={resetAiConversation}
                    disabled={isSending}
                    className="tw:grid tw:h-9 tw:w-9 tw:place-items-center tw:rounded-full tw:bg-zinc-100 tw:text-zinc-700 tw:transition hover:tw:bg-red-50 hover:tw:text-red-600 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                    aria-label="Delete AI conversation"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-3 tw:overflow-y-auto tw:bg-slate-50/80 tw:p-4 tw:md:p-5">
              {accessMessage ? (
                <div className="tw:m-auto tw:w-full tw:max-w-md tw:rounded-3xl tw:border tw:border-dashed tw:border-zinc-300 tw:bg-white tw:p-6 tw:text-center tw:shadow-sm">
                  <div className="tw:mx-auto tw:grid tw:h-12 tw:w-12 tw:place-items-center tw:rounded-2xl tw:bg-primary/10 tw:text-primary">
                    <Sparkles size={21} />
                  </div>

                  <span className="tw:block tw:mt-4 tw:text-sm tw:font-bold tw:text-zinc-700">
                    {accessMessage}
                  </span>
                </div>
              ) : aiView === "list" ? (
                <div className="tw:flex tw:flex-col tw:gap-3 tw:lg:hidden">
                  <button
                    type="button"
                    onClick={startNewAiConversation}
                    className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-2xl tw:bg-primary tw:px-4 tw:py-3 tw:text-sm tw:font-extrabold tw:text-white tw:shadow-lg tw:shadow-primary/20 tw:transition hover:tw:bg-black"
                  >
                    <Plus size={17} />
                    Start new conversation
                  </button>

                  {aiListLoading ? (
                    <div className="tw:grid tw:min-h-40 tw:place-items-center tw:text-zinc-500">
                      <Loader2 className="tw:animate-spin" size={24} />
                    </div>
                  ) : aiConversations.length === 0 ? (
                    <div className="tw:rounded-2xl tw:border tw:border-dashed tw:border-zinc-300 tw:bg-white tw:p-5 tw:text-center tw:text-sm tw:font-medium tw:text-zinc-600">
                      No AI conversations yet. Start one when you need help
                      with your account, events, or streaming.
                    </div>
                  ) : (
                    <div className="tw:flex tw:flex-col tw:gap-2">
                      {aiConversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() => openAiConversation(conversation.id)}
                          className="tw:rounded-2xl tw:border tw:border-zinc-200 tw:bg-white tw:p-3.5 tw:text-left tw:shadow-sm tw:transition hover:tw:border-zinc-300 hover:tw:bg-zinc-50"
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
                  {aiMessages.map((message) => {
                    const isUser =
                      message.role === "user" || message.sender_type === "user";

                    return (
                      <div
                        key={message.id}
                        className={[
                          "tw:flex tw:max-w-[88%] tw:gap-2.5",
                          isUser ? "tw:self-end" : "tw:self-start",
                        ].join(" ")}
                      >
                        {!isUser && (
                          <span className="tw:mt-1 tw:grid tw:h-8 tw:w-8 tw:shrink-0 tw:place-items-center tw:rounded-full tw:bg-primary/10 tw:text-primary">
                            <Bot size={16} />
                          </span>
                        )}

                        <div
                          className={[
                            "tw:whitespace-pre-wrap tw:wrap-break-word tw:rounded-3xl tw:px-4 tw:py-3 tw:text-[0.93rem] tw:leading-[1.55] tw:shadow-sm [&_strong]:tw:font-extrabold",
                            isUser
                              ? "tw:rounded-br-lg tw:bg-primary tw:text-white"
                              : "tw:rounded-bl-lg tw:border tw:border-zinc-200 tw:bg-white tw:text-zinc-800",
                          ].join(" ")}
                        >
                          {renderMessageText(message.content)}

                          {message.isTyping && (
                            <span className="tw:ml-0.5 tw:inline-block tw:h-4 tw:w-1 tw:animate-pulse tw:rounded-full tw:bg-zinc-400 tw:align-middle" />
                          )}

                          {message.imageUrl && (
                            <img
                              className="tw:mt-3 tw:block tw:w-[min(280px,100%)] tw:rounded-2xl tw:border tw:border-zinc-200"
                              src={message.imageUrl}
                              alt="Uploaded event poster"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {assistantStatus === "thinking" && <ThinkingBubble />}

                  {aiMessages.length <= 1 && assistantStatus === "idle" && (
                    <div className="tw:mt-1 tw:grid tw:gap-2 tw:sm:grid-cols-2">
                      {SUGGESTED_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => handleSuggestedPrompt(prompt)}
                          disabled={isSending}
                          className="tw:flex tw:items-center tw:gap-2 tw:rounded-2xl tw:border tw:border-zinc-200 tw:bg-white tw:px-3 tw:py-3 tw:text-left tw:text-[0.84rem] tw:font-bold tw:text-zinc-800 tw:shadow-sm tw:transition hover:tw:border-primary/30 hover:tw:bg-primary/5 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                        >
                          <MessageCircle
                            size={16}
                            className="tw:shrink-0 tw:text-primary"
                          />
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
              <div className="tw:flex tw:items-center tw:justify-between tw:gap-2.5 tw:border-t tw:border-orange-200 tw:bg-orange-50 tw:px-4 tw:py-2.5 tw:text-[0.84rem] tw:font-semibold tw:text-orange-900">
                <span>
                  {isConsentRequired
                    ? "Accept Xilolo AI terms before using AI chat."
                    : gateError}
                </span>

                {isConsentRequired && (
                  <button
                    type="button"
                    onClick={acceptConsent}
                    disabled={isSending}
                    className="tw:rounded-full tw:border-0 tw:bg-primary tw:px-3 tw:py-1.5 tw:text-xs tw:font-extrabold tw:text-white disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                  >
                    Accept
                  </button>
                )}
              </div>
            )}

            {aiView === "chat" && !accessMessage ? (
              <form
                className="tw:grid tw:grid-cols-[44px_1fr_44px] tw:gap-2 tw:border-t tw:border-zinc-200/80 tw:bg-white/90 tw:p-3 tw:backdrop-blur-xl"
                onSubmit={handleSubmit}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  className="tw:hidden"
                  onChange={handleImageChange}
                />

                <button
                  type="button"
                  className="tw:grid tw:h-11 tw:w-11 tw:place-items-center tw:rounded-2xl tw:border tw:border-zinc-200 tw:bg-zinc-100 tw:text-primary tw:transition hover:tw:bg-zinc-200 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!hasAccess || isSending || isUploadingImage}
                  aria-label="Attach event poster"
                >
                  {isUploadingImage ? (
                    <Loader2 className="tw:animate-spin" size={18} />
                  ) : (
                    <ImagePlus size={18} />
                  )}
                </button>

                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    assistantStatus === "thinking"
                      ? "Xilolo is thinking..."
                      : "Ask Xilolo AI..."
                  }
                  disabled={!hasAccess || isSending}
                  rows={1}
                  className="tw:max-h-32 tw:min-h-11 tw:min-w-0 tw:resize-none tw:rounded-2xl tw:border tw:border-zinc-200 tw:bg-white tw:px-4 tw:py-3 tw:text-[0.95rem] tw:font-medium tw:text-zinc-900 tw:outline-none tw:transition placeholder:tw:text-zinc-400 focus:tw:border-primary/40 focus:tw:ring-4 focus:tw:ring-primary/10 disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                />

                <button
                  type="submit"
                  disabled={!input.trim() || !hasAccess || isSending}
                  className="tw:grid tw:h-11 tw:w-11 tw:place-items-center tw:rounded-2xl tw:border-0 tw:bg-primary tw:text-white tw:shadow-lg tw:shadow-primary/20 tw:transition hover:tw:bg-black disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                  aria-label="Send message"
                >
                  {isSending ? (
                    <Loader2 className="tw:animate-spin" size={18} />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}