import { Suspense } from "react";
import { AnalyticsClient } from "@/components/dashboard/analytics-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <AnalyticsClient />
    </Suspense>
  );
}
