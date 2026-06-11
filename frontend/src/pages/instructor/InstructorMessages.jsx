import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiMessageSquare, FiSend, FiPlus, FiInbox, FiAlertCircle } from "react-icons/fi";

const InstructorMessages = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchTickets = async () => {
    try {
      const { data } = await api.get("/support/my");
      setTickets(data.tickets || []);
      if (selectedTicket) {
        const updated = (data.tickets || []).find(t => t._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      }
    } catch { setError("Failed to load messages."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTickets(); const i = setInterval(fetchTickets, 8000); return () => clearInterval(i); }, [selectedTicket?._id]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedTicket?.replies]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMessage.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post("/support", { subject: newSubject, message: newMessage });
      setShowNew(false); setNewSubject(""); setNewMessage("");
      setSelectedTicket(data.ticket);
      fetchTickets();
    } catch (err) { setError(err.response?.data?.message || "Failed."); }
    finally { setCreating(false); }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const { data } = await api.post(`/support/${selectedTicket._id}/reply`, { message: replyText.trim() });
      setReplyText("");
      setSelectedTicket(data.ticket);
      setTickets(tickets.map(t => t._id === data.ticket._id ? data.ticket : t));
    } catch { setError("Failed to send."); }
    finally { setSending(false); }
  };

  return (
    <DashboardLayout title="Messages" subtitle="Contact admin for support and queries">
      <style>{`
        .im-box { display: grid; grid-template-columns: 320px 1fr; height: calc(100vh - 220px); min-height: 480px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; margin-top: 16px; }
        .im-sidebar { border-right: 1px solid var(--border-color); display: flex; flex-direction: column; }
        .im-sidebar-header { padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
        .im-sidebar-header span { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 8px; }
        .im-new-btn { background: #10b981; color: white; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; }
        .im-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
        .im-item { padding: 14px 16px; border-radius: 12px; cursor: pointer; transition: all 0.2s; text-align: left; border: 1px solid transparent; }
        .im-item:hover { background: var(--bg-body); }
        .im-item.active { background: #eafaf1; border-color: #d1fae5; }
        [data-theme="dark"] .im-item.active { background: #064e3b; border-color: #047857; }
        .im-item-subject { font-size: 14px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        .im-item-preview { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .im-item-time { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
        .im-main { display: flex; flex-direction: column; background: var(--bg-body); }
        .im-chat-header { padding: 16px 24px; background: var(--bg-surface); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
        .im-chat-header h3 { font-size: 15px; font-weight: 700; margin: 0 0 2px; }
        .im-chat-header span { font-size: 12px; color: var(--text-secondary); }
        .im-chat-area { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .im-bubble-wrap { display: flex; flex-direction: column; max-width: 70%; }
        .im-bubble-wrap.outgoing { align-self: flex-end; }
        .im-bubble-wrap.incoming { align-self: flex-start; }
        .im-sender { font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600; padding: 0 4px; }
        .im-bubble { padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-break: break-word; }
        .im-bubble-wrap.outgoing .im-bubble { background: #10b981; color: #fff; border-bottom-right-radius: 4px; }
        .im-bubble-wrap.incoming .im-bubble { background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-color); border-bottom-left-radius: 4px; }
        .im-bubble-time { font-size: 10px; color: var(--text-muted); margin-top: 4px; padding: 0 4px; }
        .im-input-row { padding: 16px 24px; background: var(--bg-surface); border-top: 1px solid var(--border-color); }
        .im-input-form { display: flex; gap: 12px; }
        .im-input { flex: 1; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; }
        .im-send-btn { background: #10b981; color: white; border: none; border-radius: 12px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; }
        .im-send-btn:hover { background: #059669; }
        .im-empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); text-align: center; padding: 32px; }
        .im-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .im-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999; display: flex; align-items: center; justify-content: center; }
        .im-modal { background: var(--bg-surface); border-radius: 16px; padding: 32px; width: 90%; max-width: 480px; }
        .im-modal h2 { margin: 0 0 20px; font-size: 18px; }
        .im-modal-field { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; margin-bottom: 14px; font-family: inherit; }
        .im-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
      `}</style>

      {error && <div className="im-error"><FiAlertCircle /> {error}</div>}

      {showNew && (
        <div className="im-modal-overlay" onClick={() => setShowNew(false)}>
          <div className="im-modal" onClick={e => e.stopPropagation()}>
            <h2>New Message to Admin</h2>
            <form onSubmit={handleCreateTicket}>
              <input className="im-modal-field" placeholder="Subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
              <textarea className="im-modal-field" style={{ height: 120, resize: "none" }} placeholder="Describe your query..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button type="button" className="btn btn--outline" onClick={() => setShowNew(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={creating}>{creating ? "Sending..." : "Send"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="im-box">
        <div className="im-sidebar">
          <div className="im-sidebar-header">
            <span><FiInbox /> Inbox ({tickets.length})</span>
            <button className="im-new-btn" onClick={() => setShowNew(true)} title="New Message"><FiPlus /></button>
          </div>
          <div className="im-list">
            {loading ? <p style={{ padding: 20, textAlign: "center" }}>Loading...</p>
            : tickets.length === 0 ? <p style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)" }}>No messages yet</p>
            : tickets.map(t => {
              const lastReply = t.replies?.[t.replies.length - 1];
              return (
                <div key={t._id} className={`im-item ${selectedTicket?._id === t._id ? "active" : ""}`} onClick={() => setSelectedTicket(t)}>
                  <div className="im-item-subject">{t.subject}</div>
                  <div className="im-item-preview">{lastReply ? lastReply.message : t.message}</div>
                  <div className="im-item-time">{new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="im-main">
          {selectedTicket ? (
            <>
              <div className="im-chat-header"><div><h3>{selectedTicket.subject}</h3><span>{selectedTicket.status?.replace("_", " ")}</span></div></div>
              <div className="im-chat-area">
                {selectedTicket.replies?.map((r, idx) => (
                  <div key={idx} className={`im-bubble-wrap ${r.senderName?.includes("Admin") || r.sender !== selectedTicket.user ? "incoming" : "outgoing"}`}>
                    <span className="im-sender">{r.senderName}</span>
                    <div className="im-bubble">{r.message}</div>
                    <span className="im-bubble-time">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="im-input-row">
                <form onSubmit={handleReply} className="im-input-form">
                  <input className="im-input" placeholder="Type your message..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                  <button type="submit" className="im-send-btn" disabled={sending || !replyText.trim()}><FiSend /></button>
                </form>
              </div>
            </>
          ) : (
            <div className="im-empty-chat"><div className="im-empty-icon"><FiMessageSquare /></div><h3>No Conversation Selected</h3><p>Select a thread or start a new message.</p></div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InstructorMessages;
