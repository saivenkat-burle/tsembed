import React from "react";

const RawIframe = () => {
  const tsHost = "https://ps-internal.thoughtspot.cloud";

  const liveboardId = "f3380ec5-76c5-4062-a132-1e5fb5d1c726";

  const iframeSrc = `${tsHost}/?embedApp=true#/embed/viz/${liveboardId}`;

  return (
    <div style={{ height: "800px", width: "100%", padding: "20px" }}>
      <h3>Raw Iframe Embed</h3>
      <iframe
        src={iframeSrc}
        title="ThoughtSpot Embed"
        width="100%"
        height="100%"
        style={{ border: "none" }}
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default RawIframe;
