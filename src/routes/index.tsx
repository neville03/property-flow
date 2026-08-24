import { createFileRoute } from "@tanstack/react-router";
import RentalManagement from "@/components/RentalManagement";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rentaly — Rental Property Management Dashboard" },
      {
        name: "description",
        content:
          "Track properties, tenants, staff, rent collection and expenses across your rental portfolio in one clean dashboard.",
      },
      { property: "og:title", content: "Rentaly — Rental Property Management Dashboard" },
      {
        property: "og:description",
        content:
          "Track properties, tenants, staff, rent collection and expenses across your rental portfolio in one clean dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <RentalManagement />;
}
