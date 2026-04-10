import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const fromMock = vi.fn();
const createSignedUrlMock = vi.fn();

vi.mock("../../ts/api", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
    },
    from: fromMock,
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: createSignedUrlMock,
      })),
    },
  },
}));

vi.mock("../../ts/global", () => ({
  initGlobalUI: vi.fn().mockResolvedValue(undefined),
}));

function setupDom() {
  document.body.innerHTML = `
    <div id="child-filter"></div>
    <ul id="important-updates"></ul>
    <ul id="upcoming-events"></ul>
    <p id="pickup-selected-children"></p>

    <form id="pickup-form">
      <input id="pickup-name" />
      <button type="submit">Spara</button>
    </form>
    <div id="pickup-results"></div>

    <form id="absence-form">
      <input id="absence-date" />
      <button id="absence-button" type="submit">Anmäl</button>
    </form>

    <p id="selected-children-text"></p>
  `;
}

function setupSupabaseMocks() {
  getSessionMock.mockResolvedValue({
    data: {
      session: {
        user: {
          email: "parent@test.se",
        },
      },
    },
    error: null,
  });

  createSignedUrlMock.mockResolvedValue({
    data: { signedUrl: "https://cdn.test/avatar.jpg" },
    error: null,
  });

  fromMock.mockImplementation((table: string) => {
    if (table === "caregiver") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: "cg1",
                  first_name: "Anna",
                  last_name: "Andersson",
                  email: "parent@test.se",
                  is_active: true,
                },
                error: null,
              }),
            })),
          })),
        })),
      };
    }

    if (table === "department") {
      return {
        select: vi.fn().mockResolvedValue({
          data: [{ id: "dep1", name: "Blåbäret" }],
          error: null,
        }),
      };
    }

    if (table === "child_caregiver") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: [
              {
                child_id: "c1",
                caregiver_id: "cg1",
                can_pick_up: true,
                receives_notifications: true,
                child: {
                  id: "c1",
                  department_id: "dep1",
                  first_name: "Elsa",
                  last_name: "Andersson",
                  profile_image_url: null,
                  is_active: true,
                },
              },
            ],
            error: null,
          }),
        })),
      };
    }

    if (table === "notice") {
      return {
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          })),
        })),
      };
    }

    if (table === "schedule_entry") {
      return {
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          })),
        })),
      };
    }

    if (table === "absence") {
      return {
        insert: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };
    }

    throw new Error(`Oväntad tabell i testet: ${table}`);
  });
}

async function loadDashboard() {
  vi.resetModules();
  setupDom();
  setupSupabaseMocks();

  await import("../../ts/dashboard");

  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("dashboard integration", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    fromMock.mockReset();
    createSignedUrlMock.mockReset();
  });

  it("renderar barn korrekt", async () => {
    await loadDashboard();

    const childFilter = document.querySelector("#child-filter");
    expect(childFilter?.innerHTML).toContain("Elsa Andersson");

    const cards = document.querySelectorAll(".sibling-card");
    expect(cards.length).toBe(1);

    expect(document.querySelector("#selected-children-text")?.textContent).toContain("Elsa Andersson");
  });
});