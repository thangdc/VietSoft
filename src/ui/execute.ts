export async function execute<T>(
  action: () => Promise<T> | T,
  options: {
    onLoading?: (loading: boolean) => void;
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
  } = {},
): Promise<T | undefined> {
  options.onLoading?.(true);

  try {
    const result = await action();
    options.onSuccess?.(result);
    return result;
  } catch (error) {
    options.onError?.(error);
    return undefined;
  } finally {
    options.onLoading?.(false);
  }
}
