import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import {
  quicktype,
  InputData,
  jsonInputForTargetLanguage,
} from "quicktype-core";

const HASH_DIR = ".clyf-cache";

function getHashPath(typesDir: string, typeName: string): string {
  const cacheDir = path.join(typesDir, HASH_DIR);
  return path.join(cacheDir, `${typeName}.hash`);
}

function computeStructureHash(json: unknown): string {
  const normalized = JSON.stringify(json, Object.keys(json as Record<string, unknown>).sort());
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function computeDeepStructureHash(json: unknown): string {
  const skeleton = extractSkeleton(json);
  const serialized = JSON.stringify(skeleton);
  return crypto.createHash("sha256").update(serialized).digest("hex");
}

function extractSkeleton(value: unknown): unknown {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (value.length === 0) return ["empty"];
    return [extractSkeleton(value[0])];
  }
  if (typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = extractSkeleton((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return typeof value;
}

function hasStructureChanged(
  typesDir: string,
  typeName: string,
  jsonData: unknown
): boolean {
  const hashPath = getHashPath(typesDir, typeName);
  const currentHash = computeDeepStructureHash(jsonData);

  if (fs.existsSync(hashPath)) {
    const previousHash = fs.readFileSync(hashPath, "utf-8").trim();
    return currentHash !== previousHash;
  }

  return true;
}

function saveHash(typesDir: string, typeName: string, jsonData: unknown): void {
  const cacheDir = path.join(typesDir, HASH_DIR);
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  const hashPath = getHashPath(typesDir, typeName);
  fs.writeFileSync(hashPath, computeDeepStructureHash(jsonData), "utf-8");
}

async function generateTypeString(
  typeName: string,
  jsonData: unknown
): Promise<string> {
  const jsonInput = jsonInputForTargetLanguage("typescript");
  await jsonInput.addSource({
    name: typeName,
    samples: [JSON.stringify(jsonData)],
  });

  const inputData = new InputData();
  inputData.addInput(jsonInput);

  const result = await quicktype({
    inputData,
    lang: "typescript",
    rendererOptions: {
      "just-types": "true",
      "runtime-typecheck": "false",
    },
    alphabetizeProperties: true,
  });

  return result.lines.join("\n");
}

export async function generateTypeFromJson(
  typeName: string,
  jsonData: unknown,
  typesDir: string = "./types"
): Promise<void> {
  if (process.env.NODE_ENV !== "development") return;

  const resolvedDir = path.resolve(typesDir);

  if (!hasStructureChanged(resolvedDir, typeName, jsonData)) {
    console.log(`[clyf] Skipped "${typeName}" — structure unchanged.`);
    return;
  }

  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
  }

  const typeContent = await generateTypeString(typeName, jsonData);
  const filePath = path.join(resolvedDir, `${typeName}.ts`);
  fs.writeFileSync(filePath, typeContent, "utf-8");

  saveHash(resolvedDir, typeName, jsonData);

  console.log(`[clyf] Generated type "${typeName}" → ${filePath}`);
}

export async function withType<T>(
  typeName: string,
  jsonData: unknown,
  typesDir?: string
): Promise<T> {
  await generateTypeFromJson(typeName, jsonData, typesDir);
  return jsonData as T;
}
