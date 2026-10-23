import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle, Clock, FileText } from "lucide-react";
import { SourceLogo } from "@/components/ui/source-logo";

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
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="src-modal-overlay"
        style={{ zIndex: 1000 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="ui-popover src-modal"
          style={{ width: "min(600px, calc(100vw - 32px))" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="src-history-title"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="src-modal__header">
            <div className="src-modal__heading">
              {data && <SourceLogo type={data.source.type} size={22} tileSize={40} />}
              <div className="src-modal__titles">
                <h2 id="src-history-title" className="type-heading">Sync history</h2>
                {data && (
                  <p className="type-caption">
                    Activity log for {data.source.name}
                  </p>
                )}
              </div>
            </div>
            <button type="button" className="ui-icon-btn ui-icon-btn--sm" onClick={onClose} aria-label="Close" title="Close">
              <X size={16} />
            </button>
          </div>

          <div className="src-modal__body">
            {loading ? (
              <div className="src-modal-loading">
                <Loader2 size={24} className="animate-spin src-spinner" />
                <div className="type-caption">Loading history...</div>
              </div>
            ) : error ? (
              <div className="src-error-box">
                {error}
              </div>
            ) : data ? (
              <>
                {/* Event Timeline */}
                <div className="src-history-section">
                  <h3 className="type-label">Recent events</h3>
                  {data.history.length === 0 ? (
                    <div className="type-caption">No sync events recorded yet.</div>
                  ) : (
                    <div className="src-history-list">
                      {data.history.map((event, idx) => (
                        <div key={event.id || idx} className="src-history-item">
                          <div className="src-history-item__icon">
                            {event.status === "success" ? (
                              <CheckCircle2 size={16} className="src-icon-success" />
                            ) : event.status === "error" ? (
                              <AlertCircle size={16} className="src-icon-error" />
                            ) : (
                              <Loader2 size={16} className="animate-spin src-spinner" />
                            )}
                          </div>
                          <div className="src-history-item__text">
                            <div className="type-body" style={{ fontWeight: 500 }}>
                              {event.description}
                            </div>
                            <div className="type-caption src-history-item__time">
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
                <div className="src-history-section">
                  <h3 className="type-label">Recently indexed documents</h3>
                  {data.recentDocuments.length === 0 ? (
                    <div className="type-caption">No documents indexed yet.</div>
                  ) : (
                    <div className="src-history-list">
                      {data.recentDocuments.map((doc) => (
                        <div key={doc.id} className="src-history-item" style={{ alignItems: "center" }}>
                          <span className="src-glyph-tile src-glyph-tile--sm">
                            <FileText size={16} />
                          </span>
                          <div className="src-history-item__text">
                            <div className="type-body src-truncate">
                              {doc.title}
                            </div>
                            {doc.indexedAt && (
                              <div className="type-caption">
                                {new Date(doc.indexedAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
