import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("foundation smoke", () => {
  it("resolves @/ path alias for lib/utils", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });
});
