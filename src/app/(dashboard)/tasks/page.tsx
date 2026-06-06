import { Suspense } from "react";
import { TasksClient } from "@/components/tasks/tasks-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <TasksClient />
    </Suspense>
  );
}
