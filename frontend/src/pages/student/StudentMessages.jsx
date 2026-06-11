import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiMessageSquare, FiSend, FiPlus, FiInbox, FiAlertCircle, FiX } from "react-icons/fi";

const StudentMessages = () => {
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
      setShowNew(false);
      setNewSubject("");
      setNewMessage("");
      setSelectedTicket(data.ticket);
      fetchTickets();
    } catch (err) { setError(err.response?.data?.message || "Failed to create message."); }
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
    <DashboardLayout title="Messages" subtitle="Contact admin for queries and support">
      <style>{`
        .sm-box { display: grid; grid-template-columns: 320px 1fr; height: calc(100vh - 220px); min-height: 480px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 16px; overflow: hidden; margin-top: 16px; }
        .sm-sidebar { border-right: 1px solid var(--border-color); display: flex; flex-direction: column; background: var(--bg-surface); }
        .sm-sidebar-header { padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
        .sm-sidebar-header span { font-weight: 700; font-size: 15px; display: flex; align-items: center; gap: 8px; }
        .sm-new-btn { background: #10b981; color: white; border: none; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; }
        .sm-list { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 4px; }
        .sm-item { padding: 14px 16px; border-radius: 12px; cursor: pointer; transition: all 0.2s; text-align: left; border: 1px solid transparent; }
        .sm-item:hover { background: var(--bg-body); }
        .sm-item.active { background: #eafaf1; border-color: #d1fae5; }
        [data-theme="dark"] .sm-item.active { background: #064e3b; border-color: #047857; }
        .sm-item-subject { font-size: 14px; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        .sm-item-preview { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sm-item-time { font-size: 11px; color: var(--text-muted); margin-top: 4px; }
        .sm-main { display: flex; flex-direction: column; background: var(--bg-body); }
        .sm-chat-header { padding: 16px 24px; background: var(--bg-surface); border-bottom: 1px solid var(--border-color); }
        .sm-chat-header h3 { font-size: 15px; font-weight: 700; margin: 0 0 2px; }
        .sm-chat-header span { font-size: 12px; color: var(--text-secondary); }
        .sm-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 99px; text-transform: capitalize; }
        .sm-badge.open { background: #fee2e2; color: #991b1b; }
        .sm-badge.in_progress { background: #e0f2fe; color: #0369a1; }
        .sm-badge.resolved { background: #dcfce7; color: #15803d; }
        .sm-chat-area { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
        .sm-bubble-wrap { display: flex; flex-direction: column; max-width: 70%; }
        .sm-bubble-wrap.outgoing { align-self: flex-end; }
        .sm-bubble-wrap.incoming { align-self: flex-start; }
        .sm-sender { font-size: 11px; color: var(--text-secondary); margin-bottom: 4px; font-weight: 600; padding: 0 4px; }
        .sm-bubble { padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-break: break-word; }
        .sm-bubble-wrap.outgoing .sm-bubble { background: #10b981; color: #fff; border-bottom-right-radius: 4px; }
        .sm-bubble-wrap.incoming .sm-bubble { background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-color); border-bottom-left-radius: 4px; }
        .sm-bubble-time { font-size: 10px; color: var(--text-muted); margin-top: 4px; padding: 0 4px; }
        .sm-input-row { padding: 16px 24px; background: var(--bg-surface); border-top: 1px solid var(--border-color); }
        .sm-input-form { display: flex; gap: 12px; }
        .sm-input { flex: 1; padding: 12px 16px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; outline: none; }
        .sm-send-btn { background: #10b981; color: white; border: none; border-radius: 12px; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; }
        .sm-send-btn:hover { background: #059669; }
        .sm-empty-chat { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-secondary); text-align: center; padding: 32px; }
        .sm-empty-icon { font-size: 48px; color: var(--text-muted); margin-bottom: 16px; }
        .sm-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999; display: flex; align-items: center; justify-content: center; }
        .sm-modal { background: var(--bg-surface); border-radius: 16px; padding: 32px; width: 90%; max-width: 480px; }
        .sm-modal h2 { margin: 0 0 20px; font-size: 18px; }
        .sm-modal-field { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--bg-body); color: var(--text-primary); font-size: 14px; margin-bottom: 14px; font-family: inherit; }
        .sm-modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
        .sm-error { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 12px 16px; border-radius: 10px; margin-bottom: 16px; font-size: 13px; display: flex; align-items: center; gap: 8px; }
        @media (max-width: 768px) { .sm-box { grid-template-columns: 1fr; } .sm-sidebar { display: none; } }
      `}</style>

      {error && <div className="sm-error"><FiAlertCircle /> {error}</div>}

      {showNew && (
        <div className="sm-modal-overlay" onClick={() => setShowNew(false)}>
          <div className="sm-modal" onClick={e => e.stopPropagation()}>
            <h2>New Message to Admin</h2>
            <form onSubmit={handleCreateTicket}>
              <input className="sm-modal-field" placeholder="Subject" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
              <textarea className="sm-modal-field" style={{ height: 120, resize: "none" }} placeholder="Describe your query..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
              <div className="sm-modal-actions">
                <button type="button" className="btn btn--outline" onClick={() => setShowNew(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={creating}>{creating ? "Sending..." : "Send"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="sm-box">
        <div className="sm-sidebar">
          <div className="sm-sidebar-header">
            <span><FiInbox /> Inbox ({tickets.length})</span>
            <button className="sm-new-btn" onClick={() => setShowNew(true)} title="New Message"><FiPlus /></button>
          </div>
          <div className="sm-list">
            {loading ? <p style={{ padding: 20, textAlign: "center" }}>Loading...</p>
            : tickets.length === 0 ? <p style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)" }}>No messages yet</p>
            : tickets.map(t => {
              const lastReply = t.replies?.[t.replies.length - 1];
              return (
                <div key={t._id} className={`sm-item ${selectedTicket?._id === t._id ? "active" : ""}`} onClick={() => setSelectedTicket(t)}>
                  <div className="sm-item-subject">{t.subject}</div>
                  <div className="sm-item-preview">{lastReply ? lastReply.message : t.message}</div>
                  <div className="sm-item-time">{new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sm-main">
          {selectedTicket ? (
            <>
              <div className="sm-chat-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div><h3>{selectedTicket.subject}</h3><span>Status: <span className={`sm-badge ${selectedTicket.status}`}>{selectedTicket.status?.replace("_", " ")}</span></span></div>
              </div>
              <div className="sm-chat-area">
                {selectedTicket.replies?.map((r, idx) => (
                  <div key={idx} className={`sm-bubble-wrap ${r.senderName?.includes("Admin") || r.sender !== selectedTicket.user ? "incoming" : "outgoing"}`}>
                    <span className="sm-sender">{r.senderName}</span>
                    <div className="sm-bubble">{r.message}</div>
                    <span className="sm-bubble-time">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="sm-input-row">
                <form onSubmit={handleReply} className="sm-input-form">
                  <input className="sm-input" placeholder="Type your message..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                  <button type="submit" className="sm-send-btn" disabled={sending || !replyText.trim()}><FiSend /></button>
                </form>
              </div>
            </>
          ) : (
            <div className="sm-empty-chat">
              <div className="sm-empty-icon"><FiMessageSquare /></div>
              <h3>No Conversation Selected</h3>
              <p>Select a thread or start a new message to admin.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StudentMessages;
