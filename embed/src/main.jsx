import React, { useState } from "react";

import ReactDOM from "react-dom/client";

import { AuthType, init } from "@thoughtspot/visual-embed-sdk";

import App from "./App.jsx";

import ContextDrivenSpotter from "./ContextDrivenSpotter.jsx";

import LiveboardHostPage from "./LiveboardHostPage.jsx";

import axios from "axios";

import CustomSpotter from "./CustomSpotter.jsx";

import Spotterembed from "./SpotterEmbed.jsx";

import { AuthStatus } from "@thoughtspot/visual-embed-sdk";

import DrillDown from "./DrillDown.jsx";

import TmlManager from "./TMLManager.jsx";

import "./App.css";
import spotterIconSprite from "./assets/custom-spotter.svg?raw";

import Tiles from "./Tiles.jsx";
import Link from "./Link.jsx";
import RawIframe from "./Iframe.jsx";
import FullAppJS from "./Full.jsx";

let authStatus;

try {
  const authStatus = init({
    thoughtSpotHost: "https://ps-internal.thoughtspot.cloud/",
    authType: AuthType.TrustedAuthTokenCookieless,
    autoLogin: false,
    getAuthToken: async () => {
      try {
        console.log("getAuthToken: requesting token from backend");
        const response = await axios.get("/api/get-token");
        console.log(
          "getAuthToken: received token length",
          response.data?.length || 0,
        );
        console.log(response.data);
        return response.data;
      } catch (error) {
        console.log("FAILED to fetch auth token. ", error);
        return undefined;
      }
    },
    customizations: {
      style: {
        customCSS: {
          variables: {},
          rules_UNSTABLE: {},
        },
      },

      iconSpriteUrl:
        "https://cdn.jsdelivr.net/gh/thoughtspot/custom-css-demo/alternate-spotter-icon.svg",
    },
  });

  authStatus.on(AuthStatus.SDK_SUCCESS, () => {
    console.log(
      "ThoughtSpot SDK_SUCCESS: Initialization or Refresh successful.",
    );
  });

  authStatus.on(AuthStatus.SUCCESS, () => {
    console.log("ThoughtSpot SUCCESS fired");
  });

  authStatus.on(AuthStatus.FAILURE, (failureType) => {
    console.error("ThoughtSpot FAILURE event. Reason:", failureType);

    if (failureType === "EXPIRY") {
      console.log(
        "Session expired. SDK is now calling `getAuthToken` to refresh.",

        failureType,
      );
    } else {
      console.log("Critical ThoughtSpot init failed:", failureType);
    }
  });
} catch (error) {
  console.log("catched error from init function ", error);
}

const pages = [
  { id: "app", label: "Components", component: <App /> },

  {
    id: "liveboard-host",

    label: "Liveboard Host",

    component: <LiveboardHostPage />,
  },

  { id: "drilldown", label: "DrillDown", component: <DrillDown /> },

  { id: "spotter", label: "Spotter Embed", component: <Spotterembed /> },

  {
    id: "context-spotter",

    label: "Context Spotter",

    component: <ContextDrivenSpotter />,
  },

  {
    id: "custom-spotter",

    label: "Custom Spotter",

    component: <CustomSpotter />,
  },

  { id: "tml-manager", label: "TML Manager", component: <TmlManager /> },

  { id: "Tiles", label: "Tiles", component: <Tiles /> },
];

function DemoShell() {
  const [activePage, setActivePage] = useState("app");

  const renderPage = () => {
    const match = pages.find((p) => p.id === activePage);

    return match ? match.component : <div>Choose a page.</div>;
  };

  return (
    <div className="demo-shell">
      <header className="demo-nav">
        <div className="demo-nav-title">ThoughtSpot Embed Demos</div>

        <div className="demo-nav-links">
          {pages.map((p) => (
            <button
              key={p.id}
              className={`demo-nav-btn ${activePage === p.id ? "active" : ""}`}
              onClick={() => setActivePage(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <main className="demo-main">{renderPage()}</main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(<DemoShell />);
