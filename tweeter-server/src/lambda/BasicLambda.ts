// Partially written by AI.

import type { TweeterResponse } from "tweeter-shared";

type ServiceConstructor<TService> = new () => TService;

export async function handle<
  TService,
  TPayload extends object,
  TResponse extends TweeterResponse,
>(
  ServiceClass: ServiceConstructor<TService>,
  action: (service: TService) => Promise<TPayload>,
): Promise<TResponse> {
  const service = new ServiceClass();
  let payload: TPayload = {} as TPayload;
  try {
    payload = await action(service);
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Bad Request",
    } as TResponse;
  }

  return {
    success: true,
    message: null,
    ...payload,
  } as unknown as TResponse;
}
