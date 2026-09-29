import React, { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { SiFacebook, SiLinkedin, SiWhatsapp, SiX } from "react-icons/si";
import CustomModal from "../../modal/customModal";
import { Button } from "../../ui";

/**
 * Share sheet — rebuilt to DESIGN.md.
 *
 * Was: FontAwesome `<i className="fab fa-facebook">` glyphs (the source of the
 * stray FontAwesome/Feather font in the bundle, rendering as blank boxes when the
 * font isn't loaded), the retired coral #FA6342, hardcoded per-brand background
 * colours, bootstrap classes (`col-md-12`, `text-dark-600`), and a `fixed inset-0`
 * dialog nested inside CustomModal.
 *
 * Now: real SVG brand marks from react-icons/si (no icon font), neutral hairline
 * tiles that gain an accent border on hover — brand colours are not our palette,
 * so they don't belong in our chrome — and a copy-link row with real feedback.
 */
const TARGETS = [
  {
    name: "WhatsApp",
    Icon: SiWhatsapp,
    href: (url, text) => `https://api.whatsapp.com/send?text=${text}%20${url}`,
  },
  {
    name: "X",
    Icon: SiX,
    href: (url, text) => `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
  },
  {
    name: "Facebook",
    Icon: SiFacebook,
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${url}`,
  },
  {
    name: "LinkedIn",
    Icon: SiLinkedin,
    href: (url, text) =>
      `https://www.linkedin.com/shareArticle?mini=true&url=${url}&summary=${text}`,
  },
];

const stripHtmlTags = (html) => String(html).replace(/<[^>]+>/g, "");

const getTextContent = (element) => {
  if (typeof element === "string") return stripHtmlTags(element);
  if (React.isValidElement(element)) return getTextContent(element.props.children);
  if (Array.isArray(element)) return element.map(getTextContent).join(" ");
  return "";
};

const SocialShare = ({ title, shareUrl, onClose, isOpen, children }) => {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(shareUrl ?? "");
  const encodedText = encodeURIComponent(getTextContent(children));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked (insecure context) — the field below still allows manual copy */
    }
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose}>
      <div className="tw:w-full tw:max-w-sm tw:rounded-sheet tw:border tw:border-hairline tw:bg-paper-raised tw:p-6">
        <h3 className="tw:font-display tw:text-lg tw:font-bold tw:text-body">
          Share {title || "this"}
        </h3>
        <p className="tw:mt-1 tw:text-sm tw:text-muted">Send it to someone who'd want to be there.</p>

        <div className="tw:mt-5 tw:grid tw:grid-cols-4 tw:gap-2">
          {TARGETS.map(({ name, Icon, href }) => (
            <a
              key={name}
              href={href(encodedUrl, encodedText)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${name}`}
              className="tw:flex tw:flex-col tw:items-center tw:gap-2 tw:rounded-card tw:border tw:border-hairline tw:bg-paper-raised tw:px-2 tw:py-3 tw:transition-colors tw:hover:border-accent/40 tw:hover:bg-chip"
            >
              <Icon className="tw:size-5 tw:text-ink" aria-hidden="true" />
              <span className="tw:text-[11px] tw:font-medium tw:text-muted-strong">{name}</span>
            </a>
          ))}
        </div>

        <div className="tw:mt-4 tw:flex tw:items-center tw:gap-2">
          <div className="tw:flex tw:h-11 tw:min-w-0 tw:flex-1 tw:items-center tw:rounded-control tw:border tw:border-hairline tw:bg-paper tw:px-3">
            <input
              type="text"
              readOnly
              value={shareUrl ?? ""}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Share link"
              className="tw:w-full tw:truncate tw:bg-transparent tw:text-sm tw:text-body tw:outline-none"
            />
          </div>
          <Button size="md" variant="secondary" onClick={handleCopy} aria-live="polite">
            {copied ? <Check className="tw:size-4" /> : <Copy className="tw:size-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <div className="tw:mt-3 tw:flex tw:justify-end">
          <a
            href={`mailto:?subject=${encodeURIComponent(`Check out ${title || "this"}!`)}&body=${encodedText}%0A%0A${encodedUrl}`}
            className="tw:inline-flex tw:items-center tw:gap-2 tw:text-sm tw:font-medium tw:text-accent-deep tw:hover:underline"
          >
            <Mail className="tw:size-4" aria-hidden="true" />
            Send by email
          </a>
        </div>
      </div>
    </CustomModal>
  );
};

export default SocialShare;
