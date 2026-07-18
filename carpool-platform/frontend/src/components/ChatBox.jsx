import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

export default function ChatBox({ messages, onSend, currentUserId }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted py-8">Say hello to coordinate your pickup 👋</p>
        )}
        {messages.map((m) => {
          const mine = String(m.sender?._id || m.sender) === String(currentUserId);
          return (
            <motion.div
              key={m._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${mine ? 'bg-route text-white rounded-br-sm' : 'bg-route-light text-ink rounded-bl-sm'}`}>
                {!mine && <p className="text-[10px] font-semibold text-route-dark mb-0.5">{m.sender?.name}</p>}
                {m.text}
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="flex items-center gap-2 p-3 border-t border-black/5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-black/5 text-sm"
        />
        <button type="submit" className="p-2.5 rounded-xl bg-route text-white hover:bg-route-dark transition-colors">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
