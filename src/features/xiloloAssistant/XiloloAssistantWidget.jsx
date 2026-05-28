import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  ArrowLeft,
  Bot,
  ChevronLeft,
  ImagePlus,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";

const INITIAL_AI_MESSAGE = {
  id: "ai-welcome",
  role: "assistant",
  content: "Hi, I am Xilolo AI. How can I help?",
};

const SUGGESTED_PROMPTS = [
  "How much is in my wallet?",
  "Show me my upcoming events",
  "Do I have any live event right now?",
  "How do I set up OBS for my event?",
];

const TYPEWRITER_SPEED = 14;
const LONG_REPLY_TYPEWRITER_LIMIT = 260;
const THINKING_MESSAGES = [
  "Xilolo AI is reading your request",
  "Checking your events, tickets, and account context",
  "Connecting the useful details",
  "Shaping a clear answer for you",
];
const HIDDEN_SCROLLBAR_STYLE = {
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

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

function ThinkingBubble({ message }) {
  return (
    <div className="tw:flex tw:max-w-[86%] tw:self-start tw:items-center tw:gap-3 tw:rounded-[24px] tw:bg-white/75 tw:px-4 tw:py-3 tw:text-sm tw:font-semibold tw:text-[#444] tw:shadow-sm tw:sm:max-w-[78%]">
      <span className="tw:relative tw:grid tw:h-8 tw:w-8 tw:place-items-center tw:rounded-full tw:bg-primary/10 tw:text-primary">
        <span className="tw:absolute tw:inset-0 tw:animate-ping tw:rounded-full tw:bg-primary/15" />
        <Bot size={15} />
      </span>

      <span className="tw:min-w-0 tw:flex-1">{message}</span>

      <span className="tw:inline-flex tw:items-center tw:gap-1">
        <span className="tw:h-1.5 tw:w-1.5 tw:animate-bounce tw:rounded-full tw:bg-zinc-400 [animation-delay:-0.2s]" />
        <span className="tw:h-1.5 tw:w-1.5 tw:animate-bounce tw:rounded-full tw:bg-zinc-400 [animation-delay:-0.1s]" />
        <span className="tw:h-1.5 tw:w-1.5 tw:animate-bounce tw:rounded-full tw:bg-zinc-400" />
      </span>
    </div>
  );
}

function ConversationMenuItem({
  conversation,
  active,
  onOpen,
  onDelete,
}) {
  return (
    <div
      className={[
        "tw:relative tw:flex tw:h-12 tw:items-center tw:gap-2 tw:rounded-[20px] tw:px-4 tw:transition",
        active ? "tw:bg-white tw:shadow-sm" : "tw:bg-white/70 hover:tw:bg-white",
      ].join(" ")}
      style={{ borderRadius: 36 }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-left tw:text-sm tw:font-bold tw:text-primary"
      >
        {conversation.title || "Xilolo AI conversation"}
      </button>

      <Menu as="div" className="tw:relative tw:shrink-0">
        <Menu.Button
          type="button"
          className="tw:grid tw:h-8 tw:w-8 tw:place-items-center tw:rounded-full tw:text-primary tw:transition hover:tw:bg-[#e5e4e2]"
          aria-label="Conversation options"
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal size={18} />
        </Menu.Button>

        <Transition
          enter="tw:transition tw:duration-100 tw:ease-out"
          enterFrom="tw:scale-95 tw:opacity-0"
          enterTo="tw:scale-100 tw:opacity-100"
          leave="tw:transition tw:duration-75 tw:ease-in"
          leaveFrom="tw:scale-100 tw:opacity-100"
          leaveTo="tw:scale-95 tw:opacity-0"
        >
          <Menu.Items className="tw:absolute tw:right-0 tw:z-50 tw:mt-2 tw:w-36 tw:origin-top-right tw:rounded-2xl tw:border tw:border-[#e6ded4] tw:bg-white tw:p-1 tw:shadow-xl focus:tw:outline-none">
            <Menu.Item>
              {({ active: menuActive }) => (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete();
                  }}
                  className={[
                    "tw:flex tw:w-full tw:items-center tw:gap-2 tw:rounded-xl tw:px-3 tw:py-2 tw:text-left tw:text-sm tw:font-bold tw:text-red-600",
                    menuActive ? "tw:bg-red-50" : "",
                  ].join(" ")}
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}

export default function XiloloAssistantWidget() {
  const isOpen = true;

  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(() => Boolean(getToken()));
  const [gateError, setGateError] = useState("");

  const [aiConversations, setAiConversations] = useState([]);
  const [aiView, setAiView] = useState("chat");
  const [aiListLoading, setAiListLoading] = useState(false);
  const [aiConversationId, setAiConversationId] = useState("");
  const [aiMessages, setAiMessages] = useState([INITIAL_AI_MESSAGE]);
  const [conversationSearch, setConversationSearch] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [assistantStatus, setAssistantStatus] = useState("idle");
  const [thinkingMessageIndex, setThinkingMessageIndex] = useState(0);
  const [isConsentRequired, setIsConsentRequired] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);
  const endRef = useRef(null);
  const typingRequestRef = useRef(0);

  const hasToken = Boolean(getToken());
  const hasAccess = hasToken && isSubscriptionActive(subscriptionStatus);

  const focusChatInput = useCallback(() => {
    requestAnimationFrame(() => {
      if (!hasAccess || isSending) return;
      chatInputRef.current?.focus({ preventScroll: true });
    });
  }, [hasAccess, isSending]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [aiMessages.length, assistantStatus, isOpen, scrollToBottom]);

  useEffect(() => {
    if (!isOpen || !hasAccess || aiView !== "chat") return;
    focusChatInput();
  }, [
    aiMessages.length,
    assistantStatus,
    aiView,
    focusChatInput,
    hasAccess,
    isOpen,
  ]);

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

      if (code === "BLUE_BADGE_REQUIRED" || code === "XILOLO_BADGE_REQUIRED") {
        setGateError("Xilolo AI is available to Xilolo Badge subscribers.");
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
      setMobileDrawerOpen(false);
      focusChatInput();

      return conversationId;
    },
    [focusChatInput, hasAccess]
  );

  const startNewAiConversation = useCallback(() => {
    if (!hasAccess) return;

    setAiConversationId("");
    setAiMessages([INITIAL_AI_MESSAGE]);
    setAiView("chat");
    setMobileDrawerOpen(false);
    focusChatInput();
  }, [focusChatInput, hasAccess]);

  const createAiConversation = useCallback(async () => {
    if (!hasAccess) return "";

    const createResponse = await api.post(
      "/api/v1/ai/conversations",
      {},
      authHeaders()
    );

    const conversation = createResponse.data?.data;
    const id = conversation?.id;

    setAiConversationId(id);
    setAiView("chat");
    focusChatInput();

    if (conversation) {
      setAiConversations((items) => [
        conversation,
        ...items.filter((item) => item.id !== id),
      ]);
    }

    return id;
  }, [focusChatInput, hasAccess]);

  const loadAiConversation = useCallback(async () => {
    if (aiConversationId) return aiConversationId;
    return createAiConversation();
  }, [aiConversationId, createAiConversation]);

  const typeAssistantReply = useCallback(async (reply, messageId) => {
    const requestId = Date.now();
    typingRequestRef.current = requestId;
    const shouldShortType = reply.length > LONG_REPLY_TYPEWRITER_LIMIT;
    const typedLength = shouldShortType
      ? Math.min(LONG_REPLY_TYPEWRITER_LIMIT, reply.length)
      : reply.length;

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

    for (let index = 1; index <= typedLength; index += 1) {
      if (typingRequestRef.current !== requestId) return;

      const nextText = reply.slice(0, index);

      setAiMessages((messages) =>
        messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content: nextText,
                isTyping: true,
              }
            : message
        )
      );

      await sleep(TYPEWRITER_SPEED);
    }

    if (shouldShortType) {
      await sleep(140);
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
  }, []);

  useEffect(() => {
    if (assistantStatus !== "thinking") {
      setThinkingMessageIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setThinkingMessageIndex((index) => (index + 1) % THINKING_MESSAGES.length);
    }, 1400);

    return () => window.clearInterval(interval);
  }, [assistantStatus]);

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

    loadAiConversations().catch(() => {});
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
      focusChatInput();
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
      focusChatInput();
    } catch (error) {
      setGateError(
        error?.response?.data?.message ||
          "Image upload failed. Please try again."
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const deleteAiConversation = async (conversationId) => {
    if (!conversationId) return;

    setIsSending(true);

    try {
      await api.delete(
        `/api/v1/ai/conversations/${conversationId}`,
        authHeaders()
      );

      setAiConversations((items) =>
        items.filter((item) => item.id !== conversationId)
      );

      if (conversationId === aiConversationId) {
        setAiConversationId("");
        setAiMessages([INITIAL_AI_MESSAGE]);
        setAiView("chat");
        focusChatInput();
      }
    } finally {
      setIsSending(false);
    }
  };

  const resetAiConversation = async () => {
    await deleteAiConversation(aiConversationId);
  };

  const accessMessage = useMemo(() => {
    if (!hasToken) return "Sign in to use Xilolo AI.";
    if (statusLoading) return "Checking your subscription...";
    if (!hasAccess) {
      return "Subscribe to Xilolo badge to unlock Xilolo AI and other features.";
    }
    return "";
  }, [hasAccess, hasToken, statusLoading]);

  const filteredConversations = useMemo(() => {
    const term = conversationSearch.trim().toLowerCase();
    if (!term) return aiConversations;

    return aiConversations.filter((conversation) =>
      String(conversation.title || "Xilolo AI conversation")
        .toLowerCase()
        .includes(term)
    );
  }, [aiConversations, conversationSearch]);

  const showChatSurface =
    aiView === "chat" || aiConversationId || aiMessages.length > 1;

  return (
    <main className="tw:min-h-screen tw:bg-white tw:px-2 tw:pb-2 tw:pt-[72px] tw:font-sans tw:text-primary tw:sm:px-3 tw:sm:pb-4 tw:md:px-5 tw:md:pt-[88px]">
      <style>{`
        .xilolo-ai-scroll::-webkit-scrollbar{display:none;}
        .xilolo-ai-noise{background-image:radial-gradient(rgba(17,17,17,.045) .7px, transparent .7px);background-size:6px 6px;}
        @supports (height: 100dvh) {
          .xilolo-ai-shell{height:calc(100dvh - 96px);}
          @media (max-width:520px){.xilolo-ai-shell{height:calc(100dvh - 78px);}}
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
              aria-label="Close recent chats"
              className="tw:absolute tw:inset-0 tw:bg-black/35"
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
            <aside className="tw:relative tw:flex tw:h-full tw:w-[min(84vw,330px)] tw:flex-col tw:bg-[#e9e0d5] tw:p-4 tw:shadow-2xl">
              <div className="tw:flex tw:items-center tw:justify-between">
                <button
                  style={{ borderRadius: 36 }}
                  type="button"
                  onClick={startNewAiConversation}
                  disabled={!hasAccess || isSending}
                  className="tw:inline-flex tw:h-10 tw:items-center tw:gap-2 tw:rounded-full tw:bg-white/75 tw:px-4 tw:text-sm tw:font-black tw:text-primary disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
                >
                  <Plus size={16} />
                  New chat
                </button>

                <button
                  style={{ borderRadius: 36 }}
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="tw:grid tw:h-10 tw:w-10 tw:place-items-center tw:rounded-full tw:bg-white/75 tw:text-primary"
                  aria-label="Close recent chats"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="tw:mt-5 tw:flex tw:h-11 tw:items-center tw:gap-2 tw:rounded-[20px] tw:bg-white/85 tw:px-4 tw:text-sm tw:font-semibold tw:text-primary">
                <input
                  value={conversationSearch}
                  onChange={(event) => setConversationSearch(event.target.value)}
                  placeholder="Search"
                  className="tw:min-w-0 tw:flex-1 tw:bg-transparent tw:text-sm tw:font-semibold tw:outline-none placeholder:tw:text-primary"
                />
                <Search size={18} />
              </div>

              <div
                className="xilolo-ai-scroll tw:mt-5 tw:flex tw:flex-1 tw:flex-col tw:gap-3 tw:overflow-y-auto"
                style={HIDDEN_SCROLLBAR_STYLE}
              >
                <div className="tw:text-base tw:font-black">Recent</div>
                {aiListLoading ? (
                  <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold">
                    <Loader2 className="tw:animate-spin" size={16} />
                    Loading chats
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="tw:rounded-[22px] tw:bg-white/70 tw:p-4 tw:text-sm tw:font-semibold tw:leading-6">
                    Your AI chats will appear here.
                  </div>
                ) : (
                  <div className="tw:flex tw:flex-col tw:gap-3">
                    {filteredConversations.map((conversation) => (
                      <ConversationMenuItem
                        key={conversation.id}
                        conversation={conversation}
                        active={conversation.id === aiConversationId}
                        onOpen={() => openAiConversation(conversation.id)}
                        onDelete={() => deleteAiConversation(conversation.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </aside>
          </Transition.Child>
        </div>
      </Transition>

      <section
        className="xilolo-ai-shell xilolo-ai-noise tw:mx-auto tw:flex tw:h-[calc(100vh-104px)] tw:min-h-0 tw:w-full tw:max-w-[1500px] tw:overflow-hidden tw:rounded-3xl tw:bg-white tw:shadow-[0_18px_60px_rgba(17,17,17,0.12)] max-[520px]:tw:h-[calc(100vh-82px)] max-[520px]:tw:rounded-[18px] tw:lg:rounded-[34px]"
        aria-label="Xilolo assistant"
      >
        <aside className="tw:hidden tw:w-[290px] tw:shrink-0 tw:flex-col tw:bg-[#e9e0d5]/90 tw:p-4 tw:lg:flex">
          <div className="tw:flex tw:items-center tw:justify-between">
            <div className="tw:flex tw:items-center tw:gap-3">
              <button
              style={{
                borderRadius: 36
              }}
                type="button"
                onClick={startNewAiConversation}
                disabled={!hasAccess || isSending}
                className="tw:grid tw:h-8 tw:w-8 tw:place-items-center tw:rounded-full tw:text-primary tw:transition hover:tw:bg-white/70 disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
                aria-label="Start new AI conversation"
              >
                <Plus size={17} />
              </button>

              <button
              style={{
                borderRadius: 36
              }}
                type="button"
                onClick={resetAiConversation}
                disabled={!aiConversationId || isSending}
                className="tw:grid tw:h-8 tw:w-8 tw:place-items-center tw:rounded-full tw:text-primary tw:transition hover:tw:bg-white/70 disabled:tw:cursor-not-allowed disabled:tw:opacity-35"
                aria-label="Delete current conversation"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <button
            style={{
              borderRadius: 36
            }}
              type="button"
              onClick={() => window.history.back()}
              className="tw:grid tw:h-8 tw:w-8 tw:place-items-center tw:rounded-full tw:text-primary tw:transition hover:tw:bg-white/70"
              aria-label="Close Xilolo AI"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          <div className="tw:mt-5 tw:flex tw:h-11 tw:items-center tw:gap-2 tw:rounded-[20px] tw:bg-white/85 tw:px-4 tw:text-sm tw:font-semibold tw:text-primary">
            <input
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
              placeholder="Search"
              className="tw:min-w-0 tw:flex-1 tw:bg-transparent tw:text-sm tw:font-semibold tw:outline-none placeholder:tw:text-primary"
            />
            <Search size={18} />
          </div>

          <div
            className="xilolo-ai-scroll tw:mt-5 tw:flex tw:flex-1 tw:flex-col tw:gap-3 tw:overflow-y-auto"
            style={HIDDEN_SCROLLBAR_STYLE}
          >
            {aiListLoading ? (
              <div className="tw:flex tw:items-center tw:gap-2 tw:text-sm tw:font-semibold">
                <Loader2 className="tw:animate-spin" size={16} />
                Loading chats
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="tw:rounded-[22px] tw:bg-white/70 tw:p-4 tw:text-sm tw:font-semibold tw:leading-6">
                Your AI chats will appear here.
              </div>
            ) : (
              <div className="tw:flex tw:flex-col tw:gap-5">
                <div className="tw:text-base tw:font-black">Recent</div>

                <div className="tw:flex tw:flex-col tw:gap-3">
                  {filteredConversations.map((conversation) => (
                    <ConversationMenuItem
                      key={conversation.id}
                      conversation={conversation}
                      active={conversation.id === aiConversationId}
                      onOpen={() => openAiConversation(conversation.id)}
                      onDelete={() => deleteAiConversation(conversation.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {!hasAccess && !statusLoading && (
            <div className="tw:mt-4 tw:rounded-3xl tw:bg-white/65 tw:p-4">
              <div className="tw:text-sm tw:font-black tw:leading-6">
                Subscribe to Xilolo badge to unlock Xilolo AI and other
                features.
              </div>

              <div className="tw:mt-4 tw:flex tw:items-center tw:justify-between">
                <span className="tw:inline-flex tw:items-center tw:gap-2 tw:text-xs tw:font-black">
                  <Sparkles size={15} /> XILOLO
                </span>

                <span className="tw:grid tw:h-8 tw:w-8 tw:place-items-center tw:rounded-full tw:border tw:border-primary">
                  <ArrowLeft className="tw:rotate-180" size={15} />
                </span>
              </div>
            </div>
          )}
        </aside>

        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
          <div className="tw:flex tw:h-14 tw:shrink-0 tw:items-center tw:justify-between tw:px-3 tw:lg:hidden">
            <button
              style={{ borderRadius: 36 }}
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="tw:inline-flex tw:h-10 tw:items-center tw:gap-2 tw:rounded-full tw:bg-white/80 tw:px-4 tw:text-sm tw:font-black tw:text-primary"
            >
              <MessageCircle size={17} />
              Recent
            </button>

            <button
              style={{ borderRadius: 36 }}
              type="button"
              onClick={startNewAiConversation}
              disabled={!hasAccess || isSending}
              className="tw:grid tw:h-10 tw:w-10 tw:place-items-center tw:rounded-full tw:bg-white/80 tw:text-primary disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
              aria-label="New chat"
            >
              <Plus size={18} />
            </button>
          </div>

          <div
            className="xilolo-ai-scroll tw:flex tw:flex-1 tw:flex-col tw:overflow-y-auto tw:px-3 tw:pb-3 tw:sm:px-4 tw:md:px-6"
            style={HIDDEN_SCROLLBAR_STYLE}
          >
            {accessMessage ? (
              <div className="tw:m-auto tw:w-full tw:max-w-sm tw:rounded-3xl tw:bg-white/65 tw:p-5 tw:text-center">
                <div className="tw:mx-auto tw:grid tw:h-12 tw:w-12 tw:place-items-center tw:rounded-full tw:bg-primary tw:text-white">
                  <Sparkles size={23} />
                </div>

                <div className="tw:mt-4 tw:text-sm tw:font-black tw:leading-6">
                  {accessMessage}
                </div>
              </div>
            ) : aiView === "list" && !showChatSurface ? (
              <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-4 tw:lg:hidden">
                <button
                style={{
                  borderRadius: 36
                }}
                  type="button"
                  onClick={startNewAiConversation}
                  className="tw:flex tw:h-12 tw:items-center tw:justify-center tw:gap-2 tw:rounded-[20px] tw:bg-primary tw:px-4 tw:text-sm tw:font-black tw:text-white"
                >
                  <Plus size={17} />
                  Start new conversation
                </button>

                {aiListLoading ? (
                  <div className="tw:grid tw:min-h-40 tw:place-items-center">
                    <Loader2 className="tw:animate-spin" size={24} />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="tw:rounded-3xl tw:bg-white/70 tw:p-5 tw:text-center tw:text-sm tw:font-semibold">
                    No chats yet.
                  </div>
                ) : (
                  <div className="tw:flex tw:flex-col tw:gap-3">
                    {filteredConversations.map((conversation) => (
                      <ConversationMenuItem
                        key={conversation.id}
                        conversation={conversation}
                        active={conversation.id === aiConversationId}
                        onOpen={() => openAiConversation(conversation.id)}
                        onDelete={() => deleteAiConversation(conversation.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="tw:mx-auto tw:flex tw:min-h-full tw:w-full tw:max-w-5xl tw:flex-col">
                <div className="tw:pb-4 tw:pt-4 tw:text-center tw:sm:pt-6 tw:md:pb-6 tw:md:pt-7">
                  <div className="tw:mx-auto tw:mb-4 tw:h-14 tw:w-14 tw:rounded-full tw:border-10 tw:border-[#d8d0c5] tw:bg-white tw:shadow-[inset_0_0_18px_rgba(17,17,17,.12)] tw:opacity-70 tw:sm:h-16 tw:sm:w-16 tw:sm:border-12" />

                  <span className="tw:block tw:text-2xl tw:font-black tw:tracking-tight tw:sm:text-3xl tw:md:text-4xl">
                    Xilolo AI
                  </span>

                  <span className="tw:mt-2 tw:text-sm tw:tracking-wide tw:text-[#6b625a] tw:md:text-base">
                    Ask anything about your account, events, or streaming.
                  </span>
                </div>

                <div className="tw:mx-auto tw:flex tw:w-full tw:max-w-4xl tw:flex-1 tw:flex-col tw:gap-4 tw:pb-4">
                  <div className="tw:flex tw:flex-1 tw:flex-col tw:gap-4">
                    {aiMessages.map((message) => {
                      const isUser =
                        message.role === "user" ||
                        message.sender_type === "user";

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
                              "tw:max-w-[86%] tw:whitespace-pre-wrap tw:wrap-break-word tw:text-sm tw:font-medium tw:leading-6 tw:sm:max-w-[78%] [&_strong]:tw:font-black",
                              isUser
                                ? "tw:rounded-[18px] tw:bg-primary tw:px-4 tw:py-3 tw:text-white"
                                : "tw:text-[#5f5a55]",
                            ].join(" ")}
                          >
                            {renderMessageText(message.content)}

                            {message.isTyping && (
                              <span className="tw:ml-0.5 tw:inline-block tw:h-4 tw:w-1 tw:animate-pulse tw:rounded-full tw:bg-primary tw:align-middle" />
                            )}

                            {message.imageUrl && (
                              <img
                                className="tw:mt-3 tw:block tw:w-[min(280px,100%)] tw:rounded-[22px] tw:border tw:border-[#d8d0c5]"
                                src={message.imageUrl}
                                alt="Uploaded event poster"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {assistantStatus === "thinking" && (
                      <ThinkingBubble message={THINKING_MESSAGES[thinkingMessageIndex]} />
                    )}

                    {aiMessages.length <= 1 && assistantStatus === "idle" && (
                      <div className="tw:grid tw:gap-2 tw:sm:grid-cols-2">
                        {SUGGESTED_PROMPTS.map((prompt) => (
                          <button
                          style={{
                            borderRadius: 36
                          }}
                            key={prompt}
                            type="button"
                            onClick={() => handleSuggestedPrompt(prompt)}
                            disabled={isSending}
                            className="tw:flex tw:items-center tw:gap-2 tw:rounded-[18px] tw:bg-white/65 tw:px-3 tw:py-2.5 tw:text-left tw:text-xs tw:font-bold tw:text-primary tw:transition hover:tw:bg-white disabled:tw:cursor-not-allowed disabled:tw:opacity-60 sm:tw:text-sm"
                          >
                            <MessageCircle size={16} className="tw:shrink-0" />
                            {prompt}
                          </button>
                        ))}
                      </div>
                    )}

                    <div ref={endRef} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {(gateError || isConsentRequired) && (
            <div className="tw:mx-4 tw:mb-3 tw:flex tw:items-center tw:justify-between tw:gap-2.5 tw:rounded-[18px] tw:bg-white/75 tw:px-4 tw:py-2.5 tw:text-[0.84rem] tw:font-bold tw:text-primary tw:md:mx-8">
              <span>
                {isConsentRequired
                  ? "Accept Xilolo AI terms before using AI chat."
                  : gateError}
              </span>

              {isConsentRequired && (
                <button
                style={{
                  borderRadius: 36
                }}
                  type="button"
                  onClick={acceptConsent}
                  disabled={isSending}
                  className="tw:rounded-full tw:border-0 tw:bg-primary tw:px-3 tw:py-1.5 tw:text-xs tw:font-black tw:text-white disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
                >
                  Accept
                </button>
              )}
            </div>
          )}

          {(aiView === "chat" || showChatSurface) && !accessMessage ? (
            <form
              className="tw:grid tw:grid-cols-[38px_1fr_44px] tw:gap-2 tw:px-3 tw:pb-16 tw:md:pb-3 tw:sm:px-4 tw:md:px-6"
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
              style={{
                borderRadius: 36
              }}
                type="button"
                className="tw:grid tw:h-10 tw:w-9 tw:place-items-center tw:rounded-full tw:bg-transparent tw:text-primary tw:transition hover:tw:bg-white/65 disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={!hasAccess || isSending || isUploadingImage}
                aria-label="Attach event poster"
              >
                {isUploadingImage ? (
                  <Loader2 className="tw:animate-spin" size={19} />
                ) : (
                  <ImagePlus size={19} />
                )}
              </button>

              <textarea
                ref={chatInputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={focusChatInput}
                placeholder={
                  assistantStatus === "thinking"
                    ? "Xilolo is thinking..."
                    : "Ask Xilolo AI..."
                }
                disabled={!hasAccess || isSending}
                rows={1}
                className="tw:max-h-24 tw:min-h-10 tw:min-w-0 tw:resize-none tw:rounded-[16px] tw:border tw:border-[#d8d0c5] tw:bg-white/50 tw:px-3 tw:py-2.5 tw:text-sm tw:font-semibold tw:text-primary tw:outline-none tw:transition placeholder:tw:text-[#8b8580] focus:tw:border-primary disabled:tw:cursor-not-allowed disabled:tw:opacity-60"
              />

              <button
              style={{
                borderRadius: 36
              }}
                type="submit"
                disabled={!input.trim() || !hasAccess || isSending}
                className="tw:grid tw:h-10 tw:w-10 tw:place-items-center tw:rounded-full tw:border-0 tw:bg-primary tw:text-white tw:transition hover:tw:bg-black disabled:tw:cursor-not-allowed disabled:tw:opacity-50"
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
    </main>
  );
}
