import {
  useQuery,
  useMutation,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';

/**
 * Generic GET hook wrapping TanStack Query.
 *
 * Usage:
 *   const { data, isLoading } = useApi<Car[]>('/cars', ['cars']);
 *   const { data } = useApi<Car>(`/cars/${id}`, ['cars', id], { enabled: !!id });
 */
export function useApi<TData = unknown>(
  endpoint: string,
  queryKey: QueryKey,
  options?: Omit<UseQueryOptions<TData, ApiError>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<TData, ApiError>({
    queryKey,
    queryFn: () => api.get<TData>(endpoint),
    ...options,
  });
}

/**
 * Generic mutation hook wrapping TanStack Query.
 *
 * Usage:
 *   const { mutate } = useApiMutation<Car, CreateCarInput>('/cars', 'POST');
 *   mutate({ make: 'Toyota', model: 'Corolla' });
 */
export function useApiMutation<TData = unknown, TVariables = unknown>(
  endpoint: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: Omit<UseMutationOptions<TData, ApiError, TVariables>, 'mutationFn'>,
) {
  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables) => {
      switch (method) {
        case 'POST':
          return api.post<TData>(endpoint, variables);
        case 'PUT':
          return api.put<TData>(endpoint, variables);
        case 'PATCH':
          return api.patch<TData>(endpoint, variables);
        case 'DELETE':
          return api.delete<TData>(endpoint);
      }
    },
    ...options,
  });
}
