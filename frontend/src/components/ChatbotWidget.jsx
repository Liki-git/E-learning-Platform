import { useState, useRef, useEffect } from "react";
import api from "../api/client";
import { FiMessageCircle, FiX, FiSend } from "react-icons/fi";

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! 👋 I'm LISHA Academy Assistant. Ask me about courses, enrollments, assignments, quizzes, or anything else!" }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setSending(true);
    try {
      const { data } = await api.post("/chatbot/chat", { message: userMsg });
      setMessages(prev => [...prev, { role: "bot", text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "bot", text: "Sorry, something went wrong. Please try again." }]);
    } finally { setSending(false); }
  };

  return (
    <>
      <style>{`
        .cb-fab { position: fixed; bottom: 28px; right: 28px; z-index: 10000; width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; box-shadow: 0 6px 24px rgba(16, 185, 129, 0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s; }
        .cb-fab:hover { transform: scale(1.1); box-shadow: 0 8px 32px rgba(16, 185, 129, 0.5); }
        .cb-fab.open { transform: rotate(90deg) scale(1.1); }
        .cb-window { position: fixed; bottom: 100px; right: 28px; z-index: 10000; width: 380px; max-width: calc(100vw - 40px); height: 520px; max-height: calc(100vh - 140px); background: var(--bg-surface, #ffffff); border: 1px solid var(--border-color, #e5e7eb); border-radius: 20px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15); display: flex; flex-direction: column; overflow: hidden; animation: cbSlideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes cbSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .cb-header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; }
        .cb-header-info h3 { margin: 0; font-size: 16px; font-weight: 700; }
        .cb-header-info p { margin: 2px 0 0; font-size: 12px; opacity: 0.85; }
        .cb-close { background: rgba(255,255,255,0.2); border: none; color: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: background 0.2s; }
        .cb-close:hover { background: rgba(255,255,255,0.3); }
        .cb-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .cb-msg { max-width: 85%; padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-break: break-word; white-space: pre-line; }
        .cb-msg.bot { align-self: flex-start; background: var(--bg-body, #f3f4f6); color: var(--text-primary); border-bottom-left-radius: 4px; }
        .cb-msg.user { align-self: flex-end; background: #10b981; color: white; border-bottom-right-radius: 4px; }
        .cb-typing { align-self: flex-start; padding: 12px 16px; background: var(--bg-body); border-radius: 16px; border-bottom-left-radius: 4px; display: flex; gap: 4px; }
        .cb-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--text-muted); animation: cbBounce 1.4s infinite ease-in-out; }
        .cb-dot:nth-child(2) { animation-delay: 0.16s; }
        .cb-dot:nth-child(3) { animation-delay: 0.32s; }
        @keyframes cbBounce { 0%, 80%, 100% { transform: scale(0.6); } 40% { transform: scale(1); } }
        .cb-input-row { padding: 14px 16px; border-top: 1px solid var(--border-color, #e5e7eb); background: var(--bg-surface); }
        .cb-input-form { display: flex; gap: 10px; }
        .cb-input { flex: 1; padding: 10px 14px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; outline: none; }
        .cb-input:focus { border-color: #10b981; }
        .cb-send { background: #10b981; color: white; border: none; border-radius: 12px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; transition: background 0.2s; }
        .cb-send:hover { background: #059669; }
        .cb-send:disabled { opacity: 0.5; cursor: not-allowed; }
        .cb-suggestions { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px; }
        .cb-suggestion { background: var(--bg-body); border: 1px solid var(--border-color); border-radius: 99px; padding: 6px 14px; font-size: 12px; color: var(--text-secondary); cursor: pointer; transition: all 0.2s; }
        .cb-suggestion:hover { border-color: #10b981; color: #10b981; }
      `}</style>

      {/* Chat Window */}
      {open && (
        <div className="cb-window">
          <div className="cb-header">
            <div className="cb-header-info">
              <h3>🤖 LISHA Assistant</h3>
              <p>Ask me anything about the platform</p>
            </div>
            <button className="cb-close" onClick={() => setOpen(false)}><FiX /></button>
          </div>

          <div className="cb-messages">
            {messages.map((m, i) => (
              <div key={i} className={`cb-msg ${m.role}`}>{m.text}</div>
            ))}
            {sending && (
              <div className="cb-typing">
                <div className="cb-dot" /><div className="cb-dot" /><div className="cb-dot" />
              </div>
            )}
            <div ref={endRef} />
          </div>

          {messages.length <= 1 && (
            <div className="cb-suggestions">
              {["How do I enroll?", "Show my courses", "Help with assignments", "About quizzes", "Live class info"].map(s => (
                <button key={s} className="cb-suggestion" onClick={() => { setInput(s); }}>{s}</button>
              ))}
            </div>
          )}

          <div className="cb-input-row">
            <form onSubmit={handleSend} className="cb-input-form">
              <input className="cb-input" placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} />
              <button type="submit" className="cb-send" disabled={sending || !input.trim()}><FiSend /></button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button className={`cb-fab ${open ? "open" : ""}`} onClick={() => setOpen(!open)} title="Chat with LISHA Assistant">
        {open ? <FiX /> : <FiMessageCircle />}
      </button>
    </>
  );
};

export default ChatbotWidget;
