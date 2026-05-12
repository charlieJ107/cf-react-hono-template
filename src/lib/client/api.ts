import type { ErrorResponse } from "../shared/errors";

export class ApiError extends Error {
    status: number;
    code: string;

    constructor(status: number, code: string, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.code = code;
    }
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const body = await res.json().catch(() => ({})) as Partial<ErrorResponse>;
        throw new ApiError(res.status, body.code ?? "UNKNOWN", body.message ?? res.statusText);
    }
    return res.json() as Promise<T>;
}

export const fetcher = <T = unknown>(url: string): Promise<T> =>
    fetch(url, { credentials: "include" }).then((r) => handleResponse<T>(r));

export function apiPost<T = unknown>(url: string, body: unknown): Promise<T> {
    return fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    }).then((r) => handleResponse<T>(r));
}

export function apiPatch<T = unknown>(url: string, body: unknown): Promise<T> {
    return fetch(url, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    }).then((r) => handleResponse<T>(r));
}

export function apiDelete(url: string): Promise<void> {
    return fetch(url, { method: "DELETE", credentials: "include" }).then((r) =>
        handleResponse<void>(r),
    );
}
