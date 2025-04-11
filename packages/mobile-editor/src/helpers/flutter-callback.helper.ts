export const callNative = async (method: string, args?: string) =>
  await window.flutter_inappwebview?.callHandler(method, args);
