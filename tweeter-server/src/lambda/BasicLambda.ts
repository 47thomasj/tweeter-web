// Partially written by AI.

import type { TweeterResponse } from "tweeter-shared";

type ServiceConstructor<TService> = new () => TService;

export async function handle<TService, TPayload extends object>(
  ServiceClass: ServiceConstructor<TService>,
  action: (service: TService) => Promise<TPayload>,
): Promise<TweeterResponse> {
  const service = new ServiceClass();
  let payload: TPayload | undefined;
  try {
    payload = await action(service);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Bad Request",
    };
  }

  return {
    success: true,
    message: null,
    ...payload,
  };
}
