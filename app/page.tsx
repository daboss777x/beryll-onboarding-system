import { redirect } from "next/navigation";
import { homeFor, requireUser } from "@/lib/data/auth";

/** "/" sends each role to its home (middleware usually does this first). */
export default async function Home() {
  const profile = await requireUser();
  redirect(homeFor(profile.role));
}
