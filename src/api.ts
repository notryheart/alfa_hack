import {
  decimalAmount,
  type Application,
  type Draft,
  type Request,
  type DocumentSlot,
} from "./domain";

/**
 * API boundary for the next iteration, not an active integration.
 * Final DTOs must be mapped to the supplied SQL schema when it is available.
 * Cookies/CSRF and authorization must be implemented by the Django server.
 */
export class CreditApi {
  constructor(private baseUrl = "/api") {}
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      credentials: "include",
      ...options,
    });
    if (!response.ok)
      throw new Error(
        `API ${response.status}: ${response.status === 403 ? "Доступ запрещён" : "Не удалось выполнить запрос"}`,
      );
    return response.json() as Promise<T>;
  }
  applications() {
    return this.request<Application[]>("/applications/");
  }
  application(id: string) {
    return this.request<Application>(
      `/applications/${encodeURIComponent(id)}/`,
    );
  }
  requests(id: string) {
    return this.request<Request[]>(
      `/applications/${encodeURIComponent(id)}/requests/`,
    );
  }
  documents(id: string) {
    return this.request<DocumentSlot[]>(
      `/applications/${encodeURIComponent(id)}/documents/`,
    );
  }
  createApplication(draft: Draft, csrf: string, asDraft = false) {
    return this.request<Application>("/applications/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrf },
      body: JSON.stringify({
        ...draft,
        amount: decimalAmount(draft.amount),
        term: Number(draft.term),
        status: asDraft ? "draft" : "submitted",
      }),
    });
  }
}
