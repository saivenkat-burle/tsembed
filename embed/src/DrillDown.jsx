import React, { useState, useCallback } from "react";
import {
  LiveboardEmbed,
  useEmbedRef,
  Action,
} from "@thoughtspot/visual-embed-sdk/react";
import { HostEvent } from "@thoughtspot/visual-embed-sdk";
import "./App.css";

const MY_DRILL_COLUMNS = [
  { name: "Acct Nbr", id: "4b613b56-9d65-470c-99a5-5f703f4eed2b" },
  { name: "Acct Name", id: "83b8962c-47b8-460a-aa70-cace783db757" },
];

const LIVEBOARD_ID = "f3380ec5-76c5-4062-a132-1e5fb5d1c726";

function DrillDown() {
  const liveboardRef = useEmbedRef();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [drillContext, setDrillContext] = useState(null);

  const triggerHostReload = () => {
    if (!liveboardRef.current) return;
    liveboardRef.current.trigger(HostEvent.Reload);
  };

  const handleColumnSelect = (columnId) => {
    if (!liveboardRef.current || !drillContext) return;

    liveboardRef.current.trigger(HostEvent.DrillDown, {
      vizId: drillContext.vizId,
      points: {
        clickedPoint: drillContext.clickedPoint,
        selectedPoints: drillContext.selectedPoints,
      },
      columnGuid: columnId,
    });

    setIsModalOpen(false);
    setDrillContext(null);
  };

  const handleCustomAction = useCallback((payload) => {
    if (payload?.data?.id === "curated-drill-down") {
      const vizId = payload?.data?.vizId;
      console.log("payload", payload);

      const clickedPoint = payload?.data?.contextMenuPoints?.clickedPoint;
      const selectedPoints = payload?.data?.contextMenuPoints?.selectedPoints;
      console.log("clickedPoint", clickedPoint);
      console.log("selectedPoints", selectedPoints);
      if (vizId && (clickedPoint || selectedPoints)) {
        setDrillContext({ vizId, clickedPoint, selectedPoints });
        setIsModalOpen(true);
      }
    }
  }, []);

  return (
    <div className="liveboard-host-root">
      {isModalOpen && (
        <div
          className="custom-drill-modal-overlay"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="custom-drill-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Drill down by</h3>
            </div>

            <div className="modal-list">
              {MY_DRILL_COLUMNS.map((col) => (
                <button
                  key={col.id}
                  className="drill-list-item"
                  onClick={() => handleColumnSelect(col.id)}
                >
                  {col.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="liveboard-page">
        <header className="liveboard-header">
          <div className="liveboard-header-actions">
            <button className="ts-button" onClick={triggerHostReload}>
              Reload Liveboard
            </button>
          </div>
        </header>

        <div className="liveboard-embed-shell">
          <LiveboardEmbed
            ref={liveboardRef}
            className="ts-embed-wrapper"
            frameParams={{ height: "50%", width: "100%" }}
            liveboardId={LIVEBOARD_ID}
            onCustomAction={handleCustomAction}
            hiddenActions={[Action.DrillDown]}
            customActions={[
              {
                id: "curated-drill-down",
                name: "Custom Drill Down",
                position: "CONTEXTMENU",
                target: "VIZ",
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

export default DrillDown;
