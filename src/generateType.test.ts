import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { generateTypeFromJson } from "./generateType";

const TEST_OUTPUT_DIR = path.resolve(__dirname, "../.test-types");

function cleanup() {
  if (fs.existsSync(TEST_OUTPUT_DIR)) {
    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
  }
}

beforeEach(() => {
  cleanup();
  vi.stubEnv("NODE_ENV", "development");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("generateTypeFromJson", () => {
  it("should do nothing in production mode", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await generateTypeFromJson("Noop", { id: 1 }, TEST_OUTPUT_DIR);

    expect(fs.existsSync(path.join(TEST_OUTPUT_DIR, "Noop.ts"))).toBe(false);
  });

  it("should generate a type file for a flat object", async () => {
    const data = { id: 1, name: "Alice", active: true };

    await generateTypeFromJson("FlatUser", data, TEST_OUTPUT_DIR);

    const filePath = path.join(TEST_OUTPUT_DIR, "FlatUser.ts");
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("export interface FlatUser");
    expect(content).toContain("active");
    expect(content).toContain("id");
    expect(content).toContain("name");
  });

  it("should generate nested interfaces for nested objects", async () => {
    const data = {
      id: 1,
      address: { street: "123 Main", city: "Springfield" },
    };

    await generateTypeFromJson("Nested", data, TEST_OUTPUT_DIR);

    const content = fs.readFileSync(
      path.join(TEST_OUTPUT_DIR, "Nested.ts"),
      "utf-8"
    );
    expect(content).toContain("export interface Nested");
    expect(content).toContain("export interface Address");
    expect(content).toContain("street");
    expect(content).toContain("city");
  });

  it("should handle arrays correctly", async () => {
    const data = { tags: ["a", "b"], scores: [1, 2, 3] };

    await generateTypeFromJson("WithArrays", data, TEST_OUTPUT_DIR);

    const content = fs.readFileSync(
      path.join(TEST_OUTPUT_DIR, "WithArrays.ts"),
      "utf-8"
    );
    expect(content).toContain("export interface WithArrays");
    expect(content).toContain("string[]");
    expect(content).toContain("number[]");
  });

  it("should skip regeneration when structure is unchanged", async () => {
    const data = { id: 1, name: "Alice" };
    const consoleSpy = vi.spyOn(console, "log");

    await generateTypeFromJson("Cached", data, TEST_OUTPUT_DIR);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Generated type "Cached"')
    );

    consoleSpy.mockClear();
    await generateTypeFromJson("Cached", data, TEST_OUTPUT_DIR);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Skipped "Cached"')
    );

    consoleSpy.mockRestore();
  });

  it("should regenerate when structure changes", async () => {
    const consoleSpy = vi.spyOn(console, "log");

    await generateTypeFromJson("Evolving", { id: 1 }, TEST_OUTPUT_DIR);
    const firstContent = fs.readFileSync(
      path.join(TEST_OUTPUT_DIR, "Evolving.ts"),
      "utf-8"
    );

    consoleSpy.mockClear();
    await generateTypeFromJson(
      "Evolving",
      { id: 1, name: "Bob" },
      TEST_OUTPUT_DIR
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Generated type "Evolving"')
    );

    const secondContent = fs.readFileSync(
      path.join(TEST_OUTPUT_DIR, "Evolving.ts"),
      "utf-8"
    );
    expect(secondContent).not.toEqual(firstContent);
    expect(secondContent).toContain("name");

    consoleSpy.mockRestore();
  });

  it("should skip when only values change but structure stays the same", async () => {
    const consoleSpy = vi.spyOn(console, "log");

    await generateTypeFromJson(
      "StableShape",
      { id: 1, name: "Alice" },
      TEST_OUTPUT_DIR
    );

    consoleSpy.mockClear();
    await generateTypeFromJson(
      "StableShape",
      { id: 999, name: "Bob" },
      TEST_OUTPUT_DIR
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Skipped "StableShape"')
    );

    consoleSpy.mockRestore();
  });

  it("should create the output directory if it does not exist", async () => {
    const deepDir = path.join(TEST_OUTPUT_DIR, "deep", "nested", "dir");
    expect(fs.existsSync(deepDir)).toBe(false);

    await generateTypeFromJson("DeepDir", { id: 1 }, deepDir);

    expect(fs.existsSync(deepDir)).toBe(true);
    expect(fs.existsSync(path.join(deepDir, "DeepDir.ts"))).toBe(true);

    fs.rmSync(TEST_OUTPUT_DIR, { recursive: true });
  });

  it("should handle null values", async () => {
    const data = { id: 1, nickname: null };

    await generateTypeFromJson("WithNull", data, TEST_OUTPUT_DIR);

    const content = fs.readFileSync(
      path.join(TEST_OUTPUT_DIR, "WithNull.ts"),
      "utf-8"
    );
    expect(content).toContain("export interface WithNull");
  });

  it("should handle empty arrays", async () => {
    const data = { id: 1, items: [] };

    await generateTypeFromJson("EmptyArr", data, TEST_OUTPUT_DIR);

    const content = fs.readFileSync(
      path.join(TEST_OUTPUT_DIR, "EmptyArr.ts"),
      "utf-8"
    );
    expect(content).toContain("export interface EmptyArr");
  });
});
