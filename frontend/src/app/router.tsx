import { createBrowserRouter } from "react-router";
import { FullPageSpinner } from "@/components/full-page-spinner";
import { GuestOnly, RequireAuth } from "@/features/auth";
import { LandingPage } from "@/features/landing";
import { NotFound } from "./not-found";

// React Router is used as a routing library only: no framework mode, no loaders/actions.
// Signed-in routes are lazy so the landing page never downloads the app shell.
export const router = createBrowserRouter([
  {
    // Shown while lazy route modules for the first URL are loading.
    HydrateFallback: FullPageSpinner,
    children: [
      {
        element: <GuestOnly />,
        children: [{ path: "/", element: <LandingPage /> }],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            lazy: async () => ({ Component: (await import("./shell/app-shell")).AppShell }),
            children: [
              { path: "/home", lazy: async () => ({ Component: (await import("@/features/home")).HomePage }) },
              { path: "/me", lazy: async () => ({ Component: (await import("@/features/me")).ProfilePage }) },
            ],
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
