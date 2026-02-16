import React, { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

const OBJECT_TYPES = [
  "LIVEBOARD",
  "ANSWER",
  "LOGICAL_TABLE",
  "CONNECTION",
];

export default function TmlManager() {
  const [objName, setObjName] = useState("");
  const [objType, setObjType] = useState("LIVEBOARD");

  const [tmlContent, setTmlContent] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [lastSearchIndex, setLastSearchIndex] = useState(-1);

  const handleExport = async () => {
    if (!objName) {
      setStatusMsg("Please enter a name.");
      return;
    }
    setIsLoading(true);
    setStatusMsg("Searching and fetching TML...");
    setTmlContent("");

    try {
      const res = await axios.post(
        "http://localhost:3001/api/tml/export-by-name",
        {
          name: objName,
          type: objType,
        }
      );

      let finalTml = "";

      if (res.data && res.data.edoc) {
        finalTml = res.data.edoc;
      } else if (Array.isArray(res.data) && res.data.length > 0) {
        finalTml = res.data[0];
      } else if (typeof res.data === "string") {
        finalTml = res.data;
      } else {
        finalTml = JSON.stringify(res.data, null, 2);
      }

      if (typeof finalTml !== "string") {
        finalTml = JSON.stringify(finalTml, null, 2);
      }

      setTmlContent(finalTml);
      setStatusMsg(`Successfully fetched TML for "${objName}"`);
    } catch (error) {
      console.error(error);
      setStatusMsg(error.response?.data || "Error fetching TML.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!tmlContent) return;
    setIsLoading(true);
    setStatusMsg("Publishing changes to ThoughtSpot...");

    try {
      await axios.post("http://localhost:3001/api/tml/import", {
        tmlString: tmlContent,
      });
      setStatusMsg("Success! TML imported and object updated.");
    } catch (error) {
      console.error(error);
      setStatusMsg("Error importing TML. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindNext = () => {
    if (!searchText || !textareaRef.current) return;

    const text = tmlContent.toLowerCase();
    const query = searchText.toLowerCase();

    let nextIndex = text.indexOf(query, lastSearchIndex + 1);

    if (nextIndex === -1) {
      nextIndex = text.indexOf(query, 0);
      setStatusMsg("Search wrapped to top.");
    }

    if (nextIndex !== -1) {
      setLastSearchIndex(nextIndex);

      textareaRef.current.focus();

      textareaRef.current.setSelectionRange(
        nextIndex,
        nextIndex + query.length
      );

      textareaRef.current.blur();
      textareaRef.current.focus();
    } else {
      setStatusMsg(`"${searchText}" not found.`);
    }
  };

  const handleSearchAndReplace = (replaceAll = false) => {
    if (!searchText) return;

    if (replaceAll) {
      const regex = new RegExp(escapeRegExp(searchText), "gi");
      const newContent = tmlContent.replace(regex, replaceText);
      setTmlContent(newContent);
      setStatusMsg(`Replaced all occurrences of "${searchText}"`);
    } else {
      const newContent = tmlContent.replace(searchText, replaceText);
      setTmlContent(newContent);
      setStatusMsg(`Replaced first occurrence.`);
    }
  };

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  return (
    <div
      className="p-4"
      style={{ maxWidth: "1000px", margin: "0 auto", fontFamily: "sans-serif" }}
    >
      <h2 style={{ marginBottom: "20px" }}>TML Manager (YAML Editor)</h2>

      <div
        className="control-panel"
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          alignItems: "center",
        }}
      >
        <select
          value={objType}
          onChange={(e) => setObjType(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          {OBJECT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Object Name (e.g. Sales Dashboard)"
          value={objName}
          onChange={(e) => setObjName(e.target.value)}
          style={{
            padding: "10px",
            flex: 1,
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />

        <button
          onClick={handleExport}
          disabled={isLoading}
          style={{
            padding: "10px 20px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isLoading ? "Loading..." : "Export TML"}
        </button>
      </div>

      {tmlContent && (
        <div
          style={{
            background: "#e9ecef",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "10px",
            display: "flex",
            gap: "10px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <strong>Find:</strong>
            <input
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setLastSearchIndex(-1);
              }}
              style={{
                padding: "5px",
                borderRadius: "3px",
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={handleFindNext}
              style={{ cursor: "pointer", padding: "5px 10px" }}
            >
              Find Next
            </button>
          </div>

          <div
            style={{
              width: "1px",
              height: "20px",
              background: "#ccc",
              margin: "0 10px",
            }}
          ></div>

          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <strong>Replace:</strong>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              style={{
                padding: "5px",
                borderRadius: "3px",
                border: "1px solid #ccc",
              }}
            />
            <button
              onClick={() => handleSearchAndReplace(true)}
              style={{ cursor: "pointer", padding: "5px 10px" }}
            >
              Replace All
            </button>
          </div>
        </div>
      )}

      <div className="editor-area" style={{ position: "relative" }}>
        <textarea
          ref={textareaRef}
          value={tmlContent}
          onChange={(e) => setTmlContent(e.target.value)}
          spellCheck="false"
          placeholder="TML YAML content will appear here..."
          style={{
            width: "100%",
            height: "500px",
            fontFamily: "'Courier New', Courier, monospace",
            fontSize: "14px",
            lineHeight: "1.5",
            padding: "15px",
            border: "1px solid #333",
            borderRadius: "4px",
            backgroundColor: "#282c34",
            color: "#abb2bf",
            whiteSpace: "pre",
            overflowX: "auto",
          }}
        />
      </div>

      <div
        style={{
          marginTop: "15px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color:
              statusMsg.includes("Error") || statusMsg.includes("not found")
                ? "red"
                : "green",
            fontWeight: "500",
          }}
        >
          {statusMsg}
        </span>

        <button
          onClick={handleImport}
          disabled={!tmlContent || isLoading}
          style={{
            padding: "12px 24px",
            background: !tmlContent ? "#ccc" : "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: !tmlContent ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Publish Changes (Import)
        </button>
      </div>
    </div>
  );
}
