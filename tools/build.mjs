// Compiles tools/styles.css with Tailwind (classes found in index.html) and
// writes the result into the <style id="tw"> block of index.html, so the page
// stays a single self-contained file.
//
// Run from the personal folder:  node tools/build.mjs
// Uses the Tailwind packages installed in ../website/node_modules.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "../website/package.json"));
const { compile, optimize } = require("@tailwindcss/node");
const { Scanner } = require("@tailwindcss/oxide");

const base = join(root, "tools");
// Point the Tailwind import at the website's copy, since this folder has no node_modules
const tailwind = require.resolve("tailwindcss/index.css").replaceAll("\\", "/");
const input = readFileSync(join(base, "styles.css"), "utf8").replace('@import "tailwindcss";', `@import "${tailwind}";`);
const compiler = await compile(input, { base, onDependency: () => {} });
const scanner = new Scanner({ sources: compiler.sources });
const css = optimize(compiler.build(scanner.scan()), { minify: true }).code;

const page = join(root, "index.html");
const html = readFileSync(page, "utf8");
const marker = /\/\* tw:start \*\/[\s\S]*?\/\* tw:end \*\//;
if (!marker.test(html)) throw new Error("tw:start / tw:end markers not found in index.html");
writeFileSync(page, html.replace(marker, () => `/* tw:start */${css}/* tw:end */`));
console.log(`Wrote ${(css.length / 1024).toFixed(1)} KB of CSS into index.html`);
