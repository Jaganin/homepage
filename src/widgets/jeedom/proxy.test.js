import { beforeEach, describe, expect, it, vi } from "vitest";

import createMockRes from "test-utils/create-mock-res";

const { httpProxy, getServiceWidget, logger } = vi.hoisted(() => ({
  httpProxy: vi.fn(),
  getServiceWidget: vi.fn(),
  logger: { debug: vi.fn(), error: vi.fn() },
}));

vi.mock("utils/logger", () => ({ default: () => logger }));
vi.mock("utils/config/service-helpers", () => ({ default: getServiceWidget }));
vi.mock("utils/proxy/http", () => ({ httpProxy }));

import jeedomProxyHandler from "./proxy";

const baseWidget = {
  type: "jeedom",
  url: "http://jeedom.local",
  apikey: "testkey123",
};

const makeReq = (extra = {}) => ({
  query: { group: "home", service: "Jeedom", endpoint: "status", ...extra },
});

function jeedomResponse(result) {
  return [200, "application/json", Buffer.from(JSON.stringify({ jsonrpc: "2.0", id: 1, result }))];
}

describe("widgets/jeedom/proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServiceWidget.mockResolvedValue(baseWidget);
  });

  it("aggregates summary, messages and updates into a single response", async () => {
    httpProxy
      .mockResolvedValueOnce(jeedomResponse({ light: { value: 3 } })) // summary::global
      .mockResolvedValueOnce(jeedomResponse([{}, {}, {}, {}, {}])) // message::all (5 items)
      .mockResolvedValueOnce(
        jeedomResponse([
          { status: "ok" },
          { status: "update" },
          { status: "update" },
        ]),
      ); // update::all (2 need update)

    const res = createMockRes();
    await jeedomProxyHandler(makeReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ lights: 3, messages: 5, updates: 2 });
    expect(httpProxy).toHaveBeenCalledTimes(3);
  });

  it("fetches temp_int and temp_ext when cmd IDs are configured", async () => {
    getServiceWidget.mockResolvedValue({
      ...baseWidget,
      fields: ["temp_int", "temp_ext"],
      temp_int_cmd_id: 862,
      temp_ext_cmd_id: 701,
    });

    httpProxy
      .mockResolvedValueOnce(jeedomResponse({ light: { value: 0 } }))
      .mockResolvedValueOnce(jeedomResponse([]))
      .mockResolvedValueOnce(jeedomResponse([]))
      .mockResolvedValueOnce(jeedomResponse({ currentValue: "21.5" })) // temp_int
      .mockResolvedValueOnce(jeedomResponse({ currentValue: "12.3" })); // temp_ext

    const res = createMockRes();
    await jeedomProxyHandler(makeReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.temp_int).toBe(21.5);
    expect(res.body.temp_ext).toBe(12.3);
    expect(httpProxy).toHaveBeenCalledTimes(5);
  });

  it("returns null temperatures when cmd IDs are not configured", async () => {
    httpProxy
      .mockResolvedValueOnce(jeedomResponse({ light: { value: null } }))
      .mockResolvedValueOnce(jeedomResponse([]))
      .mockResolvedValueOnce(jeedomResponse([]));

    const res = createMockRes();
    await jeedomProxyHandler(makeReq(), res);

    expect(res.body.temp_int).toBeNull();
    expect(res.body.temp_ext).toBeNull();
    expect(httpProxy).toHaveBeenCalledTimes(3);
  });

  it("returns 0 for lights when summary value is null", async () => {
    httpProxy
      .mockResolvedValueOnce(jeedomResponse({ light: { value: null } }))
      .mockResolvedValueOnce(jeedomResponse([]))
      .mockResolvedValueOnce(jeedomResponse([]));

    const res = createMockRes();
    await jeedomProxyHandler(makeReq(), res);

    expect(res.body.lights).toBe(0);
  });

  it("returns 400 for unknown endpoint", async () => {
    const res = createMockRes();
    await jeedomProxyHandler(makeReq({ endpoint: "unknown" }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("returns 400 when group or service are missing", async () => {
    const res = createMockRes();
    await jeedomProxyHandler({ query: { endpoint: "status" } }, res);

    expect(res.statusCode).toBe(400);
  });

  it("handles Jeedom API errors gracefully and returns zeros", async () => {
    httpProxy
      .mockResolvedValueOnce([500, "text/plain", Buffer.from("error")])
      .mockResolvedValueOnce([500, "text/plain", Buffer.from("error")])
      .mockResolvedValueOnce([500, "text/plain", Buffer.from("error")]);

    const res = createMockRes();
    await jeedomProxyHandler(makeReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ lights: 0, messages: 0, updates: 0 });
  });
});
