import { cleanup, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import { swrConfig } from "@/api/swr-config";
import { ProfilePage } from "./profile-page";

function renderPage() {
  // A fresh cache per test so responses don't leak between tests.
  return render(
    <SWRConfig value={{ ...swrConfig, provider: () => new Map() }}>
      <ProfilePage />
    </SWRConfig>,
  );
}

function stubApi(status: number, body: unknown) {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    Response.json(body, { status, headers: { "content-type": "application/json" } }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProfilePage", () => {
  it("shows the signed-in user's profile from GET /api/me", async () => {
    const fetchMock = stubApi(200, {
      id: "u1",
      name: "Ada Lovelace",
      email: "ada@example.com",
      emailVerified: true,
      image: null,
      role: "admin",
      createdAt: "2026-01-02T03:04:05.000Z",
    });
    renderPage();

    expect(await screen.findByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.getByText("admin")).toBeTruthy();
    expect(screen.getByText("AL")).toBeTruthy(); // avatar fallback without an image
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/api\/me$/);
  });

  it("shows the API error message with a retry action", async () => {
    stubApi(401, { code: "UNAUTHORIZED", message: "Sign in required" });
    renderPage();

    expect(await screen.findByText("Couldn't load your profile")).toBeTruthy();
    expect(screen.getByText("Sign in required")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });
});
