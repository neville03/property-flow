import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "RentMe — Rental Operations Console" },
      {
        name: "description",
        content: "Sign in to RentMe to manage properties, tenant applications, documents and rent collection.",
      },
      { property: "og:title", content: "RentMe — Rental Operations Console" },
      {
        property: "og:description",
        content: "Manage properties, tenant applications, documents and rent collection in one workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => null,
});
