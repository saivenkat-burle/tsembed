require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = 3001;

const thoughtSpotHost = "https://ps-internal.thoughtspot.cloud/";
const thoughtSpotSecret = process.env.THOUGHTSPOT_SECRET_KEY;
const serviceAccountUsername = "saivenkat.burle@thoughtspot.com";
// const serviceAccountUsername = "sai_new2";

const serviceTokenCache = { token: null, expires: 0, user: null };
let cachedUserGuid = null;

const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());

async function getServiceToken() {
  const now = Date.now();
  console.log("get service called");
  if (serviceTokenCache.token && serviceTokenCache.expires > now + 60000) {
    console.log("getServiceToken: using cached service token");
    return serviceTokenCache.token;
  }
  const tsTokenUrl = `${thoughtSpotHost}api/rest/2.0/auth/token/full`;
  try {
    const response = await axios.post(
      tsTokenUrl,
      {
        secret_key: thoughtSpotSecret,
        username: serviceAccountUsername,
        validity_time_in_sec: 1800,
        org_id: "753715713",
        // org_id: 0,
        auto_create: true,
        persist_option: "NONE",
      },
      { headers: { "Content-Type": "application/json" } },
    );
    serviceTokenCache.token = response.data.token;
    serviceTokenCache.expires = now + response.data.validity_time_in_sec * 1000;
    serviceTokenCache.user = serviceAccountUsername;
    console.log(
      "getServiceToken: fetched new token len for ",
      response.data.token?.length || 0,
      serviceAccountUsername,
    );
    return response.data.token;
  } catch (error) {
    console.error(
      "!!! FAILED to generate Service Token !!!",
      error.response?.data || error.message,
    );
    throw new Error("Authentication failed");
  }
}

async function getUserId() {
  if (cachedUserGuid) return cachedUserGuid;
  const token = await getServiceToken();
  const response = await axios.post(
    `${thoughtSpotHost}api/rest/2.0/users/search`,
    { name: serviceAccountUsername },
    { headers: { Authorization: "Bearer " + token } },
  );
  const user = response.data.find(
    (u) =>
      u.name === serviceAccountUsername ||
      u.display_name === serviceAccountUsername,
  );
  if (user) {
    cachedUserGuid = user.id;
    return user.id;
  }
  throw new Error("User not found");
}

app.post("/api/login", async (req, res) => {
  try {
    const tsLoginUrl = `${thoughtSpotHost}api/rest/2.0/auth/session/login`;
    console.log("Login route hit!");

    console.log(`Attempting login for user: sai`);

    const response = await axios.post(
      tsLoginUrl,
      {
        username: "sai",
        password: "Venktvardan@1",
        remember_me: true,
      },
      {
        headers: { "Content-Type": "application/json" },
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400,
        withCredentials: true,
      },
    );

    const cookies = response.headers["set-cookie"];

    if (cookies && cookies.length > 0) {
      const tsDomain = "ps-internal.thoughtspot.cloud";

      const updatedCookies = cookies.map((cookie) => {
        return (
          cookie.replace("Path=/", "Path=/; SameSite=None; Secure; HttpOnly") +
          `; Domain=${tsDomain}`
        );
      });

      res.setHeader("Set-Cookie", updatedCookies);

      console.log(
        "Login Successful. Cookies forwarded to browser with correct domain.",
      );
      return res.sendStatus(204);
    }

    console.warn("Login API returned 200/204 but NO cookies were found.");
    return res
      .status(401)
      .json({ error: "No session cookie received from ThoughtSpot" });
  } catch (err) {
    console.error("Login Failed:", err.message);
    return res
      .status(500)
      .json({ error: "ThoughtSpot login failed from auth server" });
  }
});

// 1. Get Token for Frontend

app.get("/api/get-token", async (req, res) => {
  try {
    const token = await getServiceToken();
    console.log("called");
    console.log(token);
    console.log(
      "GET request called /api/get-token: sending token len",
      token?.length || 0,
    );
    res.status(200).send(token);
  } catch (error) {
    res.status(500).send("Error generating token");
  }
});

// 2. Get List
app.get("/api/liveboards", async (req, res) => {
  try {
    const serviceToken = await getServiceToken();
    console.log("metadata api calling for user ", serviceTokenCache.user);
    const response = await axios.post(
      `${thoughtSpotHost}api/rest/2.0/metadata/search`,
      {
        metadata: [{ type: "LIVEBOARD" }],
        record_size: 10,
        include_headers: true,
      },
      { headers: { Authorization: "Bearer " + serviceToken } },
    );
    console.log(response.data);
    const liveboards = (response.data || []).map((item) => ({
      id: item.metadata_id || item.header.id,
      name: item.metadata_name || item.header.name,
      isFavorite: item.is_favorite || item.favorite || false,
    }));
    res.json(liveboards);
  } catch (error) {
    console.error("Error /api/liveboards:", error.message);
    res.status(500).send("Error fetching liveboards");
  }
});

// 3. Create Liveboard (NEW)
app.post("/api/create-liveboard", async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).send("Name is required");

  try {
    const serviceToken = await getServiceToken();

    // 1. Define TML Template (Generic Empty Liveboard)
    const tmlObject = {
      liveboard: {
        name: name,
        description: description || "",
      },
    };

    // 2. Prepare Import Body
    const importBody = {
      metadata_tmls: [JSON.stringify(tmlObject)],
      import_policy: "PARTIAL",
      create_new: true,
    };

    console.log(`-> Creating new Liveboard: "${name}"...`);

    // 3. Call Import API
    await axios.post(
      `${thoughtSpotHost}api/rest/2.0/metadata/tml/import`,
      importBody,
      { headers: { Authorization: "Bearer " + serviceToken } },
    );

    // 4. Find New ID (Wait briefly for indexing)
    await new Promise((r) => setTimeout(r, 1500));

    const searchRes = await axios.post(
      `${thoughtSpotHost}api/rest/2.0/metadata/search`,
      {
        metadata: [{ type: "LIVEBOARD", identifier: name }],
        record_size: 1,
      },
      { headers: { Authorization: "Bearer " + serviceToken } },
    );

    const newId = searchRes.data?.[0]?.metadata_id;

    if (!newId) throw new Error("Created but ID not found");

    res.json({ success: true, id: newId, name: name });
  } catch (error) {
    console.error(
      "Error creating liveboard:",
      error.response?.data || error.message,
    );
    res.status(500).send("Failed to create dashboard");
  }
});

// 4. Mark Favorite
app.post("/api/liveboard/favorite", async (req, res) => {
  const { liveboardId, action } = req.body;
  try {
    const serviceToken = await getServiceToken();
    const userId = await getUserId();
    const url = `${thoughtSpotHost}callosum/v1/tspublic/v1/metadata/markunmarkfavoritefor`;
    const params = new URLSearchParams();
    params.append("type", "LIVEBOARD");
    params.append("ids", `["${liveboardId}"]`);
    params.append("userid", userId);

    const config = {
      headers: {
        Authorization: "Bearer " + serviceToken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };

    if (action === "mark") await axios.post(url, params, config);
    else await axios.delete(url, { ...config, data: params.toString() });

    res.json({ success: true });
  } catch (error) {
    res.status(500).send("Error updating favorite");
  }
});

// 5. Copy Liveboard
app.post("/api/liveboard/copy", async (req, res) => {
  const { liveboardId, newName } = req.body;
  try {
    const serviceToken = await getServiceToken();
    // Export
    const exportRes = await axios.post(
      `${thoughtSpotHost}api/rest/2.0/metadata/tml/export`,
      {
        metadata: [{ identifier: liveboardId, type: "LIVEBOARD" }],
        export_associated: false,
        edoc_format: "JSON",
      },
      { headers: { Authorization: "Bearer " + serviceToken } },
    );
    const tmlObject = exportRes.data?.[0];

    if (tmlObject?.liveboard) tmlObject.liveboard.name = newName;

    await axios.post(
      `${thoughtSpotHost}api/rest/2.0/metadata/tml/import`,
      {
        metadata_tmls: [JSON.stringify(tmlObject)],
        import_policy: "PARTIAL",
        create_new: true,
      },
      { headers: { Authorization: "Bearer " + serviceToken } },
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).send("Error copying Liveboard");
  }
});

app.get("/api/find-worksheet", async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).send("Worksheet name is required");

  try {
    const token = await getServiceToken();
    const searchRes = await axios.post(
      `${thoughtSpotHost}api/rest/2.0/metadata/search`,
      {
        metadata: [
          {
            identifier: name,
            type: "LOGICAL_TABLE",
          },
        ],
        record_size: 5,
        include_headers: true,
      },
      { headers: { Authorization: "Bearer " + token } },
    );

    const match = (searchRes.data || []).find(
      (item) =>
        item.metadata_header?.type === "WORKSHEET" &&
        (item.metadata_name === name ||
          item.metadata_header?.name === name ||
          item.header?.name === name),
    );

    const id =
      match?.metadata_id ||
      match?.metadata_header?.id ||
      match?.header?.id ||
      null;

    if (id) res.send(id);
    else res.status(404).send("Worksheet not found");
  } catch (error) {
    console.error(
      "Find Worksheet Error:",
      error.response?.data || error.message,
    );
    res.status(500).send("Error searching for worksheet");
  }
});

// 2. Get Columns (For the Builder UI)
app.post("/api/columns", async (req, res) => {
  const { worksheetId } = req.body;
  if (!worksheetId) return res.status(400).send("worksheetId is required");

  try {
    const token = await getServiceToken();
    const response = await axios.post(
      `${thoughtSpotHost}api/rest/2.0/metadata/search`,
      {
        metadata: [
          {
            identifier: worksheetId,
            type: "LOGICAL_TABLE",
          },
        ],
        record_size: 1,
        include_headers: true,
        include_details: true,
      },
      {
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    const detail = response.data?.[0]?.metadata_detail;
    const cols = detail?.columns || [];

    const collected = cols.map((col) => ({
      id: col.header?.name || col.name,
      name: col.header?.name || col.name,
      type: col.type || col.column_type, // ATTRIBUTE or MEASURE
      dataType: col.dataType,
    }));

    res.json(collected);
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const payload = error.response?.data || error.message;
    console.error(
      "Get Columns Error:",
      statusCode,
      JSON.stringify(payload, null, 2),
    );
    res.status(statusCode).json({ error: payload || "Error fetching columns" });
  }
});
// 6. Export TML by Name (Search -> Get ID -> Export)
app.post("/api/tml/export-by-name", async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).send("Name and Type are required");

  try {
    const serviceToken = await getServiceToken();

    // Step 1: Find the GUID
    const searchRes = await axios.post(
      `${thoughtSpotHost}api/rest/2.0/metadata/search`,
      {
        metadata: [{ type: type, identifier: name }],
        record_size: 5,
      },
      { headers: { Authorization: "Bearer " + serviceToken } },
    );

    const match = (searchRes.data || []).find(
      (item) => item.metadata_name.toLowerCase() === name.toLowerCase(),
    );

    if (!match) {
      return res
        .status(404)
        .send(`Object '${name}' of type '${type}' not found.`);
    }

    const guid = match.metadata_id;

    const exportRes = await axios.post(
      `${thoughtSpotHost}api/rest/2.0/metadata/tml/export`,
      {
        metadata: [{ identifier: guid, type: type }],
        export_associated: false,
        edoc_format: "YAML",
      },
      { headers: { Authorization: "Bearer " + serviceToken } },
    );

    res.json(exportRes.data);
  } catch (error) {
    console.error("Export TML Error:", error.response?.data || error.message);
    res.status(500).send("Failed to export TML.");
  }
});

// 7. Import TML (Save Changes)
app.post("/api/tml/import", async (req, res) => {
  const { tmlString } = req.body;
  if (!tmlString) return res.status(400).send("TML content is required");

  try {
    const serviceToken = await getServiceToken();

    // Prepare the body. The API expects an array of strings.
    // Ensure tmlString is a stringified JSON if it came as an object,
    // but usually the frontend sends it as a raw string from the textarea.

    await axios.post(
      `${thoughtSpotHost}api/rest/2.0/metadata/tml/import`,
      {
        metadata_tmls: [tmlString],
        import_policy: "PARTIAL",
        create_new: false, // Update existing object if GUID matches
      },
      { headers: { Authorization: "Bearer " + serviceToken } },
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Import TML Error:", error.response?.data || error.message);
    res.status(500).send("Failed to import TML.");
  }
});
app.get("/api/get-abac-token", async (req, res) => {
  try {
    const tsTokenUrl = `${thoughtSpotHost}api/rest/2.0/auth/token/custom`;

    console.log("Generating ABAC Token for Org: 753715713");

    // 2. The Payload with Variable Values
    const tokenRequestPayload = {
      secret_key: "",

      username: "whitelist",
      validity_time_in_sec: 3600,
      // org_id: "753715713",
      org_id: "0",
      auto_create: true,

      persist_option: "REPLACE",

      variable_values: [
        {
          name: "site_id_var",
          values: ["S-101", "S-102"],
        },
      ],
    };

    // 4. Make the call
    const response = await axios.post(tsTokenUrl, tokenRequestPayload, {
      headers: { "Content-Type": "application/json" },
    });

    const token = response.data.token;
    console.log("ABAC Token Generated successfully, len:", token?.length || 0);

    // Return just the token string as text (or json depending on frontend expectation)
    res.status(200).send(token);
  } catch (error) {
    console.error(
      "!!! FAILED to generate ABAC Token !!!",
      error.response?.data || error.message,
    );
    res.status(500).send("Error generating ABAC token");
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
