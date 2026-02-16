import React, { useMemo } from "react";
import {
  LiveboardEmbed,
  EmbedEvent,
  Action,
} from "@thoughtspot/visual-embed-sdk/react";
import "./App.css";

const LIVEBOARD_ID = "f3380ec5-76c5-4062-a132-1e5fb5d1c726";
const PROGRAMMATIC_ACTION_ID = "code-based-view-details";
const TARGET_COLUMN = "Acct Nbr";

const getColumnValueFromPayload = (payload, targetColumnName) => {
  try {
    const data = payload.data;
    if (!data) return null;

    console.log("Processing Payload Data:", data);

    let point = null;

    if (data.contextMenuPoints && data.contextMenuPoints.clickedPoint) {
      point = data.contextMenuPoints.clickedPoint;
    } else if (data.clickedPoint) {
      point = data.clickedPoint;
    } else if (data.selectedPoints && data.selectedPoints.length > 0) {
      point = data.selectedPoints[0];
    } else if (data.points) {
      point =
        data.points.clickedPoint ||
        (data.points.selectedPoints && data.points.selectedPoints[0]);
    }

    if (point) {
      const allData = [
        ...(point.selectedAttributes || []),
        ...(point.selectedMeasures || []),
        ...(point.deselectedAttributes || []),
        ...(point.deselectedMeasures || []),
      ];

      const foundItem = allData.find(
        (item) =>
          item.column?.name?.toLowerCase() === targetColumnName.toLowerCase(),
      );

      if (foundItem) {
        return foundItem.value;
      }
    }

    const columns = data.columns || data.embedAnswerData?.columns;
    if (columns) {
      const colIndex = columns.findIndex(
        (col) => col.name.toLowerCase() === targetColumnName.toLowerCase(),
      );

      if (colIndex !== -1) {
        const rowData =
          data.data || data.embedAnswerData?.data?.[0]?.columnValues;
        if (Array.isArray(rowData)) return rowData[colIndex];
        if (typeof rowData === "object" && rowData !== null) {
          const key = Object.keys(rowData).find(
            (k) => k.toLowerCase() === targetColumnName.toLowerCase(),
          );
          return key ? rowData[key] : null;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Parse Error:", error);
    return null;
  }
};

export default function Link() {
  const codeBasedActions = useMemo(
    () => [
      {
        id: PROGRAMMATIC_ACTION_ID,
        name: "Navigate",
        position: "CONTEXTMENU",
        target: "VIZ",
      },
    ],
    [],
  );

  const performNavigation = (value, method) => {
    const targetUrl = `http://localhost:5173/${encodeURIComponent(value)}`;
    console.log(`[${method}] Redirecting to: ${targetUrl}`);

    alert(
      ` ${method} \n\nUser clicked ID: ${value}\nNavigating to:\n${targetUrl}`,
    );

    window.open(targetUrl, "_blank");
  };

  const onCustomAction = (payload) => {
    console.log("Custom Action Payload:", payload);
    if (payload.data.id === PROGRAMMATIC_ACTION_ID) {
      const value = getColumnValueFromPayload(payload, TARGET_COLUMN);
      if (value) performNavigation(value, "Custom Action");
    }
  };

  const onVizPointDoubleClick = (payload) => {
    console.log("Double Click Payload:", payload);
    const value = getColumnValueFromPayload(payload, TARGET_COLUMN);
    if (value) performNavigation(value, "Double Click");
  };

  const onVizPointClick = (payload) => {
    console.log("Single Click Payload:", payload);
    const value = getColumnValueFromPayload(payload, TARGET_COLUMN);
    if (value) {
      performNavigation(value, "Single Click");
    }
  };

  return (
    <div className="liveboard-container">
      <div className="demo-header">
        <h3>Liveboard Embed</h3>
      </div>
      <div className="embed-wrapper">
        <LiveboardEmbed
          frameParams={{ height: "100%", width: "100%" }}
          liveboardId={LIVEBOARD_ID}
          customActions={codeBasedActions}
          onCustomAction={onCustomAction}
          onVizPointDoubleClick={onVizPointDoubleClick}
          onVizPointClick={onVizPointClick}
        />
      </div>
    </div>
  );
}
