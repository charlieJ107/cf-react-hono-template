import useSWR from "swr";
import { api, request } from "@/api/client";

/** SWR key = the API path, so `mutate("/api/me")` anywhere refreshes this data. */
export const ME_KEY = "/api/me";

/** The signed-in user's profile (GET /api/me). */
export function useMe() {
  return useSWR(ME_KEY, () => request(api.me.$get()));
}
