import { useAppStore } from "../store/useAppStore";

export function usePdfCommand() {
  const { setIsProcessing, setError, setResult, setResultFiles, reset } = useAppStore();

  async function run<T>(
    fn: () => Promise<T>,
    onSuccess?: (result: T) => void
  ): Promise<T | null> {
    reset();
    setIsProcessing(true);
    try {
      const result = await fn();
      if (typeof result === "string") {
        setResult(result);
      } else if (Array.isArray(result)) {
        setResultFiles(result as string[]);
      }
      onSuccess?.(result);
      return result;
    } catch (e) {
      setError(String(e));
      return null;
    } finally {
      setIsProcessing(false);
    }
  }

  return { run };
}
