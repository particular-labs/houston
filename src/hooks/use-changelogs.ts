import { useQuery } from "@tanstack/react-query";
import { getChangelogsFromDb, type ChangelogEntry } from "@/lib/changelogs";

export function useChangelogs() {
  return useQuery<ChangelogEntry[]>({
    queryKey: ["changelogs"],
    queryFn: getChangelogsFromDb,
    staleTime: 60_000,
  });
}
