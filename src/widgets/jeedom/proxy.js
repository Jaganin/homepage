import getServiceWidget from "utils/config/service-helpers";
import createLogger from "utils/logger";
import { httpProxy } from "utils/proxy/http";

const logger = createLogger("jeedomProxyHandler");

function parseJeedomJSON(buffer) {
  try {
    let str = Buffer.isBuffer(buffer) ? buffer.toString() : buffer;
    // Strip icon HTML strings that may contain control characters
    str = str.replace(/"icon":"[^"]*"/g, '"icon":""');
    str = str.replace(/"iconnul":"[^"]*"/g, '"iconnul":""');
    return JSON.parse(str);
  } catch {
    return null;
  }
}

async function jeedomCall(apiUrl, apikey, method, params = {}) {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method,
    params: { apikey, ...params },
  });

  const [status, , data] = await httpProxy(new URL(apiUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (status !== 200) {
    logger.error("Jeedom API HTTP error %d for method %s", status, method);
    return null;
  }

  const parsed = parseJeedomJSON(data);
  if (!parsed) {
    logger.error("Jeedom JSON parse error for method %s", method);
    return null;
  }
  if (parsed.error) {
    logger.error("Jeedom API error for method %s: %s", method, parsed.error.message);
    return null;
  }
  return parsed.result;
}

async function fetchCmdValue(apiUrl, apikey, cmdId) {
  const result = await jeedomCall(apiUrl, apikey, "cmd::byId", { id: String(cmdId) });
  if (!result) return null;
  const raw = result.currentValue;
  if (raw === "" || raw === null || raw === undefined) return null;
  const num = parseFloat(raw);
  return Number.isFinite(num) ? num : null;
}

export default async function jeedomProxyHandler(req, res) {
  const { group, service, endpoint, index } = req.query;

  if (!group || !service) {
    return res.status(400).json({ error: "Invalid proxy service" });
  }

  const widget = await getServiceWidget(group, service, index);
  if (!widget) {
    return res.status(400).json({ error: "Widget not found" });
  }

  if (endpoint !== "status") {
    return res.status(400).json({ error: "Unknown endpoint" });
  }

  const apiUrl = `${widget.url}/core/api/jeeApi.php`;
  const { apikey } = widget;

  const [summary, messages, updates] = await Promise.all([
    jeedomCall(apiUrl, apikey, "summary::global"),
    jeedomCall(apiUrl, apikey, "message::all"),
    jeedomCall(apiUrl, apikey, "update::all"),
  ]);

  const fields = widget.fields ?? ["lights", "messages", "updates"];
  let tempInt = null;
  let tempExt = null;

  if (fields.includes("temp_int") && widget.temp_int_cmd_id) {
    tempInt = await fetchCmdValue(apiUrl, apikey, widget.temp_int_cmd_id);
  }
  if (fields.includes("temp_ext") && widget.temp_ext_cmd_id) {
    tempExt = await fetchCmdValue(apiUrl, apikey, widget.temp_ext_cmd_id);
  }

  return res.status(200).json({
    lights: summary?.light?.value ?? 0,
    messages: Array.isArray(messages) ? messages.length : 0,
    updates: Array.isArray(updates) ? updates.filter((u) => u.status === "update").length : 0,
    temp_int: tempInt,
    temp_ext: tempExt,
  });
}
