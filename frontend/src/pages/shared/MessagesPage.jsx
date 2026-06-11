import { useEffect, useRef, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiSend } from "react-icons/fi";

const MessagesPage = ({ title = "Messages", subtitle = "Support tickets and replies" }) => {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [showNew, setShowNew] = useState(false);
  const endRef = useRef(null);

  const load = () => {
    api.get("/support/my").then(({ data }) => {
      setTickets(data.tickets || []);
      if (selected) {
        const fresh = data.tickets.find((t) => t._id === selected._id);
        if (fresh) setSelected(fresh);
      }
    });
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.replies]);

  const createTicket = async (e) => {
    e.preventDefault();
    await api.post("/support", { subject, message });
    setSubject("");
    setMessage("");
    setShowNew(false);
    load();
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selected) return;
    const { data } = await api.post(`/support/${selected._id}/reply`, { message: reply.trim() });
    setReply("");
    setSelected(data.ticket);
    load();
  };

  return (
    <DashboardLayout title={title} subtitle={subtitle}>
      <div className="feature-msg-layout">
        <aside className="feature-msg-list">
          <button type="button" className="btn btn--primary btn--sm btn--full" onClick={() => setShowNew(!showNew)}>
            {showNew ? "Cancel" : "New message"}
          </button>
          {showNew && (
            <form className="feature-form" onSubmit={createTicket}>
              <input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              <textarea rows={3} placeholder="Your message" value={message} onChange={(e) => setMessage(e.target.value)} required />
              <button type="submit" className="btn btn--primary btn--sm">Send</button>
            </form>
          )}
          {tickets.map((t) => (
            <button
              key={t._id}
              type="button"
              className={`feature-msg-item${selected?._id === t._id ? " active" : ""}`}
              onClick={() => setSelected(t)}
            >
              <strong>{t.subject}</strong>
              <span>{t.status} · {new Date(t.createdAt).toLocaleDateString()}</span>
            </button>
          ))}
          {tickets.length === 0 && !showNew && <p className="dash-empty">No messages yet.</p>}
        </aside>
        <section className="feature-msg-thread">
          {!selected ? (
            <p className="dash-empty">Select a conversation or start a new message.</p>
          ) : (
            <>
              <h3>{selected.subject}</h3>
              <div className="feature-msg-replies">
                {(selected.replies || []).map((r, i) => (
                  <div key={i} className="feature-msg-reply">
                    <strong>{r.senderName}</strong>
                    <p>{r.message}</p>
                    <time>{new Date(r.createdAt).toLocaleString()}</time>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form className="feature-msg-compose" onSubmit={sendReply}>
                <input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a reply..." />
                <button type="submit" className="btn btn--primary btn--sm"><FiSend /></button>
              </form>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

export default MessagesPage;
