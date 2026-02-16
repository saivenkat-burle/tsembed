import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { LiveboardEmbed } from "@thoughtspot/visual-embed-sdk/react";
import { HostEvent } from "@thoughtspot/visual-embed-sdk";
import "./App.css";

const normalizeTagStrings = (tags = []) =>
  Array.from(
    new Set(
      tags
        .map((tag) => tag?.tag_name || tag?.name || tag?.metadata_name || tag)
        .filter(Boolean)
        .map((tag) => `${tag}`)
    )
  );

function LiveboardPicker() {
  const [liveboards, setLiveboards] = useState([]);
  const [filters, setFilters] = useState({
    tag: "",
    favoritesOnly: false,
  });
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const liveboardRef = useRef(null);

  const loadLiveboards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/liveboards", {
        params: {
          tag: filters.tag || undefined,
          favorites: filters.favoritesOnly ? "true" : undefined,
        },
      });

      const items = data || [];
      setLiveboards(items);
      setSelectedId((prev) => {
        if (prev && items.some((lb) => lb.id === prev)) {
          return prev;
        }
        return items[0]?.id || "";
      });
    } catch (err) {
      console.error("Failed to fetch liveboards", err);
      setError("Could not fetch liveboards. Check the server logs.");
      setLiveboards([]);
      setSelectedId("");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLiveboards();
  }, [loadLiveboards]);

  const tagOptions = useMemo(() => {
    const set = new Set();
    liveboards.forEach((lb) =>
      normalizeTagStrings(lb.tags).forEach((t) => set.add(t))
    );
    return Array.from(set);
  }, [liveboards]);

  const selectedLiveboard = useMemo(
    () => liveboards.find((lb) => lb.id === selectedId) || null,
    [liveboards, selectedId]
  );

  const handleHostReload = () => {
    if (!liveboardRef.current) {
      alert("Embed is not ready yet. Please wait for it to load.");
      return;
    }
    liveboardRef.current.trigger(HostEvent.Reload);
  };

  return (
    <div className="liveboard-page">
      <header className="liveboard-header">
        <div>
          <h1>Liveboard Explorer</h1>
          <p>
            Search, filter by tags or favorites, pick a liveboard, and interact
            with it via host events.
          </p>
        </div>
        <div className="liveboard-header-actions">
          <button
            className="ts-button"
            onClick={handleHostReload}
            disabled={!selectedLiveboard}
          >
            Trigger Host Reload
          </button>
          <button className="ts-button ghost" onClick={loadLiveboards}>
            Refresh List
          </button>
        </div>
      </header>

      <section className="liveboard-controls">
        <div className="control-group">
          <label htmlFor="lb-tag">Tag</label>
          <select
            id="lb-tag"
            value={filters.tag}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, tag: e.target.value }))
            }
          >
            <option value="">All tags</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group favorites-toggle">
          <label>
            <input
              type="checkbox"
              checked={filters.favoritesOnly}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  favoritesOnly: e.target.checked,
                }))
              }
            />
            Favorites only
          </label>
        </div>

        <div className="control-group wide">
          <label htmlFor="lb-select">
            Liveboard{loading ? " (loading...)" : ""}
          </label>
          <select
            id="lb-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={loading || !liveboards.length}
          >
            {!liveboards.length && (
              <option value="">No liveboards available</option>
            )}
            {liveboards.map((lb) => (
              <option key={lb.id} value={lb.id}>
                {lb.name}
                {lb.isFavorite ? " ★" : ""}
              </option>
            ))}
          </select>
        </div>
      </section>

      {selectedLiveboard && (
        <div className="liveboard-meta">
          <div>
            <strong>{selectedLiveboard.name}</strong>
            {selectedLiveboard.isFavorite && (
              <span className="pill pill-gold">Favorite</span>
            )}
          </div>
          <div className="meta-line">
            {selectedLiveboard.description || "No description provided."}
          </div>
          {!!normalizeTagStrings(selectedLiveboard.tags).length && (
            <div className="meta-line">
              Tags:
              {normalizeTagStrings(selectedLiveboard.tags).map((tag) => (
                <span key={tag} className="pill">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <div className="liveboard-error">{error}</div>}

      <div className="liveboard-embed-shell">
        {selectedLiveboard ? (
          <LiveboardEmbed
            ref={liveboardRef}
            frameParams={{ height: "100%", width: "100%" }}
            liveboardId={selectedLiveboard.id}
            className="liveboard-embed"
          />
        ) : (
          <div className="liveboard-placeholder">
            {loading
              ? "Loading liveboards..."
              : "Choose a liveboard to render it here."}
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveboardPicker;
