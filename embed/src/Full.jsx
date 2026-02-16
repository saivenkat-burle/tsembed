import React, { useEffect, useRef } from "react";
import {
  AppEmbed,
  Page,
  PrimaryNavbarVersion,
  HomePage,
  EmbedEvent,
} from "@thoughtspot/visual-embed-sdk";

function FullAppJS() {
  const embedRef = useRef(null);

  useEffect(() => {
    const embed = new AppEmbed(embedRef.current, {
      frameParams: {
        height: "100%",
        width: "100%",
      },
      discoveryExperience: {
        primaryNavbarVersion: PrimaryNavbarVersion.Sliding,
        homePage: HomePage.ModularWithStylingChanges,
      },
      pageId: Page.Home,
      showPrimaryNavbar: true,
    });

    embed
      .on(EmbedEvent.Init, () => console.log("Initializing..."))
      .on(EmbedEvent.Load, () => console.log("Loaded!"))
      .render();

    return () => embed.destroy();
  }, []);

  return <div ref={embedRef} style={{ height: "100vh", width: "100%" }} />;
}
export default FullAppJS;
