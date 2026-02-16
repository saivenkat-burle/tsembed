import React, { useState, useMemo } from "react";
import { SpotterEmbed } from "@thoughtspot/visual-embed-sdk/react";
import { Action, RuntimeFilterOp } from "@thoughtspot/visual-embed-sdk";
import "./spotter.css";

const Spotterembed = () => {
  const [selectedRegion, setSelectedRegion] = useState("All");

  const [discountRate, setDiscountRate] = useState(0.1);

  const runtimeFilters = useMemo(() => {
    if (selectedRegion === "All") return [];

    return [
      {
        columnName: "Region",
        operator: RuntimeFilterOp.EQ,
        values: [selectedRegion],
      },
    ];
  }, [selectedRegion]);

  const runtimeParameters = useMemo(() => {
    return [
      {
        name: "Discount Rate",
        value: discountRate,
      },
    ];
  }, [discountRate]);

  return (
    <div
      className="spotter-container"
      style={{ display: "flex", flexDirection: "column", height: "100vh" }}
    >
      <div
        className="controls-bar"
        style={{
          padding: "15px",
          background: "#f4f4f4",
          borderBottom: "1px solid #ddd",
          display: "flex",
          gap: "20px",
        }}
      >
        <div className="control-group">
          <label style={{ fontWeight: "bold", marginRight: "10px" }}>
            Filter Region:
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{ padding: "5px" }}
          >
            <option value="All">Show All</option>
            <option value="East">East</option>
            <option value="West">West</option>
            <option value="North">North</option>
            <option value="South">South</option>
          </select>
        </div>
      </div>

      <div
        className="spotter-embed-wrapper"
        style={{ flex: 1, overflow: "hidden" }}
      >
        <SpotterEmbed
          frameParams={{ height: "100%", width: "100%" }}
          worksheetId="cd252e5c-b552-49a8-821d-3eadaa049cca"
          className="spotter-embed-component"
          runtimeFilters={runtimeFilters}
          runtimeParameters={runtimeParameters}
          disabledActions={[Action.Data]}
          disableSourceSelection={true}
        />
      </div>
    </div>
  );
};

export default Spotterembed;
