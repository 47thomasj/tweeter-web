// Partially written by AI.

import type { TweeterResponse } from "tweeter-shared";
import type { DaoFactory } from "../dao/DaoFactory";
import { DynamoDaoFactory } from "../dao/dynamo/DynamoDaoFactory";
import { ClientError } from "../services/ClientError";

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
    if (error instanceof ClientError) {
      return {
        success: false,
        message: error.message,
      } as TResponse;
    }

    console.error(error);
    throw error;
  }

  return {
    success: true,
    message: null,
    ...payload,
  } as unknown as TResponse;
}
