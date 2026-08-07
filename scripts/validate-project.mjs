import { access, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const requiredFiles = [
  "index.html",
  "privacidad.html",
  "manifest.json",
  "sw.js",
  "robots.txt",
  "sitemap.xml",
  "README.md",
  "SECURITY.md",
  "LICENSE",
];

const errors = [];

for (const file of requiredFiles) {
  try {
    await access(path.join(root, file));
  } catch {
    errors.push(`Falta el archivo requerido: ${file}`);
  }
}

const htmlFiles = ["index.html", "privacidad.html"];
for (const file of htmlFiles) {
  const source = await readFile(path.join(root, file), "utf8");
  if (/\sstyle=/i.test(source)) errors.push(`${file} contiene estilos inline.`);

  const localReferences = [...source.matchAll(/(?:href|src)="([^"#]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => !/^(?:https?:|mailto:|tel:|data:)/.test(reference));

  for (const reference of localReferences) {
    const cleanReference = reference.split("?")[0];
    try {
      await access(path.join(root, cleanReference));
    } catch {
      errors.push(`${file} referencia un archivo inexistente: ${reference}`);
    }
  }
}

for (const file of [
  "manifest.json",
  "vercel.json",
  "n8n-guia-skills.json",
  "package.json",
]) {
  try {
    JSON.parse(await readFile(path.join(root, file), "utf8"));
  } catch (error) {
    errors.push(`${file} no contiene JSON válido: ${error.message}`);
  }
}

const workflowSource = await readFile(
  path.join(root, "n8n-guia-skills.json"),
  "utf8",
);
const workflow = JSON.parse(workflowSource);
const workflowChecks = [
  ["recursosPermitidos", "El workflow no limita los recursos permitidos."],
  ["consentimiento", "El workflow no valida el consentimiento."],
  [
    "saveDataSuccessExecution",
    "El workflow no desactiva los datos de ejecuciones exitosas.",
  ],
  [
    "saveDataErrorExecution",
    "El workflow no desactiva los datos de ejecuciones fallidas.",
  ],
];

for (const [needle, message] of workflowChecks) {
  if (!workflowSource.includes(needle)) errors.push(message);
}

const unsafeEmailNodes = workflow.nodes.filter(
  (node) =>
    node.type === "n8n-nodes-base.emailSend" &&
    (!node.parameters.html.includes(".json.nombreHtml }}") ||
      node.parameters.html.includes(".json.nombre }}")),
);
if (unsafeEmailNodes.length) {
  errors.push("Los correos del workflow deben insertar el nombre escapado.");
}

const classMaterial = path.join(
  root,
  "clases",
  "2026-07-18",
  "Mastering_AI_Context.pdf",
);
const classMaterialStats = await stat(classMaterial);
if (classMaterialStats.size > 5 * 1024 * 1024) {
  errors.push("El PDF de la clase supera el máximo recomendado de 5 MB.");
}
const classMaterialHeader = (await readFile(classMaterial)).subarray(0, 5);
if (classMaterialHeader.toString("ascii") !== "%PDF-") {
  errors.push("El material de la clase no tiene una cabecera PDF válida.");
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Estructura, referencias y configuración validadas.");
}
