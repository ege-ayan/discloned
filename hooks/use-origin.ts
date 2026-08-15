import { useMounted } from "@/hooks/use-mounted";

export const useOrigin = () => {
  const mounted = useMounted();
  if (!mounted) {
    return null;
  }
  return window.location.origin;
};
