import React, { useState, useEffect } from "react";
import "./App.css";

import { SpotterEmbed } from "@thoughtspot/visual-embed-sdk/react";
import axios from "axios";

const panels = [
  {
    id: "classic",
    name: "Classic",
    worksheetName: "Retail Sales - Classic",
    description: "",
  },
  {
    id: "sample",
    name: "Sample",
    worksheetName: "(Sample) Retail - Apparel",
    description: "",
  },
];

function CustomSpotter() {
  const [activePanel, setActivePanel] = useState(panels[0]);
  const [activeWorksheetId, setActiveWorksheetId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isSpotterOpen, setIsSpotterOpen] = useState(false);

  useEffect(() => {
    setIsSpotterOpen(false);

    const fetchWorksheetId = async () => {
      if (!activePanel) return;

      console.log(`Panel changed to: ${activePanel.name}. Fetching ID...`);
      setIsLoading(true);
      setError(null);
      setActiveWorksheetId(null);

      try {
        const response = await axios.get(
          `/api/find-worksheet?name=${encodeURIComponent(
            activePanel.worksheetName
          )}`
        );
        setActiveWorksheetId(response.data);
        console.log(`Successfully fetched ID: ${response.data}`);
      } catch (err) {
        console.error("Failed to fetch worksheet ID:", err);
        setError(`Could not find worksheet: "${activePanel.worksheetName}"`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorksheetId();
  }, [activePanel]);

  const renderHeaderButton = () => {
    const buttonText = isLoading ? "Spotter" : error ? "Error" : "Spotter";

    return (
      <button
        className="thoughtspot-button-header"
        onClick={() => setIsSpotterOpen(true)}
        disabled={isLoading || error || !activeWorksheetId}
      >
        {buttonText}
      </button>
    );
  };

  return (
    <div className="App-container">
      <nav className="App-sidebar">
        <h2>Sections</h2>
        <ul>
          {panels.map((panel) => (
            <li
              key={panel.id}
              className={activePanel.id === panel.id ? "active" : ""}
              onClick={() => setActivePanel(panel)}
            >
              {panel.name}
            </li>
          ))}
        </ul>
      </nav>

      <div className="App-main">
        <header className="App-header">
          <h1>{activePanel.name} Panel</h1>
          <div className="header-controls">{renderHeaderButton()}</div>
        </header>

        <main className="App-content">
          <h2>Welcome to the {activePanel.name} section.</h2>
          <p>{activePanel.description}</p>
          {error && <p className="error-text">{error}</p>}
        </main>
      </div>

      {isSpotterOpen && activeWorksheetId && (
        <div className="spotter-modal-overlay">
          <div className="spotter-modal-content">
            <button
              className="spotter-modal-close"
              onClick={() => setIsSpotterOpen(false)}
            >
              &times;
            </button>

            <div className="spotter-embed-wrapper">
              <SpotterEmbed
                key={activeWorksheetId}
                frameParams={{ height: "100%", width: "100%" }}
                worksheetId={activeWorksheetId}
                className="spotter-embed-component"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomSpotter;
