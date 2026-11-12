// Partially written by AI.

import type { TweeterResponse } from "tweeter-shared";
import type { RequestValidator } from "./RequestValidation";

type ServiceConstructor<TService> = new () => TService;

export async function handle<
  TService,
  TRequest extends object,
  TPayload extends object,
>(
  request: unknown,
  validate: RequestValidator<TRequest>,
  ServiceClass: ServiceConstructor<TService>,
  action: (service: TService, request: TRequest) => Promise<TPayload>,
): Promise<TweeterResponse & TPayload> {
  validate(request);

  const service = new ServiceClass();
  const payload = await action(service, request);

  return {
    success: true,
    message: null,
    ...payload,
  };
}
