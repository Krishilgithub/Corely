import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react";

interface HistoryEntry {
  id: string;
  type: string;
  status: "success" | "error" | "running";
  description: string;
  timestamp: string;
  itemsIndexed: number | null;
}

interface RecentDocument {
  id: string;
  title: string;
  indexedAt: string | null;
}

interface SyncHistoryData {
  source: {
    id: string;
    name: string;
    type: string;
    status: string;
    itemsIndexed: number;
    lastSyncedAt: string | null;
  };
  history: HistoryEntry[];
  recentDocuments: RecentDocument[];
}

export default function SyncHistoryModal({
  sourceId,
  onClose,
}: {
  sourceId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<SyncHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/sources/${sourceId}/history`);
        if (!res.ok) throw new Error("Failed to load sync history");
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, [sourceId]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "32px",
            width: "100%",
            maxWidth: 600,
            maxHeight: "85vh",
            overflowY: "auto",
            boxShadow: "0 24px 64px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111", letterSpacing: "-0.02em" }}>Sync History</h2>
              {data && (
                <p style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>
                  Activity log for {data.source.name}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "#f4f4f5",
                borderRadius: 8,
                padding: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <X size={16} color="#52525b" />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "#ff6b00", margin: "0 auto 16px" }} />
              <div style={{ color: "#71717a", fontSize: 13, fontWeight: 500 }}>Loading history...</div>
            </div>
          ) : error ? (
            <div style={{ padding: 24, background: "#fee2e2", borderRadius: 12, color: "#dc2626", fontSize: 13, fontWeight: 500 }}>
              {error}
            </div>
          ) : data ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {/* Event Timeline */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>Recent Events</h3>
                {data.history.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#71717a", fontStyle: "italic" }}>No sync events recorded yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {data.history.map((event, idx) => (
                      <div key={event.id || idx} style={{ display: "flex", gap: 12 }}>
                        <div style={{ marginTop: 2 }}>
                          {event.status === "success" ? (
                            <CheckCircle2 size={16} color="#16a34a" />
                          ) : event.status === "error" ? (
                            <AlertCircle size={16} color="#dc2626" />
                          ) : (
                            <Loader2 size={16} className="animate-spin" color="#2563eb" />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111" }}>
                            {event.description}
                          </div>
                          <div style={{ fontSize: 12, color: "#71717a", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                            <Clock size={12} />
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Documents */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111", marginBottom: 16 }}>Recently Indexed Documents</h3>
                {data.recentDocuments.length === 0 ? (
                  <div style={{ fontSize: 13, color: "#71717a", fontStyle: "italic" }}>No documents indexed yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.recentDocuments.map((doc) => (
                      <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#f4f4f5", borderRadius: 8 }}>
                        <FileText size={14} color="#71717a" />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#3f3f46", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {doc.title}
                          </div>
                          {doc.indexedAt && (
                            <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 2 }}>
                              {new Date(doc.indexedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
