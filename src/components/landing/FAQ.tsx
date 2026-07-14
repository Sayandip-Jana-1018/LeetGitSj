"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "Is this a browser extension?",
    answer:
      "No — that's the whole point. Browser extensions don't work on mobile browsers, and the goal is syncing from any device. LeetPush runs a background sync engine on our servers that polls your LeetCode submissions. Your browser is never involved after the one-time setup.",
  },
  {
    question: "Is my LeetCode session cookie safe?",
    answer:
      "Your session cookies are encrypted with AES-256-GCM immediately on submission and stored encrypted at rest. They are only decrypted in-memory inside our sync worker — never returned to any API response, never logged, and never shared. You can delete all stored data with one click.",
  },
  {
    question: "What happens when my LeetCode session expires?",
    answer:
      "LeetCode sessions aren't permanent. When yours expires, we detect it automatically (our sync engine gets a 401), flag it, and show a clear banner in your dashboard prompting you to paste new cookies. It's the same one-time process — takes about 30 seconds.",
  },
  {
    question: "Does it handle resubmissions?",
    answer:
      "Yes. Each submission has a unique ID from LeetCode. If you solve the same problem again months later, it creates a fresh commit with a new contribution square. We track by submission ID, not by problem — so every accepted submission is a distinct event.",
  },
  {
    question: "How fast does it sync?",
    answer:
      "Typically within 60–90 seconds of your submission being accepted. LeetCode doesn't provide a real-time webhook, so our engine polls on a schedule. You can also hit the \"Sync Now\" button in your dashboard for an immediate sync.",
  },
  {
    question: "What does the commit look like?",
    answer:
      "A real Git commit from the LeetPush GitHub App, attributed to the app bot (so it's clear it was auto-synced). File path follows the pattern: questionId-problem-slug/problem-slug.py — you can customize the folder structure and commit message template in settings.",
  },
  {
    question: "Is this free?",
    answer:
      "Yes, completely free. The project is open-source. If usage grows enough that hosting costs become significant, we may add an optional paid tier for advanced features — but the core sync will always be free.",
  },
];

function FAQItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="border-b border-[var(--color-border-subtle)] last:border-0"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors pr-4">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[var(--color-text-muted)]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[var(--color-text-secondary)] leading-relaxed pr-10">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="faq" className="relative py-24 px-6" ref={ref}>
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-medium text-[var(--color-accent)] tracking-wide uppercase">
            FAQ
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] tracking-tight">
            Questions? Answered.
          </h2>
        </motion.div>

        <div className="glass-card p-2 sm:p-6">
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.question} answer={faq.answer} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
