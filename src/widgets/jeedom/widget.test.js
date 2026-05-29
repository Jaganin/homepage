import { describe, expect, it } from "vitest";

import { expectWidgetConfigShape } from "test-utils/widget-config";

import widget from "./widget";

describe("jeedom widget config", () => {
  it("exports a valid widget config", () => {
    expectWidgetConfigShape(widget);
  });

  it("has a custom proxy handler", () => {
    expect(widget.proxyHandler).toBeTypeOf("function");
  });

  it("maps status endpoint correctly", () => {
    expect(widget.mappings?.status?.endpoint).toBe("status");
  });

  it("api template includes url placeholder", () => {
    expect(widget.api).toContain("{url}");
  });
});
