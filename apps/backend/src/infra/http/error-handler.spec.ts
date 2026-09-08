import { describe, expect, it } from "vitest";
import { toHttpResponse } from "./error-handler";

describe("toHttpResponse", () => {
  it("maps @fastify/multipart's file-size-limit error to 413 FILE_TOO_LARGE", () => {
    const fastifyError = Object.assign(new Error("request file too large"), {
      code: "FST_REQ_FILE_TOO_LARGE",
    });

    const response = toHttpResponse(fastifyError);

    expect(response.status).toBe(413);
    expect(response.body).toMatchObject({ code: "FILE_TOO_LARGE" });
  });

  it("maps an unrecognized error to 500 INTERNAL_ERROR", () => {
    const response = toHttpResponse(new Error("boom"));
    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({ code: "INTERNAL_ERROR" });
  });
});
