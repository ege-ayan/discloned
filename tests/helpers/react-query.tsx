import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, type RenderHookOptions } from "@testing-library/react";
import type { ReactNode } from "react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function createQueryClientWrapper(
  queryClient = createTestQueryClient(),
) {
  return function QueryClientWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

export function renderHookWithQueryClient<Result, Props>(
  hook: (props: Props) => Result,
  options?: Omit<RenderHookOptions<Props>, "wrapper"> & {
    queryClient?: QueryClient;
  },
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } =
    options ?? {};

  return {
    queryClient,
    ...renderHook(hook, {
      ...renderOptions,
      wrapper: createQueryClientWrapper(queryClient),
    }),
  };
}
