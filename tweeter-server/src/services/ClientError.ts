// Partially written by AI.

export class ClientError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "ClientError";
  }
}
