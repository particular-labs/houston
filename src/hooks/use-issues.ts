import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commands } from "@/lib/commands";

export function useIssues(status?: string) {
  return useQuery({
    queryKey: ["issues", status],
    queryFn: () => commands.getIssues(status),
    staleTime: 30_000,
  });
}

export function useDismissIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (diagnosticId: string) => commands.dismissIssue(diagnosticId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}

export function useUpdateIssueStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      diagnosticId,
      status,
    }: {
      diagnosticId: string;
      status: string;
    }) => commands.updateIssueStatus(diagnosticId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });
}
