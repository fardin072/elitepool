import { Suspense } from "react";
import { MembersClient } from "@/components/members/members-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = { title: "Members" };

export default function MembersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-xl" />}>
      <MembersClient />
    </Suspense>
  );
}
