import React, {
  useRef,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import axios from "axios";
import { LiveboardEmbed } from "@thoughtspot/visual-embed-sdk/react";
import {
  HostEvent,
  CustomActionTarget,
  EmbedEvent,
} from "@thoughtspot/visual-embed-sdk";
import "./App.css";
import CreateDashboardModal from "./CreateDashboardModal";

const DEFAULT_LIVEBOARD_ID = "75131430-adb4-4231-bfdd-501047d83697";

function LiveboardHostPage() {
  const liveboardRef = useRef(null);

  const [liveboards, setLiveboards] = useState([]);
  const [currentLiveboardId, setCurrentLiveboardId] =
    useState(DEFAULT_LIVEBOARD_ID);

  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (liveboardRef.current) {
      liveboardRef.current.on(EmbedEvent.Error, (error) => {
        console.error("Embed error:", error);
      });
      liveboardRef.current.on(EmbedEvent.AIHighlights, (payload) => {
        console.log("AI Highlights event received", payload);
      });
    }
  }, []);
  const fetchLiveboards = async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await axios.get("http://localhost:3001/api/liveboards");
      setLiveboards(res.data || []);
    } catch (err) {
      console.error("Failed to fetch liveboards:", err);
      setListError("Could not fetch liveboards from server.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchLiveboards();
  }, []);

  const handleCreateDashboard = async (name, description) => {
    setIsProcessing(true);
    try {
      const res = await axios.post(
        "http://localhost:3001/api/create-liveboard",
        {
          name,
          description,
        }
      );

      await fetchLiveboards();

      if (res.data?.id) {
        setCurrentLiveboardId(res.data.id);
        setSearchTerm("");
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Creation failed:", err);
      alert("Failed to create dashboard.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleFavorite = async () => {
    if (!currentLiveboardId) return;
    setIsProcessing(true);
    const currentLb = liveboards.find((lb) => lb.id === currentLiveboardId);
    const action = currentLb?.isFavorite ? "unmark" : "mark";
    try {
      await axios.post("http://localhost:3001/api/liveboard/favorite", {
        liveboardId: currentLiveboardId,
        action: action,
      });
      setLiveboards((prev) =>
        prev.map((lb) =>
          lb.id === currentLiveboardId
            ? { ...lb, isFavorite: !lb.isFavorite }
            : lb
        )
      );
    } catch (err) {
      alert("Failed to update favorite status.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyLiveboard = async () => {
    if (!currentLiveboardId) return;
    const currentLb = liveboards.find((lb) => lb.id === currentLiveboardId);
    const newName = window.prompt(
      "Enter name for copy:",
      `Copy of ${currentLb?.name}`
    );
    if (!newName) return;

    setIsProcessing(true);
    try {
      await axios.post("http://localhost:3001/api/liveboard/copy", {
        liveboardId: currentLiveboardId,
        newName,
      });
      alert("Copied successfully!");
      await fetchLiveboards();
    } catch (err) {
      alert("Failed to copy.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerHostReload = () => {
    if (liveboardRef.current) {
      liveboardRef.current.trigger(HostEvent.Reload);
    }
  };

  const triggerAIHighlights = () => {
    if (liveboardRef.current) {
      console.log("Triggering AI Highlights...");
      liveboardRef.current.trigger(HostEvent.AIHighlights);
      console.log("Event Value:", HostEvent.AIHighlights);
      console.log("complete");
      liveboardRef.current.on(EmbedEvent.Error, (error) => {
        console.error("Embed error:", error);
      });
    }
  };

  const frameParams = useMemo(() => ({ height: "100%", width: "100%" }), []);

  const customActions = useMemo(
    () => [
      {
        id: "edit-liveboard-primary",
        name: "Edit liveboard",
        target: CustomActionTarget.LIVEBOARD,
        position: "PRIMARY",
        metadataIds: { liveboardIds: [currentLiveboardId] },
      },
    ],
    [currentLiveboardId]
  );

  const handleCustomAction = useCallback((payload) => {
    if (payload?.data?.id === "edit-liveboard-primary") {
      if (liveboardRef.current) liveboardRef.current.trigger(HostEvent.Edit);
    }
  }, []);

  const filteredLiveboards = liveboards.filter((lb) =>
    (lb.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const currentLb = liveboards.find((lb) => lb.id === currentLiveboardId);
  const currentLbName = currentLb?.name || "Select a Liveboard";
  const isCurrentFavorite = currentLb?.isFavorite || false;

  return (
    <div className="liveboard-host-root">
      <CreateDashboardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateDashboard}
        isProcessing={isProcessing}
      />

      <div className="liveboard-page">
        <header className="liveboard-header">
          <div>{listError && <p className="error-text">{listError}</p>}</div>

          <div className="liveboard-header-actions">
            <div className="lb-actions-row">
              <button
                className="ts-button primary"
                onClick={() => setIsCreateModalOpen(true)}
                disabled={isProcessing}
                style={{ marginRight: "12px" }}
              >
                + New
              </button>

              <button
                className={`btn-icon ${isCurrentFavorite ? "active" : ""}`}
                onClick={toggleFavorite}
                disabled={isProcessing || !currentLiveboardId}
              >
                {isCurrentFavorite ? "★" : "☆"}
              </button>

              <button
                style={{ backgroundColor: "#2563eb" }}
                className="ts-button secondary"
                onClick={handleCopyLiveboard}
                disabled={isProcessing || !currentLiveboardId}
              >
                Copy
              </button>

              <div className="lb-picker">
                <button
                  type="button"
                  className="lb-picker-button"
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  disabled={isLoadingList || liveboards.length === 0}
                >
                  {isLoadingList ? "Loading..." : currentLbName}
                  <span className="lb-picker-caret">▾</span>
                </button>

                {isDropdownOpen && !isLoadingList && (
                  <div className="lb-picker-dropdown">
                    <input
                      type="text"
                      className="lb-picker-search"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="lb-picker-list">
                      {filteredLiveboards.map((lb) => (
                        <button
                          key={lb.id}
                          className="lb-picker-item"
                          onClick={() => {
                            setCurrentLiveboardId(lb.id);
                            setIsDropdownOpen(false);
                            setSearchTerm("");
                          }}
                        >
                          <div className="lb-picker-item-name">{lb.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                className="ts-button"
                onClick={triggerAIHighlights}
                disabled={!currentLiveboardId}
                title="Generate AI Highlights for this Liveboard"
                style={{
                  background:
                    "linear-gradient(90deg, #6e45e2 0%, #88d3ce 100%)",
                  color: "white",
                  border: "none",
                  fontWeight: "600",
                  marginRight: "8px",
                }}
              >
                ✨ AI Highlights
              </button>

              <button className="ts-button" onClick={triggerHostReload}>
                Reload
              </button>
            </div>
          </div>
        </header>

        <div className="liveboard-embed-shell">
          <LiveboardEmbed
            key={currentLiveboardId}
            ref={liveboardRef}
            className="ts-embed-wrapper"
            liveboardId={currentLiveboardId}
            frameParams={frameParams}
            customActions={customActions}
            onCustomAction={handleCustomAction}
            on={EmbedEvent.CustomAction}
          />
        </div>
      </div>
    </div>
  );
}

export default LiveboardHostPage;
