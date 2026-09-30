import { createFileRoute } from "@tanstack/react-router";
import { BssyPlatform } from "@/components/bssy-platform";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BSSY Digital Monitoring & Management Platform — Demo" },
      { name: "description", content: "A synthetic frontend demonstration of the BSSY operational cleanliness lifecycle for BMC review." },
      { property: "og:title", content: "BSSY Digital Platform — Synthetic Demo" },
      { property: "og:description", content: "Explore a connected, synthetic BSSY operations journey from planning through decision review." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <BssyPlatform />;
}
