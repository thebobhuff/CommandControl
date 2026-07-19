import fs from "node:fs";
import path from "node:path";

const bump = process.argv[2];
const allowedBumps = new Set(["major", "minor", "patch"]);

if (!allowedBumps.has(bump)) {
  console.error("Usage: node scripts/semver.mjs <major|minor|patch>");
  process.exit(1);
}

const root = process.cwd();
const packagePath = path.join(root, "package.json");
const lockPath = path.join(root, "package-lock.json");
const changelogPath = path.join(root, "CHANGELOG.md");

const packageJson = readJson(packagePath);
const currentVersion = parseVersion(packageJson.version);
const nextVersion = bumpVersion(currentVersion, bump);

packageJson.version = nextVersion;
writeJson(packagePath, packageJson);

if (fs.existsSync(lockPath)) {
  const lockJson = readJson(lockPath);
  lockJson.version = nextVersion;
  if (lockJson.packages?.[""]) {
    lockJson.packages[""].version = nextVersion;
  }
  writeJson(lockPath, lockJson);
}

if (fs.existsSync(changelogPath)) {
  const today = new Date().toISOString().slice(0, 10);
  const changelog = fs.readFileSync(changelogPath, "utf8");
  const nextHeader = `## [${nextVersion}] - ${today}`;
  const updated = changelog.includes(nextHeader)
    ? changelog
    : changelog.replace(
        "## [Unreleased]",
        `## [Unreleased]\n\n### Added\n\n- Nothing yet.\n\n${nextHeader}`
      );
  fs.writeFileSync(changelogPath, updated);
}

console.log(`Bumped Commander Control from ${currentVersion.raw} to ${nextVersion}.`);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) {
    throw new Error(`Expected semantic version x.y.z, received ${value}`);
  }

  return {
    raw: value,
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function bumpVersion(version, bumpType) {
  if (bumpType === "major") {
    return `${version.major + 1}.0.0`;
  }
  if (bumpType === "minor") {
    return `${version.major}.${version.minor + 1}.0`;
  }
  return `${version.major}.${version.minor}.${version.patch + 1}`;
}
