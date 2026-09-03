/* features/staff/hooks/useStaff.ts */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { RepositoryFactory } from '../../../repositories/RepositoryFactory';
import type { AddWorkerDTO, UpdateWorkerDTO } from '../types';
import { generate4DigitCode } from '../utils/security';

const workerRepo = RepositoryFactory.getWorkerRepository();

export const useStaff = () => {
  const { shop } = useAuthStore();
  const shopId = shop?.id || 'default_shop';
  const queryClient = useQueryClient();

  // Query: Get Workers
  const {
    data: workers = [],
    isLoading: isLoadingWorkers,
    error: workersError,
    refetch: refetchWorkers,
  } = useQuery({
    queryKey: ['workers', shopId],
    queryFn: () => workerRepo.getWorkers(shopId),
    enabled: !!shopId,
  });

  // Query: Get Activity Logs
  const {
    data: activityLogs = [],
    isLoading: isLoadingLogs,
    refetch: refetchLogs,
  } = useQuery({
    queryKey: ['worker_logs', shopId],
    queryFn: () => workerRepo.getActivityLogs(shopId),
    enabled: !!shopId,
  });

  // Mutation: Add Worker
  const addWorkerMutation = useMutation({
    mutationFn: async (data: AddWorkerDTO) => {
      const tempCode = generate4DigitCode();
      return workerRepo.addWorker(shopId, data, tempCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers', shopId] });
      queryClient.invalidateQueries({ queryKey: ['worker_logs', shopId] });
    },
  });

  // Mutation: Update Worker
  const updateWorkerMutation = useMutation({
    mutationFn: async ({ workerId, updates }: { workerId: string; updates: UpdateWorkerDTO }) => {
      return workerRepo.updateWorker(workerId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers', shopId] });
      queryClient.invalidateQueries({ queryKey: ['worker_logs', shopId] });
    },
  });

  // Mutation: Generate New Approval Code
  const regenerateCodeMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return workerRepo.generateNewApprovalCode(workerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers', shopId] });
    },
  });

  // Mutation: Delete Worker
  const deleteWorkerMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return workerRepo.deleteWorker(workerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers', shopId] });
      queryClient.invalidateQueries({ queryKey: ['worker_logs', shopId] });
    },
  });

  // Mutation: Reset Worker PIN
  const resetPinMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return workerRepo.resetWorkerPin(workerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers', shopId] });
      queryClient.invalidateQueries({ queryKey: ['worker_logs', shopId] });
    },
  });

  // Mutation: Revoke Worker Active Sessions
  const revokeSessionsMutation = useMutation({
    mutationFn: async (workerId: string) => {
      return workerRepo.revokeWorkerSessions(workerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers', shopId] });
      queryClient.invalidateQueries({ queryKey: ['worker_logs', shopId] });
    },
  });

  return {
    workers,
    activityLogs,
    isLoading: isLoadingWorkers || isLoadingLogs,
    workersError,
    refetchWorkers,
    refetchLogs,
    addWorker: addWorkerMutation.mutateAsync,
    isAddingWorker: addWorkerMutation.isPending,
    updateWorker: updateWorkerMutation.mutateAsync,
    isUpdatingWorker: updateWorkerMutation.isPending,
    regenerateCode: regenerateCodeMutation.mutateAsync,
    isRegeneratingCode: regenerateCodeMutation.isPending,
    resetPin: resetPinMutation.mutateAsync,
    isResettingPin: resetPinMutation.isPending,
    revokeSessions: revokeSessionsMutation.mutateAsync,
    isRevokingSessions: revokeSessionsMutation.isPending,
    deleteWorker: deleteWorkerMutation.mutateAsync,
    isDeletingWorker: deleteWorkerMutation.isPending,
  };
};

