import React, { useState } from "react";
import "./support.css";

function Support() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqs = [
    {
      heading: "General Questions",
    },
    {
      question: "What is Xilolo?",
      answer: [
        "Xilolo is an interactive live streaming platform where creators host events and users can watch, learn, and engage in real time. It supports entertainment, education, and private sessions.",
      ],
    },
    {
      question: "Who can use Xilolo?",
      answer: [
        "Anyone can use Xilolo. Whether you are a content creator, educator, entertainer, or viewer, you can either host events or attend them.",
      ],
    },
    {
      question: "Is Xilolo free to use?",
      answer: [
        "The app is free to download and sign up, but most events require payment depending on the creator’s pricing.",
      ],
    },
    {
      heading: "For Viewers",
    },
    {
      question: "How do I join a live stream?",
      answer: [
        "Create an account, browse available events, and click “Join” on any live or scheduled session.",
      ],
    },
    {
      question: "Can I interact during a stream?",
      answer: [
        "Yes, you can chat, ask questions, and engage with the host in real time.",
      ],
    },
    {
      question: "Do I need to pay for all content?",
      answer: [
        "Most content requires payment based on the creator’s pricing.",
      ],
    },
    {
      question: "Can I watch past streams?",
      answer: [
        "This depends on the creator. Some provide replays, while others only host live sessions.",
      ],
    },
    {
      heading: "For Creators",
    },
    {
      question: "How do I start streaming on Xilolo?",
      answer: [
        "Sign up, create an event, set your pricing, and go live at your scheduled time.",
      ],
    },
    {
      question: "What kind of content can I stream?",
      answer: [
        "You can host live shows, classes or tutorials, concerts, private sessions, and interactive workshops.",
      ],
    },
    {
      question: "Can I earn money on Xilolo?",
      answer: [
        "Yes, you can monetize your streams through paid access, tickets, or exclusive sessions.",
      ],
    },
    {
      question: "How do I get paid?",
      answer: [
        "Creators earn from paid events based on the platform’s payout system and policies.",
      ],
    },
    {
      heading: "Technical and Account",
    },
    {
      question: "What devices support Xilolo?",
      answer: [
        "Xilolo works on smartphones, tablets, and compatible desktop devices.",
      ],
    },
    {
      question: "What internet speed do I need?",
      answer: [
        "Viewers need at least 5 Mbps, while creators are recommended to have at least 10 Mbps for smooth streaming.",
      ],
    },
    {
      question: "What should I do if the app is not working properly?",
      answer: [
        "Update the app, check your internet connection, restart your device, and contact support if the issue persists.",
      ],
    },
    {
      heading: "Safety and Privacy",
    },
    {
      question: "Is my data safe on Xilolo?",
      answer: [
        "Xilolo collects basic information such as email, name, and user content to operate the platform securely.",
      ],
    },
    {
      question: "Can I host private events?",
      answer: [
        "Yes, you can restrict access to selected users or paid participants only.",
      ],
    },
    {
      heading: "Growth and Experience",
    },
    {
      question: "How can I grow my audience on Xilolo?",
      answer: [
        "Promote your streams on social media, stay consistent with your schedule, engage actively with your audience, and offer valuable content.",
      ],
    },
    {
      question: "What makes Xilolo different from other platforms?",
      answer: [
        "Xilolo combines live streaming, real-time interaction, monetization, and both education and entertainment in one platform.",
      ],
    },
  ];

  return (
    <div className="support-container">
      <div className="support-header">
        <span className="tw:text-primary tw:text-2xl tw:md:text-3xl tw:font-bold">Xilolo Support</span>
        <span className="tw:block tw:text-secondary tw:text-lg tw:md:text-xl tw:mt-2">
             Welcome to the Xilolo Support Center <br />
          Weâ€™re here to make sure your laughter never stops!
        </span>
      </div>

      <section className="faq-section">
        <h2>Frequently Asked Questions (FAQ)</h2>
        <div className="faq-list">
          {faqs.map((faq, index) =>
            faq.heading ? (
              <div key={index} className="faq-category">
                <h3>{faq.heading}</h3>
              </div>
            ) : (
              <div
                key={index}
                className={`faq-item ${openFAQ === index ? "open" : ""}`}
              >
                <button className="faq-question" onClick={() => toggleFAQ(index)}>
                  {faq.question}
                  <span className="arrow">{openFAQ === index ? "âˆ’" : "+"}</span>
                </button>
                {openFAQ === index && (
                  <div className="faq-answer">
                    <ul>
                      {faq.answer.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </section>

      <section className="contact-section">
        <h2>Contact Us</h2>
        <span className="tw:text-secondary tw:text-lg tw:md:text-xl tw:mt-2">Still need help? Weâ€™d love to hear from you ðŸ’Œ</span>
        <ul>
          <li>
            ðŸ“§ Email: <a style={{
              color: "#111111",
              textDecoration: "underline",
              fontWeight: "500",
            }} className="tw:text-primary tw:underline" href="mailto:support@xilolo.com">support@xilolo.com</a>
          </li>
          <li>
            ðŸŒ Website:{" "}
            <a style={{
              color: "#111111",
              textDecoration: "underline",
              fontWeight: "500",
            }} className="tw:text-primary tw:underline"
              href="https://www.xilolo.com"
              target="_blank"
              rel="noreferrer"
            >
              www.xilolo.com
            </a>
          </li>
          <li>
            ðŸ“± Twitter / Instagram / TikTok: <b>@xilolo_hq</b>
          </li>
        </ul>
      </section>

      <section className="guidelines-section">
        <h2>Community Guidelines</h2>
        <span className="tw:text-secondary tw:text-lg tw:md:text-xl tw:mt-2">To keep Xilolo fun for everyone, please avoid:</span>
        <ul>
          <li>Posting hateful or harmful content.</li>
          <li>Sharing copyrighted memes without permission.</li>
          <li>Spamming or harassing other users.</li>
        </ul>
      </section>

      <section className="feedback-section">
        
        <p className="tw:block tw:text-secondary tw:text-lg tw:md:text-xl tw:mt-2 footer">âœ¨ Thank you for your feedback! âœ¨</p>
      </section>
    </div>
  );
}

export default Support;
