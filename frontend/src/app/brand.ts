/** App identity shown in the landing page, sidebar header and profile page. Edit this first. */
export const brand: {
  name: string;
  tagline: string;
  logo: string;
  /** Account page at your identity provider (e.g. https://auth.example.com/account); hidden when unset. */
  accountUrl?: string;
} = {
  name: "My App",
  tagline: "React + Hono",
  logo: "/icon.svg",
};
