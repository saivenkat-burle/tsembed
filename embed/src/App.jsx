import React, { useState } from "react";
import "./App.css";
import {
  LiveboardEmbed,
  SearchEmbed,
  AppEmbed,
  SpotterEmbed,
  Action,
} from "@thoughtspot/visual-embed-sdk/react";
import LiveboardPicker from "./LiveboardPicker.jsx";
import { HomepageModule } from "@thoughtspot/visual-embed-sdk";
import { HomePage, PrimaryNavbarVersion } from "@thoughtspot/visual-embed-sdk";
import {
  RuntimeFilterOp,
  CustomActionTarget,
} from "@thoughtspot/visual-embed-sdk";

function App() {
  const [activeEmbed, setActiveEmbed] = useState("liveboard");

  const sampleRuntimeFilter = [
    {
      columnName: "CITY",
      operator: RuntimeFilterOp.EQ,
      values: ["Boise"],
    },
  ];
  const handleCustomAction = (payload) => {
    const actionId = payload.data?.id;

    switch (actionId) {
      case "open-help":
        alert("Open help clicked from Spotter");
        break;

      case "export-context":
        console.log("Spotter custom action payload:", payload.data);
        break;

      default:
        console.warn("Unknown custom action:", actionId);
    }
  };
  const renderEmbed = () => {
    switch (activeEmbed) {
      case "liveboard":
        return (
          <LiveboardEmbed
            frameParams={{ height: "100%" }}
            liveboardId="3e6785e1-89d6-4549-8b66-7588cd7d599e"
            vizId="8536af7e-5c6e-4cef-ad8e-926c1001fd75"
            primaryAction={Action.DownloadAsCsv}
          />
        );
      case "answer":
        return (
          <SearchEmbed
            frameParams={{ height: "100%" }}
            answerId="8536af7e-5c6e-4cef-ad8e-926c1001fd75"
            disabledActions={[Action.Download, Action.ColumnRename]}
            hideDataSources={true}
            hideSearchBar={true}
          />
        );
      case "spotter":
        return (
          <SpotterEmbed
            frameParams={{ height: "100%" }}
            worksheetId="6e701564-74e4-4ca7-8ff5-520fd45cddcd"
            runtimeFilters={sampleRuntimeFilter}
            searchOptions={{
              searchQuery: "show me sales",
            }}
            spotterSidebarConfig={{
              enablePastConversationsSidebar: true,
              spotterSidebarTitle: "My Conversations",
              spotterSidebarDefaultExpanded: true,
            }}
            runtimeParameters={[
              { name: "allowed_columns", value: "kit_numbe" },
            ]}
            customActions={[
              {
                id: "open-help",
                name: "Open help",
                target: CustomActionTarget.SPOTTER,
                position: "MENU",
              },
              {
                id: "export-context",
                name: "Export context",
                target: CustomActionTarget.SPOTTER,
                position: "MENU",
              },
            ]}
            onCustomAction={handleCustomAction}
            hiddenActions={[Action.Download, Action.Edit]}
          />
        );

      case "fullapp":
        return (
          <AppEmbed
            frameParams={{ height: "100%" }}
            pageId="home"
            discoveryExperience={{
              primaryNavbarVersion: PrimaryNavbarVersion.Sliding,
              homePage: HomePage.ModularWithStylingChanges,
            }}
            showPrimaryNavbar={true}
            hiddenHomepageModules={[
              HomepageModule.Favorite,
              HomepageModule.Learning,
              HomepageModule.Trending,
              HomepageModule.Search,
              HomepageModule.MyLibrary,
            ]}
            reorderedHomepageModules={[HomepageModule.Watchlist]}
          />
        );
      case "liveboard-picker":
        return <LiveboardPicker />;
      default:
        return <div>Select an embed type from the left.</div>;
    }
  };

  return (
    <div className="App">
      <nav className="sidebar">
        <h2>ThoughtSpot Embed</h2>
        <ul>
          <li
            className={activeEmbed === "liveboard" ? "active" : ""}
            onClick={() => setActiveEmbed("liveboard")}
          >
            Liveboard
          </li>
          <li>Liveboard Explorer</li>
          <li
            className={activeEmbed === "answer" ? "active" : ""}
            onClick={() => setActiveEmbed("answer")}
          >
            Answer
          </li>
          <li
            className={activeEmbed === "spotter" ? "active" : ""}
            onClick={() => setActiveEmbed("spotter")}
          >
            Spotter
          </li>

          <li
            className={activeEmbed === "fullapp" ? "active" : ""}
            onClick={() => setActiveEmbed("fullapp")}
          >
            Full App
          </li>
        </ul>
      </nav>
      <main className="content">{renderEmbed()}</main>
    </div>
  );
}

export default App;
