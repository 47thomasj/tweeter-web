// Partially written by AI.

import { TweeterRequest, TweeterResponse } from "tweeter-shared";
import { UserFacingError } from "./UserFacingError";

export class ClientCommunicator {
  private SERVER_URL: string;

  public constructor(SERVER_URL: string) {
    this.SERVER_URL = SERVER_URL;
  }

  public async doPost<REQ extends TweeterRequest, RES extends TweeterResponse | void>(
    req: REQ | undefined,
    endpoint: string,
    headers?: Headers,
  ): Promise<RES> {
    if (headers && req) {
      headers.append("Content-type", "application/json");
    } else if (req) {
      headers = new Headers({
        "Content-type": "application/json",
      });
    }

    const url = this.getUrl(endpoint);
    const params = this.getParams(
      "POST",
      headers,
      req ? JSON.stringify(req) : req,
    );

    try {
      const resp: Response = await fetch(url, params);

      if (resp.ok) {
        // Be careful with the return type here. resp.json() returns Promise<any> which means there is no type checking on response.
        const response: RES = await resp.json();
        return response;
      } else {
        const error = (await resp.json()) as {
          message?: unknown;
          errorMessage?: unknown;
        };
        const message =
          typeof error.message === "string"
            ? error.message
            : typeof error.errorMessage === "string"
              ? error.errorMessage
              : resp.statusText;
        console.error(
          `Client communicator ${params.method} failed: HTTP ${resp.status}: ${message}`,
        );
        throw new UserFacingError(message);
      }
    } catch (error) {
      if (error instanceof UserFacingError) {
        throw error;
      }

      throw new Error(
        `Client communicator ${params.method} failed:\n${
          (error as Error).message
        }`,
      );
    }
  }

  private getUrl(endpoint: string): string {
    return this.SERVER_URL + endpoint;
  }

  private getParams(
    method: string,
    headers?: Headers,
    body?: BodyInit,
  ): RequestInit {
    const params: RequestInit = { method: method };

    if (headers) {
      params.headers = headers;
    }

    if (body) {
      params.body = body;
    }

    return params;
  }
}
