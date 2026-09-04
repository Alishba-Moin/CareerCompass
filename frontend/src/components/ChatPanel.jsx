import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Loader2, User, Workflow, Sparkles } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext.jsx';

const SUGGESTED = ['AI/ML Engineer', 'Full Stack Web Developer', 'Data Analyst'];

export default function ChatPanel({ messages, finalReply, typing, running, onSend }) {
  const { t } = useLang();
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const submit = () => {
    const q = input.trim();
    if (!q || running) return;
    setInput('');
    onSend(q);
  };

  return (
    <motion.div
      id="coach"
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
      }}
      className="bg-parchment rounded-3xl border border-line shadow-card overflow-hidden"
    >
      {/* Header */}
      <div className="border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-brown flex items-center justify-center">
            <Bot size={17} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-brownDark text-sm">{t('coach.title')}</h3>
            <p className="text-[11px] text-mocha">
              {t('coach.subtitle')} · <span className="text-success font-semibold">{t('coach.online')}</span>
            </p>
          </div>
        </div>
        <span className="hidden sm:flex items-center gap-1.5 text-[10px] text-mocha bg-sand border border-line px-2.5 py-1 rounded-lg font-medium">
          <Workflow size={12} className="text-gold-dark" /> {t('coach.multiAgent')}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-80 overflow-y-auto p-6 space-y-4 bg-cream/50">
        {/* Static intro bubble — always rendered in the active language */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
            <Bot size={15} className="text-gold-dark" />
          </div>
          <div className="bg-parchment border border-line rounded-2xl rounded-tl-md px-4 py-3 max-w-xl text-sm text-brownDark leading-relaxed shadow-sm">
            {t('coach.intro')}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}
            >
              {m.role === 'coach' && (
                <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
                  <Bot size={15} className="text-gold-dark" />
                </div>
              )}
              <div
                className={`px-4 py-3 max-w-xl text-sm leading-relaxed shadow-sm ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-gold to-brown text-white rounded-2xl rounded-tr-md'
                    : m.error
                      ? 'bg-clay/10 border border-clay/25 text-clay rounded-2xl rounded-tl-md'
                      : 'bg-parchment border border-line text-brownDark rounded-2xl rounded-tl-md'
                }`}
              >
                {m.text}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-brown/15 border border-brown/20 flex items-center justify-center shrink-0">
                  <User size={15} className="text-brown" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Final coach reply — derived from the latest analysis, re-composed on language change */}
        <AnimatePresence>
          {finalReply && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
                <Bot size={15} className="text-gold-dark" />
              </div>
              <div className="bg-parchment border border-line rounded-2xl rounded-tl-md px-4 py-3 max-w-xl text-sm text-brownDark leading-relaxed shadow-sm">
                {finalReply}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Typing indicator */}
        {typing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/25 flex items-center justify-center shrink-0">
              <Bot size={15} className="text-gold-dark" />
            </div>
            <div className="bg-parchment border border-line rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2">
              <span className="text-xs text-mocha">{t('coach.thinking')}</span>
              <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gold"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggested queries */}
      <div className="px-6 pb-2 flex flex-wrap gap-2 items-center">
        <span className="flex items-center gap-1 text-[11px] text-mocha font-medium">
          <Sparkles size={11} className="text-gold-dark" /> {t('coach.suggested')}:
        </span>
        {SUGGESTED.map(q => (
          <button
            key={q}
            disabled={running}
            onClick={() => onSend(q)}
            className="text-xs bg-sand border border-line text-brown px-3 py-1.5 rounded-full hover:border-gold/40 hover:text-gold-dark transition-colors disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-line">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder={t('coach.placeholder')}
            disabled={running}
            className="flex-1 bg-cream border border-line rounded-xl px-4 py-2.5 text-sm text-brownDark placeholder-mocha/70 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/15 transition disabled:opacity-60"
          />
          <button
            onClick={submit}
            disabled={running || !input.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-gold to-brown hover:opacity-90 text-white text-sm font-semibold rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {running ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {t('coach.analyze')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
