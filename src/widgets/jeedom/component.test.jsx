// @vitest-environment jsdom

import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "test-utils/render-with-providers";

const { useWidgetAPI } = vi.hoisted(() => ({ useWidgetAPI: vi.fn() }));

vi.mock("utils/proxy/use-widget-api", () => ({
  default: useWidgetAPI,
}));

import Component from "./component";

const baseService = { widget: { type: "jeedom" } };

describe("widgets/jeedom/component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders placeholder blocks while loading", () => {
    useWidgetAPI.mockReturnValue({ data: undefined, error: undefined });

    const { container } = renderWithProviders(<Component service={baseService} />, {
      settings: { hideErrors: false },
    });

    expect(container.querySelectorAll(".service-block")).toHaveLength(3);
    expect(screen.getByText("jeedom.lights")).toBeInTheDocument();
    expect(screen.getByText("jeedom.messages")).toBeInTheDocument();
    expect(screen.getByText("jeedom.updates")).toBeInTheDocument();
  });

  it("renders error UI on API error", () => {
    useWidgetAPI.mockReturnValue({ data: undefined, error: { message: "unreachable" } });

    renderWithProviders(<Component service={baseService} />, { settings: { hideErrors: false } });

    expect(screen.getAllByText(/widget\.api_error/i).length).toBeGreaterThan(0);
  });

  it("renders default fields with correct values", () => {
    useWidgetAPI.mockReturnValue({
      data: { lights: 3, messages: 7, updates: 1, temp_int: null, temp_ext: null },
      error: undefined,
    });

    renderWithProviders(<Component service={baseService} />, { settings: { hideErrors: false } });

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders temperature blocks when included in fields", () => {
    useWidgetAPI.mockReturnValue({
      data: { lights: 0, messages: 0, updates: 0, temp_int: 21.5, temp_ext: 12.3 },
      error: undefined,
    });

    const service = {
      widget: {
        type: "jeedom",
        fields: ["temp_int", "temp_ext"],
        temp_int_cmd_id: 862,
        temp_ext_cmd_id: 701,
      },
    };

    renderWithProviders(<Component service={service} />, { settings: { hideErrors: false } });

    expect(screen.getByText("jeedom.temp_int")).toBeInTheDocument();
    expect(screen.getByText("jeedom.temp_ext")).toBeInTheDocument();
  });

  it("displays dash when temperature value is null", () => {
    useWidgetAPI.mockReturnValue({
      data: { lights: 0, messages: 0, updates: 0, temp_int: null, temp_ext: null },
      error: undefined,
    });

    const service = {
      widget: { type: "jeedom", fields: ["temp_int", "temp_ext"] },
    };

    renderWithProviders(<Component service={service} />, { settings: { hideErrors: false } });

    expect(screen.getAllByText("-")).toHaveLength(2);
  });

  it("shows only fields listed in widget config", () => {
    useWidgetAPI.mockReturnValue({
      data: { lights: 2, messages: 5, updates: 0, temp_int: null, temp_ext: null },
      error: undefined,
    });

    const service = { widget: { type: "jeedom", fields: ["messages"] } };

    const { container } = renderWithProviders(<Component service={service} />, {
      settings: { hideErrors: false },
    });

    expect(container.querySelectorAll(".service-block")).toHaveLength(1);
    expect(screen.getByText("jeedom.messages")).toBeInTheDocument();
    expect(screen.queryByText("jeedom.lights")).not.toBeInTheDocument();
  });
});
