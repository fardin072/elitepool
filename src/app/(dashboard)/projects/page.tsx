import { Suspense } from "react";
import { ProjectsClient } from "@/components/projects/projects-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <ProjectsClient />
    </Suspense>
  );
}
