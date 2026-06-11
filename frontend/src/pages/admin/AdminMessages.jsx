import { useEffect, useState, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/client";
import { FiMessageSquare, FiSend, FiInbox, FiClock, FiAlertCircle } from "react-icons/fi";

const AdminMessages = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const fetchTickets = async () => {
    try {
      const { data } = await api.get("/support");
      setTickets(data.tickets || []);
      // If a ticket is already selected, update it too
      if (selectedTicket) {
        const updated = data.tickets.find((t) => t._id === selectedTicket._id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      setError("Failed to fetch support messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 8000); // auto refresh every 8s
    return () => clearInterval(interval);
  }, [selectedTicket?._id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTicket?.replies]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const { data } = await api.post(`/support/${selectedTicket._id}/reply`, {
        message: replyText.trim(),
      });
      setReplyText("");
      setSelectedTicket(data.ticket);
      // Update tickets list
      setTickets(tickets.map((t) => (t._id === data.ticket._id ? data.ticket : t)));
    } catch (err) {
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout title="Support Messages" subtitle="Respond to queries and tickets opened by students or instructors">
      <div className="msg-container">
        <style>{`
          .msg-box {
            display: grid;
            grid-template-columns: 320px 1fr;
            height: calc(100vh - 200px);
            min-height: 500px;
            background: var(--bg-surface, #ffffff);
            border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
            margin-top: 16px;
          }
          .msg-sidebar {
            border-right: 1px solid var(--border-color, #e5e7eb);
            display: flex;
            flex-direction: column;
            background: var(--bg-surface, #ffffff);
          }
          .msg-sidebar-header {
            padding: 18px 20px;
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            font-weight: 700;
            font-size: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: var(--text-primary);
          }
          .msg-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .msg-item {
            padding: 14px 16px;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: left;
            border: 1px solid transparent;
          }
          .msg-item:hover {
            background: var(--bg-body, #f9fafb);
          }
          .msg-item.active {
            background: #eafaf1;
            border-color: #d1fae5;
          }
          [data-theme="dark"] .msg-item.active {
            background: #064e3b;
            border-color: #047857;
          }
          .msg-item-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 4px;
          }
          .msg-item-name {
            font-weight: 700;
            font-size: 14px;
            color: var(--text-primary);
          }
          .msg-item-time {
            font-size: 11px;
            color: var(--text-secondary);
          }
          .msg-item-subject {
            font-size: 13px;
            font-weight: 600;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 2px;
          }
          .msg-item-preview {
            font-size: 12px;
            color: var(--text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .msg-main {
            display: flex;
            flex-direction: column;
            background: var(--bg-body, #f9fafb);
          }
          .msg-chat-header {
            padding: 16px 24px;
            background: var(--bg-surface, #ffffff);
            border-bottom: 1px solid var(--border-color, #e5e7eb);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .msg-chat-header-title h3 {
            font-size: 15px;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0 0 2px 0;
          }
          .msg-chat-header-title span {
            font-size: 12px;
            color: var(--text-secondary);
          }
          .msg-badge {
            font-size: 11px;
            font-weight: 700;
            padding: 4px 10px;
            border-radius: 9999px;
            text-transform: capitalize;
          }
          .msg-badge.open { background: #fee2e2; color: #991b1b; }
          .msg-badge.in_progress { background: #e0f2fe; color: #0369a1; }
          .msg-badge.resolved { background: #dcfce7; color: #15803d; }

          .msg-chat-area {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .msg-bubble-wrap {
            display: flex;
            flex-direction: column;
            max-width: 70%;
          }
          .msg-bubble-wrap.incoming {
            align-self: flex-start;
          }
          .msg-bubble-wrap.outgoing {
            align-self: flex-end;
          }
          .msg-sender-name {
            font-size: 11px;
            color: var(--text-secondary);
            margin-bottom: 4px;
            font-weight: 600;
            padding: 0 4px;
          }
          .msg-bubble {
            padding: 12px 16px;
            border-radius: 16px;
            font-size: 14px;
            line-height: 1.5;
            word-break: break-word;
          }
          .msg-bubble-wrap.incoming .msg-bubble {
            background: var(--bg-surface, #ffffff);
            color: var(--text-primary);
            border-bottom-left-radius: 4px;
            border: 1px solid var(--border-color, #e5e7eb);
          }
          .msg-bubble-wrap.outgoing .msg-bubble {
            background: #10b981;
            color: #ffffff;
            border-bottom-right-radius: 4px;
          }
          .msg-bubble-time {
            font-size: 10px;
            color: var(--text-muted);
            margin-top: 4px;
            align-self: flex-end;
            padding: 0 4px;
          }
          .msg-chat-input-row {
            padding: 16px 24px;
            background: var(--bg-surface, #ffffff);
            border-top: 1px solid var(--border-color, #e5e7eb);
          }
          .msg-input-form {
            display: flex;
            gap: 12px;
          }
          .msg-input-field {
            flex: 1;
            padding: 12px 16px;
            border-radius: 12px;
            border: 1px solid var(--border-color, #e5e7eb);
            background: var(--bg-body, #f9fafb);
            color: var(--text-primary);
            font-size: 14px;
            outline: none;
          }
          .msg-send-btn {
            background: #10b981;
            color: white;
            border: none;
            border-radius: 12px;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
            transition: background 0.2s ease;
          }
          .msg-send-btn:hover {
            background: #059669;
          }
          .msg-empty-chat {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--text-secondary);
            text-align: center;
            padding: 32px;
          }
          .msg-empty-icon {
            font-size: 48px;
            color: var(--text-muted);
            margin-bottom: 16px;
          }
        `}</style>

        {error && (
          <div className="ann-error" style={{ marginBottom: "16px" }}>
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        <div className="msg-box">
          {/* Inbox Sidebar List */}
          <div className="msg-sidebar">
            <div className="msg-sidebar-header">
              <FiInbox />
              <span>Inbox ({tickets.length})</span>
            </div>
            <div className="msg-list">
              {loading ? (
                <p style={{ padding: "20px", textAlign: "center" }}>Loading chats...</p>
              ) : tickets.length === 0 ? (
                <p style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)" }}>No threads open</p>
              ) : (
                tickets.map((t) => {
                  const lastReply = t.replies?.[t.replies.length - 1];
                  const active = selectedTicket?._id === t._id;
                  return (
                    <article
                      key={t._id}
                      className={`msg-item ${active ? "active" : ""}`}
                      onClick={() => setSelectedTicket(t)}
                    >
                      <div className="msg-item-top">
                        <span className="msg-item-name">{t.user?.fullName || "Anonymous User"}</span>
                        <span className="msg-item-time">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="msg-item-subject">{t.subject}</div>
                      <div className="msg-item-preview">
                        {lastReply ? `${lastReply.senderName}: ${lastReply.message}` : t.message}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat Window Panel */}
          <div className="msg-main">
            {selectedTicket ? (
              <>
                <div className="msg-chat-header">
                  <div className="msg-chat-header-title">
                    <h3>{selectedTicket.subject}</h3>
                    <span>By {selectedTicket.user?.fullName || "User"} ({selectedTicket.user?.email})</span>
                  </div>
                  <span className={`msg-badge ${selectedTicket.status}`}>
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                </div>

                <div className="msg-chat-area">
                  {selectedTicket.replies?.map((r, idx) => {
                    const isOutgoing = r.sender === selectedTicket.user?._id ? false : true;
                    return (
                      <div 
                        key={idx} 
                        className={`msg-bubble-wrap ${isOutgoing ? "outgoing" : "incoming"}`}
                      >
                        <span className="msg-sender-name">{r.senderName}</span>
                        <div className="msg-bubble">
                          {r.message}
                        </div>
                        <span className="msg-bubble-time">
                          {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="msg-chat-input-row">
                  <form onSubmit={handleSendReply} className="msg-input-form">
                    <input
                      type="text"
                      className="msg-input-field"
                      placeholder="Type your reply here..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="msg-send-btn"
                      disabled={sending || !replyText.trim()}
                      title="Send Message"
                    >
                      <FiSend />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="msg-empty-chat">
                <div className="msg-empty-icon">
                  <FiMessageSquare />
                </div>
                <h3>No Conversation Selected</h3>
                <p>Choose a ticket thread from the left menu to view the query history and send a reply.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminMessages;
