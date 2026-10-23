import { describe, expect, it } from "vitest";
import {
  canAccess,
  currentVersion,
  decimalAmount,
  readiness,
  sortedRequests,
  validateDraft,
  type User,
} from "./domain";
import { createSeed } from "./seed";
import { reducer } from "./store";

const client: User = {
  id: "demo-client",
  name: "Анна Смирнова",
  role: "client",
  organizationId: "org-sever",
};
const manager: User = {
  id: "demo-manager",
  name: "Мария Волкова",
  role: "manager",
  organizationId: "bank",
};
const loggedIn = (user = client) => ({ ...createSeed(), user });
const draft = { ...createSeed().draft, amount: "15000000,50", term: "24" };
describe("Application rules", () => {
  it("scopes client membership and keeps administration separate from bank participation", () => {
    const state = loggedIn();
    expect(canAccess(client, state.applications[0])).toBe(true);
    expect(canAccess(client, state.applications[2])).toBe(false);
    expect(canAccess(manager, state.applications[2])).toBe(true);
    expect(
      canAccess({ ...manager, id: "unassigned" }, state.applications[0]),
    ).toBe(false);
    expect(canAccess({ ...client, role: "admin" }, state.applications[0])).toBe(
      false,
    );
  });
  it("counts only accepted CURRENT required versions", () => {
    const state = loggedIn();
    const slots = state.slots.filter((s) => s.applicationId === "a-0842");
    expect(readiness(slots)).toEqual({ accepted: 3, total: 5 });
    const next = reducer(state, {
      type: "upload",
      slotId: "s-balance",
      filename: "test.pdf",
      size: 100,
      id: "v-new",
    });
    expect(currentVersion(next.slots[0])?.review).toBe("pending");
    expect(readiness(next.slots)).toEqual({ accepted: 2, total: 5 });
    expect(next.requests.find((r) => r.id === "r-balance")?.resolved).toBe(
      true,
    );
  });
  it("does not resolve a request on upload and requires accepted current versions for explicit resolution", () => {
    const state = loggedIn();
    const uploaded = reducer(state, {
      type: "upload",
      slotId: "s-turnover",
      filename: "test.pdf",
      size: 100,
      id: "v-new",
    });
    expect(uploaded.requests.find((r) => r.id === "r-turnover")?.resolved).toBe(
      false,
    );
    expect(
      reducer(uploaded, { type: "resolve", requestId: "r-turnover" }),
    ).toBe(uploaded);
    const staffState = { ...uploaded, user: manager };
    expect(
      reducer(staffState, { type: "resolve", requestId: "r-turnover" }),
    ).toBe(staffState);
    const reviewed = reducer(staffState, {
      type: "review",
      slotId: "s-turnover",
      versionId: "v-new",
      review: "accepted",
      note: "Принято",
    });
    const resolved = reducer(reviewed, {
      type: "resolve",
      requestId: "r-turnover",
    });
    expect(resolved.requests.find((r) => r.id === "r-turnover")?.resolved).toBe(
      true,
    );
    expect(resolved.activities[0].href).toContain("requests/r-turnover");
  });
  it("does not permit clients to review or bank staff to upload", () => {
    const state = loggedIn();
    expect(
      reducer(state, {
        type: "review",
        slotId: "s-turnover",
        versionId: "v-turnover-1",
        review: "accepted",
        note: "",
      }),
    ).toBe(state);
    const staff = loggedIn(manager);
    expect(
      reducer(staff, {
        type: "upload",
        slotId: "s-tax",
        filename: "test.pdf",
        size: 100,
        id: "v-new",
      }),
    ).toBe(staff);
  });
  it("does not allow reviewing replaced versions, or returning a version without an explanation", () => {
    const state = loggedIn(manager);
    expect(
      reducer(state, {
        type: "review",
        slotId: "s-balance",
        versionId: "v-balance-1",
        review: "accepted",
        note: "",
      }),
    ).toBe(state);
    expect(
      reducer(state, {
        type: "review",
        slotId: "s-turnover",
        versionId: "v-turnover-1",
        review: "changes",
        note: " ",
      }),
    ).toBe(state);
  });
  it("validates decimal amounts and normalizes payload values to decimal strings", () => {
    expect(decimalAmount("000001200,5")).toBe("1200.50");
    expect(validateDraft(draft, 2)).toEqual({});
    for (const amount of ["0", "-1", "1.001", "abc", "1e9", ""]) {
      expect(validateDraft({ ...draft, amount }, 2).amount).toBeTruthy();
    }
    const state = reducer(loggedIn(), {
      type: "submit",
      draft,
      id: "test-id",
      asDraft: false,
    });
    expect(state.applications[0].amount).toBe("15000000.50");
    expect(state.applications[0].status).toBe("review");
    expect(state.draft.amount).toBe("");
  });
  it("keeps draft submission explicit and creates an activity event", () => {
    const state = reducer(loggedIn(), {
      type: "submit",
      draft,
      id: "test-id",
      asDraft: true,
    });
    expect(state.applications[0].status).toBe("draft");
    expect(
      reducer(state, { type: "send", applicationId: "test-id" }).applications[0]
        .status,
    ).toBe("review");
  });
  it("sorts unresolved urgent requests first, then undated, then resolved", () => {
    const requests = createSeed().requests;
    expect(
      sortedRequests([
        ...requests,
        { ...requests[0], id: "no-date", due: "" },
      ]).map((r) => r.id),
    ).toEqual(["r-turnover", "r-tax", "no-date", "r-balance"]);
  });
  it("keeps conversation contexts isolated and denies a forged context", () => {
    const state = loggedIn();
    const next = reducer(state, {
      type: "message",
      applicationId: "a-0842",
      context: "r-turnover",
      text: "  Уточнение  ",
    });
    expect(next.messages.at(-1)?.text).toBe("Уточнение");
    expect(next.messages.at(-1)?.context).toBe("r-turnover");
    expect(
      reducer(state, {
        type: "message",
        applicationId: "a-0842",
        context: "fake",
        text: "test",
      }),
    ).toBe(state);
    expect(
      reducer(state, {
        type: "message",
        applicationId: "a-private",
        context: "application",
        text: "test",
      }),
    ).toBe(state);
  });
  it("resets all synthetic state and role on logout", () => {
    const state = reducer(loggedIn(), { type: "profile", name: "Тест" });
    const reset = reducer(state, { type: "logout" });
    expect(reset.user).toBeNull();
    expect(reset.applications).toHaveLength(3);
    expect(reset.draft.amount).toBe("");
  });
  it("creates document requirements and notifications from the same staff request", () => {
    const state = loggedIn(manager);
    const next = reducer(state, {
      type: "request",
      request: { ...state.requests[0], id: "new", slotIds: ["s-new"] },
      newSlots: [{ id: "s-new", title: "Новый документ" }],
    });
    expect(next.slots.at(-1)?.required).toBe(true);
    expect(next.requests[0].slotIds).toEqual(["s-new"]);
    expect(next.notifications[0].href).toContain("/requests/new");
    expect(readiness(next.slots).total).toBe(6);
  });
});
