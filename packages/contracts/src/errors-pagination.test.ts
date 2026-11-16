import { describe, expect, it } from "vitest";
import { defaultErrorCode, isApiErrorBody, isValidationIssueList } from "./errors.js";
import { paginate, pageToOffset } from "./pagination.js";

describe("errors", () => {
  it("maps statuses to default codes", () => {
    expect(defaultErrorCode(404)).toBe("NOT_FOUND");
    expect(defaultErrorCode(422)).toBe("VALIDATION_FAILED");
    expect(defaultErrorCode(418)).toBe("HTTP_418");
  });

  it("recognises the standard error body", () => {
    const body = {
      error: {
        status: 404,
        code: "NOT_FOUND",
        message: "Not found",
        requestId: "r1",
        path: "/x",
        timestamp: "",
      },
    };
    expect(isApiErrorBody(body)).toBe(true);
    expect(isApiErrorBody({ error: "nope" })).toBe(false);
    expect(isApiErrorBody(null)).toBe(false);
    expect(isApiErrorBody({ message: "x" })).toBe(false);
  });

  it("recognises validation issue lists", () => {
    expect(isValidationIssueList([{ path: "name", message: "Required" }])).toBe(true);
    expect(isValidationIssueList(["name is required"])).toBe(false);
    expect(isValidationIssueList(undefined)).toBe(false);
  });
});

describe("pagination", () => {
  it("builds the list response with page totals", () => {
    expect(paginate(["a", "b"], 61, { page: 3, pageSize: 25 })).toEqual({
      items: ["a", "b"],
      meta: { page: 3, pageSize: 25, totalItems: 61, totalPages: 3 },
    });
  });

  it("reports one page for an empty list", () => {
    expect(paginate([], 0, { page: 1, pageSize: 25 }).meta.totalPages).toBe(1);
  });

  it("converts a page to skip/take", () => {
    expect(pageToOffset({ page: 3, pageSize: 25 })).toEqual({ skip: 50, take: 25 });
  });
});
