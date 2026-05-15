import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ImagePlus,
  Loader2,
  MessageCircle,
  Minus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { api, authHeaders } from "../../lib/apiClient";
import "./xiloloAssistant.css";

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

  const loadAiConversation = useCallback(async () => {
    if (aiConversationId || !hasAccess) return aiConversationId;

    try {
      const listResponse = await api.get("/api/v1/ai/conversations", authHeaders());
      const existing = listResponse.data?.data?.data?.[0] || listResponse.data?.data?.[0];

      if (existing?.id) {
        setAiConversationId(existing.id);
        const showResponse = await api.get(`/api/v1/ai/conversations/${existing.id}`, authHeaders());
        const loaded = normalizeMessages(showResponse.data?.data?.messages || []);
        setAiMessages(loaded.length ? loaded : [INITIAL_AI_MESSAGE]);
        return existing.id;
      }

      const createResponse = await api.post("/api/v1/ai/conversations", {}, authHeaders());
      const id = createResponse.data?.data?.id;
      setAiConversationId(id);
      return id;
    } catch (error) {
      const code = error?.response?.data?.code;
      if (code === "AI_CONSENT_REQUIRED") setIsConsentRequired(true);
      if (code === "BLUE_BADGE_REQUIRED") setGateError("Xilolo AI is available to Blue Badge subscribers.");
      throw error;
    }
  }, [aiConversationId, hasAccess]);

  const acceptConsent = async () => {
    setIsSending(true);
    try {
      await api.post("/api/v1/ai/consent", {}, authHeaders());
      setIsConsentRequired(false);
      await loadAiConversation();
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !hasAccess) return;
    loadAiConversation().catch(() => {});
  }, [hasAccess, isOpen, loadAiConversation]);

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
      setAiConversationId("");
      setAiMessages([INITIAL_AI_MESSAGE]);
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
    <div className="xilolo-assistant">
      {isOpen && (
        <section className="xilolo-assistant-panel" aria-label="Xilolo assistant">
          <header className="xilolo-assistant-header">
            <div>
              <span className="xilolo-assistant-kicker">
                <Sparkles size={14} /> Xilolo
              </span>
              <h2>AI Assistant</h2>
            </div>
            <div className="xilolo-assistant-header-actions">
              {aiConversationId && (
                <button type="button" onClick={resetAiConversation} aria-label="Delete AI conversation">
                  <Trash2 size={16} />
                </button>
              )}
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Minimize assistant">
                <Minus size={16} />
              </button>
            </div>
          </header>

          <div className="xilolo-assistant-body">
            {accessMessage ? (
              <div className="xilolo-assistant-gate">{accessMessage}</div>
            ) : (
              <>
                {aiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`xilolo-assistant-message ${message.role === "user" || message.sender_type === "user" ? "user" : "assistant"}`}
                  >
                    {renderMessageText(message.content)}
                    {message.imageUrl && (
                      <img className="xilolo-assistant-upload-preview" src={message.imageUrl} alt="Uploaded event poster" />
                    )}
                  </div>
                ))}
                {aiMessages.length <= 1 && (
                  <div className="xilolo-assistant-suggestions">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleSuggestedPrompt(prompt)}
                        disabled={isSending}
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
            <div className="xilolo-assistant-alert">
              <span>{isConsentRequired ? "Accept Xilolo AI terms before using AI chat." : gateError}</span>
              {isConsentRequired && (
                <button type="button" onClick={acceptConsent} disabled={isSending}>
                  Accept
                </button>
              )}
            </div>
          )}

          <form className="xilolo-assistant-form" onSubmit={handleSubmit}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              className="xilolo-assistant-file-input"
              onChange={handleImageChange}
            />
            <button
              type="button"
              className="xilolo-assistant-attach"
              onClick={() => fileInputRef.current?.click()}
              disabled={!hasAccess || isSending || isUploadingImage}
              aria-label="Attach event poster"
            >
              {isUploadingImage ? <Loader2 className="spin" size={18} /> : <ImagePlus size={18} />}
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Xilolo AI..."
              disabled={!hasAccess || isSending}
            />
            <button type="submit" disabled={!input.trim() || !hasAccess || isSending} aria-label="Send message">
              {isSending ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="xilolo-assistant-fab"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close Xilolo assistant" : "Open Xilolo assistant"}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={25} />}
      </button>
    </div>
  );
}
