import { PageSkeleton } from "@/components/app/screen";

/**
 * Segment-level loading boundary. This folder has its own page *and* child routes, so moving
 * between them (e.g. /team -> /team/<id>) happens below the route-group loading.tsx. Without a
 * boundary here, production builds (where links are prefetched partially) could leave the
 * navigation transition suspended forever: the URL never changed. Keep this file.
 */
export default function Loading() {
  return <PageSkeleton />;
}
