import { execFileSync } from "node:child_process";
import { copyFileSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lock = JSON.parse(readFileSync(path.join(root, "package-lock.json"), "utf8"));
const productionTree = JSON.parse(
  execFileSync("npm", ["ls", "--omit=dev", "--all", "--json"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);

const packagesByNameAndVersion = new Map();
for (const [lockPath, metadata] of Object.entries(lock.packages ?? {})) {
  if (!lockPath) continue;
  const name = metadata.name ?? lockPath.split("node_modules/").at(-1);
  const key = `${name}@${metadata.version}`;
  const candidates = packagesByNameAndVersion.get(key) ?? [];
  candidates.push({ lockPath, metadata });
  packagesByNameAndVersion.set(key, candidates);
}

const dependencies = new Map();
function collectDependencies(node) {
  for (const [name, dependency] of Object.entries(node.dependencies ?? {})) {
    const key = `${name}@${dependency.version}`;
    if (!dependencies.has(key)) dependencies.set(key, dependency);
    collectDependencies(dependency);
  }
}
collectDependencies(productionTree);

function installedPackagePath(name, version) {
  const candidates = packagesByNameAndVersion.get(`${name}@${version}`) ?? [];
  for (const { lockPath } of candidates) {
    const fullPath = path.join(root, lockPath);
    try {
      const installed = JSON.parse(readFileSync(path.join(fullPath, "package.json"), "utf8"));
      if (installed.name === name && installed.version === version) return fullPath;
    } catch {
      // Optional packages for other operating systems may be in the lockfile but not installed.
    }
  }
  throw new Error(`Could not find installed production dependency ${name}@${version}. Run npm ci first.`);
}

const sections = [...dependencies.keys()].sort((a, b) => a.localeCompare(b)).map((key) => {
  const splitAt = key.lastIndexOf("@");
  const name = key.slice(0, splitAt);
  const version = key.slice(splitAt + 1);
  const metadata = (packagesByNameAndVersion.get(key) ?? [])[0]?.metadata;
  if (!metadata?.license) throw new Error(`No declared license in package-lock.json for ${key}.`);

  const packagePath = installedPackagePath(name, version);
  const licenseFiles = readdirSync(packagePath)
    .filter((file) => /^(license|licence|copying|notice)(?:[-._]|$)/i.test(file));
  const referencedLicense = metadata.license.match(/\bSEE LICENSE IN ([^ )]+)/i)?.[1];
  if (referencedLicense) licenseFiles.push(referencedLicense);
  if (/\bZlib\b/i.test(metadata.license) && name === "pako") {
    licenseFiles.push("lib/zlib/README");
  }
  const uniqueLicenseFiles = [...new Set(licenseFiles)].sort((a, b) => a.localeCompare(b));
  if (!uniqueLicenseFiles.length) throw new Error(`No top-level license or notice file found for ${key}.`);
  for (const file of uniqueLicenseFiles) {
    try {
      readFileSync(path.join(packagePath, file));
    } catch {
      throw new Error(`License expression for ${key} references missing file ${file}.`);
    }
  }

  const text = uniqueLicenseFiles.map((file) => {
    const contents = readFileSync(path.join(packagePath, file), "utf8").trim();
    return `#### ${file}\n\n` + "```text\n" + contents + "\n```";
  }).join("\n\n");
  const reviewFlag = /\b(OR|AND|SEE LICENSE)\b/i.test(metadata.license)
    ? " **Review license expression before release.**"
    : "";
  return `## ${name}@${version}\n\nDeclared license: ${metadata.license}.${reviewFlag}\n\n${text}`;
});

const report = [
  "# Third-party production dependency notices",
  "",
  "Generated from the production dependency tree and the checked-in package lockfile. Development-only dependencies are excluded. Regenerate after dependency changes with `npm run licenses:notices`.",
  "",
  `Production dependency packages: ${sections.length}.`,
  "",
  "This inventory reproduces the license and notice files shipped by installed production packages. License expressions that list alternatives or require a separate file are marked for manual review. Review this report before each release; it is not a legal determination.",
  "",
  sections.join("\n\n---\n\n"),
  "",
].join("\n");

writeFileSync(path.join(root, "public/THIRD_PARTY_NOTICES.txt"), report);
copyFileSync(path.join(root, "LICENSE"), path.join(root, "public/PROJECT_LICENSE.txt"));
console.log(`Wrote notices for ${sections.length} production packages and copied the project license into public/.`);
