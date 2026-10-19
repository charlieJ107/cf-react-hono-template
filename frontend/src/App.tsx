import { RouterProvider } from "react-router/dom";
import { SWRConfig } from "swr";
import { swrConfig } from "@/api/swr-config";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { router } from "./app/router";

/** Cross-cutting providers, mounted exactly once. */
export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <SWRConfig value={swrConfig}>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster richColors />
        </TooltipProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
