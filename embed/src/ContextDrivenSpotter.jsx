import React, { useState, useEffect } from "react";
import axios from "axios";
import { SpotterEmbed } from "@thoughtspot/visual-embed-sdk/react";
import "./App.css";

const MODEL_NAMES = ["Retail Sales - Classic", "(Sample) Retail - Apparel"];

const SAMPLE_FILTER_VALUES = {
  Region: ["East", "West", "Central"],
  "Store Type": ["Flagship", "Outlet", "Online"],
  Category: ["Accessories", "Mens", "Womens"],
};

const ContextDrivenSpotter = () => {
  const [selectedModelName, setSelectedModelName] = useState(MODEL_NAMES[0]);
  const [worksheetId, setWorksheetId] = useState(null);

  const [metadata, setMetadata] = useState({ measures: [], attributes: [] });
  const [loadingState, setLoadingState] = useState("idle");

  const [selectedColumns, setSelectedColumns] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);

  const [spotterConfig, setSpotterConfig] = useState({
    isOpen: false,
    query: "",
  });

  useEffect(() => {
    const fetchDataContext = async () => {
      setLoadingState("loading");
      setWorksheetId(null);
      setMetadata({ measures: [], attributes: [] });

      setSelectedColumns([]);
      setActiveFilters([]);
      setSpotterConfig({ isOpen: false, query: "" });

      try {
        console.log(`Fetching ID for: ${selectedModelName}`);
        const idRes = await axios.get(
          `/api/find-worksheet?name=${encodeURIComponent(selectedModelName)}`
        );
        const fetchedId = idRes.data;
        setWorksheetId(fetchedId);

        console.log(`Fetching Columns for ID: ${fetchedId}`);
        const colRes = await axios.post("/api/columns", {
          worksheetId: fetchedId,
        });
        const allCols = colRes.data || [];

        setMetadata({
          measures: allCols.filter((c) => c.type === "MEASURE"),
          attributes: allCols.filter((c) => c.type === "ATTRIBUTE"),
        });

        setLoadingState("ready");
      } catch (err) {
        console.error("Error loading context:", err);
        setLoadingState("error");
      }
    };

    fetchDataContext();
  }, [selectedModelName]);

  const toggleColumn = (name) => {
    setSelectedColumns((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const addFilter = () => {
    setActiveFilters([
      ...activeFilters,
      { id: Date.now(), attribute: "", value: "", values: [] },
    ]);
  };

  const updateFilter = (id, field, value) => {
    setActiveFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [field]: value } : f))
    );
  };

  const removeFilter = (id) => {
    setActiveFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const handleLaunch = () => {
    let queryParts = [];

    if (selectedColumns.length > 0) {
      queryParts.push(`Show me ${selectedColumns.join(" and ")}`);
    } else {
      queryParts.push("Show me data");
    }

    const validFilters = activeFilters.filter((f) => f.attribute && f.value);
    if (validFilters.length > 0) {
      const filterStr = validFilters
        .map((f) => `${f.attribute} is '${f.value}'`)
        .join(" and ");
      queryParts.push(`where ${filterStr}`);
    }

    const finalQuery = queryParts.join(" ");
    console.log("Launching Spotter with Query:", finalQuery);

    setSpotterConfig({ isOpen: true, query: finalQuery });
  };

  return (
    <div className="ctx-container">
      <header className="ctx-header">
        <div className="ctx-header-left"></div>
        <div className="ctx-header-right">
          <label>Select Data Model:</label>
          <select
            value={selectedModelName}
            onChange={(e) => setSelectedModelName(e.target.value)}
            disabled={loadingState === "loading"}
          >
            {MODEL_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <div className="ctx-body">
        <div className="ctx-panel-left">
          {loadingState === "loading" && (
            <div className="loading-msg">Loading Metadata...</div>
          )}
          {loadingState === "error" && (
            <div className="error-msg">Failed to load model data.</div>
          )}

          {loadingState === "ready" && (
            <>
              <div className="builder-group">
                <h3>1. Select Metrics</h3>
                <div className="chip-grid">
                  {metadata.measures.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleColumn(m.name)}
                      className={`chip ${
                        selectedColumns.includes(m.name) ? "selected" : ""
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="builder-group">
                <h3>2. Select Attributes</h3>
                <div className="chip-grid">
                  {metadata.attributes.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => toggleColumn(a.name)}
                      className={`chip ${
                        selectedColumns.includes(a.name) ? "selected" : ""
                      }`}
                    >
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="builder-group">
                <h3>3. Apply Context Filters</h3>
                {activeFilters.map((f) => (
                  <div key={f.id} className="filter-row">
                    <div className="filter-col">
                      <select
                        value={f.attribute}
                        onChange={(e) =>
                          updateFilter(f.id, "attribute", e.target.value)
                        }
                      >
                        <option value="">Select Attribute...</option>
                        {metadata.attributes.map((a) => (
                          <option key={a.id} value={a.name}>
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="filter-col">
                      <span className="filter-operator">=</span>
                    </div>
                    <div className="filter-col value-picker">
                      {SAMPLE_FILTER_VALUES[f.attribute] ? (
                        <div className="value-list">
                          {SAMPLE_FILTER_VALUES[f.attribute].map((val) => {
                            const selected =
                              Array.isArray(f.values) && f.values.includes(val);
                            return (
                              <label
                                key={val}
                                className={`value-chip ${
                                  selected ? "selected" : ""
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(e) => {
                                    updateFilter(
                                      f.id,
                                      "values",
                                      selected
                                        ? f.values.filter((v) => v !== val)
                                        : [...(f.values || []), val]
                                    );
                                  }}
                                />
                                {val}
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder="Value (e.g. East)"
                          value={f.value}
                          onChange={(e) =>
                            updateFilter(f.id, "value", e.target.value)
                          }
                        />
                      )}
                    </div>
                    <div className="filter-col">
                      <button
                        onClick={() => removeFilter(f.id)}
                        className="btn-remove"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}
                <button onClick={addFilter} className="btn-add-link">
                  + Add Filter
                </button>
              </div>

              <button className="btn-launch" onClick={handleLaunch}>
                AskSpotter ;
              </button>
            </>
          )}
        </div>

        <div className="ctx-panel-right spotter-full-height">
          {spotterConfig.isOpen && worksheetId ? (
            <div className="spotter-embed-shell">
              <SpotterEmbed
                key={`${worksheetId}-${spotterConfig.query}`}
                frameParams={{ width: "100%", height: "100%" }}
                worksheetId={worksheetId}
                query={spotterConfig.query}
                searchOptions={{
                  searchQuery: spotterConfig.query,
                }}
                hideDataSources={true}
              />
            </div>
          ) : (
            <div className="empty-state">
              <p>Spotter</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContextDrivenSpotter;
