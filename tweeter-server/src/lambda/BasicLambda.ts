// Partially written by AI.

import type { TweeterResponse } from "tweeter-shared";
import type { DaoFactory } from "../dao/DaoFactory";
import { DynamoDaoFactory } from "../dao/dynamo/DynamoDaoFactory";

const daoFactory: DaoFactory = new DynamoDaoFactory();

type ServiceConstructor<TService> = new (
  daoFactory: DaoFactory,
) => TService;

export async function handle<
  TService,
  TPayload extends object,
  TResponse extends TweeterResponse,
>(
  ServiceClass: ServiceConstructor<TService>,
  action: (service: TService) => Promise<TPayload>,
): Promise<TResponse> {
  let payload: TPayload = {} as TPayload;
  try {
    const service = new ServiceClass(daoFactory);
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
