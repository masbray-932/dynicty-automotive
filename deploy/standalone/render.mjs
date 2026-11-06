import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({ options: {
  id: { type: "string" }, hostname: { type: "string" }, port: { type: "string" },
  output: { type: "string" }, "node-bin": { type: "string", default: "/usr/bin/node" },
  "release-base": { type: "string", default: "/srv/automotive" },
  "state-base": { type: "string", default: "/var/lib/automotive" },
  "config-base": { type: "string", default: "/etc/automotive" },
  "tls-cert": { type: "string" }, "tls-key": { type: "string" },
}, strict: true });

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function safeAbsolute(value, label) {
  check(value && value.startsWith("/") && !/[^a-zA-Z0-9._/-]/.test(value) &&
    path.posix.normalize(value) === value &&
    value.split("/").slice(1).every(segment => segment && segment !== "." && segment !== ".."),
  `${label} must be a normalized absolute path with safe characters.`);
  return value;
}

try {
  const { id, hostname, port, output } = values;
  check(id && !/[^a-z0-9-]/.test(id) && /^[a-z][a-z0-9-]{1,19}$/.test(id), "ID must be 2–20 lowercase letters, digits or hyphens, starting with a letter.");
  check(hostname && !/[^a-z0-9.-]/.test(hostname) && hostname.length <= 253 &&
    hostname.split(".").length > 1 &&
    hostname.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) &&
    /[a-z]/.test(hostname.split(".").at(-1)), "Use one lowercase DNS hostname, without a wildcard, port, or scheme.");
  check(port && String(Number(port)) === port && /^[1-9][0-9]{3,4}$/.test(port) && Number(port) >= 1024 && Number(port) <= 65535,
    "Use an unprivileged, unused loopback port.");
  check(output, "Specify a new output directory with --output.");
  const release = safeAbsolute(values["release-base"], "Release base");
  const state = safeAbsolute(values["state-base"], "State base");
  const config = safeAbsolute(values["config-base"], "Config base");
  const bases = [release, state, config];
  check(bases.every((x, i) => bases.every((y, j) => i === j || (x !== y && !y.startsWith(x + "/")))),
    "Release, state and config bases must be disjoint.");
  const tokens = {
    ID: id, HOST: hostname, HOST_REGEX: hostname.replaceAll(".", "\\."),
    PORT: port, DB: "auto_" + id.replaceAll("-", "_"),
    RELEASE: `${release}/${id}`, MEDIA: `${state}/${id}/uploads`, CONFIG: `${config}/${id}`,
    NODE: safeAbsolute(values["node-bin"], "Node executable"),
    CERT: safeAbsolute(values["tls-cert"], "TLS certificate"),
    KEY: safeAbsolute(values["tls-key"], "TLS private key"),
  };
  const pairs = [
    ["automotive.service.in", `automotive-${id}.service`],
    ["site.nginx.in", `automotive-${id}.conf`],
    ["default-reject.nginx", "default-reject.conf"],
    ["runtime.env.in", "runtime.env.example"],
  ];
  const results = await Promise.all(pairs.map(async ([source, destination]) => {
    const content = await readFile(new URL(source, import.meta.url), "utf8");
    return [destination, content.replace(/@([A-Z_]+)@/g, (_, key) => {
      check(Object.hasOwn(tokens, key), "Unknown template marker.");
      return tokens[key];
    })];
  }));
  await mkdir(output, { mode: 0o700 });
  for (const [name, content] of results) await writeFile(path.join(output, name), content, { flag: "wx", mode: 0o600 });
  console.info(`Rendered standalone templates for ${id}. No files were installed and no secrets were generated.`);
} catch (error) {
  console.error(error.code ? `Cannot render templates: ${error.code}` : error.message);
  process.exitCode = 1;
}
