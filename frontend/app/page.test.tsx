// TEMPORARY scaffold test: delete or replace when implementing the product.
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import Page from "./page";

test("renders the temporary application entry point", () => {
  expect(renderToStaticMarkup(createElement(Page))).toContain("<h1>ople</h1>");
});
