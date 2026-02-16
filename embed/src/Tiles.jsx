import React, { useRef } from "react";
import { LiveboardEmbed, HostEvent } from "@thoughtspot/visual-embed-sdk/react";
import "./App.css";

const Tiles = () => {
  const embedRef = useRef(null);

  const handleAIHighlights = () => {
    if (embedRef.current) {
      embedRef.current.trigger(HostEvent.AIHighlights);
      console.log("Triggered AI Highlights for Liveboard:");
    }
  };

  return (
    <div className="kpi-card-container">
      <div className="kpi-card-header">
        <h3>Sales </h3>
        <button className="ai-highlight-btn" onClick={handleAIHighlights}>
          ✨ AI Highlights
        </button>
      </div>

      <div className="kpi-card-body">
        <LiveboardEmbed
          ref={embedRef}
          liveboardId="75131430-adb4-4231-bfdd-501047d83697"
          vizId="9c5dbed5-2150-464e-867c-3ee216163e2e"
          fullHeight={true}
          frameSettings={{
            width: "100%",
            height: "100%",
          }}
          hideLiveboardHeader={true}
          disabledActions={["save", "share", "edit"]}
        />
      </div>
    </div>
  );
};

export default Tiles;
