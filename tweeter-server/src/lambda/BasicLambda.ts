// Partially written by AI.

import type { TweeterResponse } from "tweeter-shared";

type ServiceConstructor<TService> = new () => TService;

export async function handle<TService, TPayload extends object>(
  ServiceClass: ServiceConstructor<TService>,
  action: (service: TService) => Promise<TPayload>,
): Promise<TweeterResponse & TPayload> {
  const service = new ServiceClass();
  const payload = await action(service);

  return {
    success: true,
    message: null,
    ...payload,
  };
}
