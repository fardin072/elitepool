import { Suspense } from "react";
import { ProjectDetailClient } from "@/components/projects/project-detail-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Project Details" };

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <ProjectDetailClient id={id} />
    </Suspense>
  );
}
