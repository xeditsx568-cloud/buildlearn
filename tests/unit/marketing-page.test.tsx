import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import MarketingHomePage from "@/app/(marketing)/page";

describe("marketing home page", () => {
  it("renders the marketing title", () => {
    const html = renderToStaticMarkup(<MarketingHomePage />);

    expect(html).toContain("BuildLearn");
  });
});
