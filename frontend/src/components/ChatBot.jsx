import { useEffect, useRef, useState } from "react";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const ChatBot = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm LISHA Academy Assistant. Ask me about courses, enrollments, assignments, quizzes, or live classes." },
  ]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!user) return null;

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const { data } = await api.post("/chatbot/chat", { message: text });
      setMessages((m) => [...m, { role: "bot", text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot">
      {open && (
        <div className="chatbot__panel">
          <header className="chatbot__head">
            <strong>LISHA Assistant</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close"><FiX /></button>
          </header>
          <div className="chatbot__messages">
            {messages.map((m, i) => (
              <div key={i} className={`chatbot__bubble chatbot__bubble--${m.role}`}>{m.text}</div>
            ))}
            {loading && <div className="chatbot__bubble chatbot__bubble--bot">Thinking...</div>}
            <div ref={endRef} />
          </div>
          <form className="chatbot__form" onSubmit={send}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything..." />
            <button type="submit" disabled={loading}><FiSend /></button>
          </form>
        </div>
      )}
      <button type="button" className="chatbot__fab" onClick={() => setOpen(!open)} aria-label="Open chatbot">
        <FiMessageCircle size={22} />
      </button>
    </div>
  );
};

export default ChatBot;
