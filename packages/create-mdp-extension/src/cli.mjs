// cli.mjs: parse argv, gather inputs (flags win; otherwise prompt or default),
// derive the identifier set, and scaffold the chosen template. Returns a status
// code; never calls process.exit (the bin does that) so it stays testable.

import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { deriveNames, TYPES } from "./naming.mjs";
import { scaffold } from "./scaffold.mjs";

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const VERSION = "0.2.0"; // kept in step with package.json

const LICENSES = ["mit", "apache-2.0"];
const LICENSE_SPDX = { mit: "MIT", "apache-2.0": "Apache-2.0" };

const USAGE = `create-mdp-extension - scaffold an MDP block or artifact extension.

Usage:
  npm create mdp-extension <name> [-- options]
  npx create-mdp-extension <name> [options]

Options:
  --type <block|artifact>     Kind of extension (default: block)
  --license <mit|apache-2.0>  License for the package (default: mit)
  --author <name>             Author written into package.json + LICENSE
  --dir <path>                Target directory (default: ./<package-name>)
  --year <YYYY>               LICENSE copyright year (default: placeholder <YEAR>)
  --scope <@scope>            Publish as @scope/mdp-<type>-<name>
  -y, --yes                   Non-interactive: take flags/defaults, never prompt
  --force                     Write into a non-empty target directory
  -h, --help                  Show this help
  -V, --version               Show version

Examples:
  npm create mdp-extension tag-list
  npx create-mdp-extension card -- --type artifact --license apache-2.0
`;

export async function main(argv) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        type: { type: "string" },
        license: { type: "string" },
        author: { type: "string" },
        dir: { type: "string" },
        year: { type: "string" },
        scope: { type: "string" },
        yes: { type: "boolean", short: "y", default: false },
        force: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        version: { type: "boolean", short: "V", default: false },
      },
    });
  } catch (err) {
    process.stderr.write(`${err.message}\n\n${USAGE}`);
    return 1;
  }

  const { values, positionals } = parsed;

  if (values.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (values.version) {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  // Non-interactive when explicitly asked, or when there is no TTY (CI, pipes,
  // the acceptance test): take flags + defaults and never block on a prompt.
  const nonInteractive = values.yes || !process.stdin.isTTY;

  let rl = null;
  const ask = async (question, fallback) => {
    if (nonInteractive) return fallback;
    if (!rl) {
      rl = createInterface({ input: process.stdin, output: process.stdout });
    }
    const answer = (await rl.question(question)).trim();
    return answer || fallback;
  };

  try {
    let rawName = positionals[0];
    if (!rawName) rawName = await ask("Extension name: ", "");
    rawName = String(rawName || "").trim();
    if (!rawName) {
      process.stderr.write("An extension name is required.\n");
      return 1;
    }

    let type = values.type || (await ask("Type [block|artifact] (block): ", "block"));
    type = type.toLowerCase();
    if (!TYPES.includes(type)) {
      process.stderr.write(`Unknown type "${type}". Use one of: ${TYPES.join(", ")}.\n`);
      return 1;
    }

    let license = values.license || (await ask("License [mit|apache-2.0] (mit): ", "mit"));
    license = license.toLowerCase();
    if (!LICENSES.includes(license)) {
      process.stderr.write(
        `Unknown license "${license}". Use one of: ${LICENSES.join(", ")}.\n`
      );
      return 1;
    }

    let author = values.author;
    if (author == null) author = await ask("Author (Your Name): ", "");

    let names;
    try {
      names = deriveNames({ rawName, type, scope: values.scope || "" });
    } catch (err) {
      process.stderr.write(`${err.message}\n`);
      return 1;
    }

    const target = values.dir
      ? isAbsolute(values.dir)
        ? values.dir
        : resolve(process.cwd(), values.dir)
      : resolve(process.cwd(), names.dirName);

    // Closed placeholder set. Longer keys are never substrings of shorter ones,
    // so order is for readability, not correctness.
    const tokens = [
      ["__PACKAGE_NAME__", names.packageName],
      ["__SLUG__", names.slug],
      ["__PASCAL__", names.Pascal],
      ["__RENDER_FN__", names.renderFn],
      ["__STYLE_CONST__", names.styleConst],
      ["__CSS_CLASS__", names.cssClass],
      ["__NODE_TYPE__", names.nodeType],
      ["__FENCE__", names.fence],
      ["__KEYWORD__", names.keyword],
      ["__TYPE__", names.type],
      ["__AUTHOR__", (author && author.trim()) || "Your Name"],
      ["__YEAR__", (values.year && values.year.trim()) || "<YEAR>"],
      ["__LICENSE_ID__", LICENSE_SPDX[license]],
    ];

    let written;
    try {
      written = scaffold({
        templateDir: join(PKG_ROOT, "templates", type),
        target,
        tokens,
        license,
        force: values.force,
      });
    } catch (err) {
      process.stderr.write(`${err.message}\n`);
      return 1;
    }

    process.stdout.write(`\nCreated ${names.packageName} (${type}) in ${target}\n`);
    for (const f of written) process.stdout.write(`  ${f}\n`);
    process.stdout.write(
      `\nNext:\n  cd ${target}\n  npm test\n  npm run demo   # writes dist/preview.html\n`
    );
    return 0;
  } finally {
    if (rl) await rl.close();
  }
}
