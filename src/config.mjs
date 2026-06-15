import { readFile } from "node:fs/promises";
import YAML from "yaml";

export async function readYaml(file) {
  const raw = await readFile(file, "utf8");
  return YAML.parse(raw);
}

export async function loadSuite(paths) {
  const benchmark = await readYaml(paths.benchmark);
  const models = await readYaml(paths.models);
  const runners = await readYaml(paths.runners);

  validateBenchmark(benchmark);
  validateModels(models);
  validateRunners(runners);

  return { benchmark, models, runners };
}

export function validateBenchmark(config) {
  const errors = [];

  if (!config?.task?.id) errors.push("task.id is required");
  if (!Number.isInteger(config?.task?.rounds) || config.task.rounds < 1) {
    errors.push("task.rounds must be a positive integer");
  }
  if (!config?.inputs?.prompt) errors.push("inputs.prompt is required");
  if (!config?.outputs?.root) errors.push("outputs.root is required");
  if (!Array.isArray(config?.outputs?.required_paths) || !config.outputs.required_paths.length) {
    errors.push("outputs.required_paths must contain at least one path");
  }
  if (!Array.isArray(config?.scoring?.dimensions) || !config.scoring.dimensions.length) {
    errors.push("scoring.dimensions must contain at least one dimension");
  }

  const total = config?.scoring?.dimensions?.reduce((sum, dimension) => {
    return sum + Number(dimension.points || 0);
  }, 0);

  if (Number(config?.scoring?.total) !== total) {
    errors.push(`scoring.total must equal dimension points (${total})`);
  }

  throwIfErrors("benchmark", errors);
}

export function validateModels(config) {
  const errors = [];
  const slugs = new Set();

  if (!Array.isArray(config?.models) || !config.models.length) {
    errors.push("models must contain at least one model");
  }

  for (const [index, model] of (config?.models || []).entries()) {
    if (!model.name) errors.push(`models[${index}].name is required`);
    if (!model.slug) errors.push(`models[${index}].slug is required`);
    if (!model.version) errors.push(`models[${index}].version is required`);
    if (!model.provider) errors.push(`models[${index}].provider is required`);
    if (model.slug && slugs.has(model.slug)) errors.push(`duplicate model slug: ${model.slug}`);
    slugs.add(model.slug);
  }

  throwIfErrors("models", errors);
}

export function validateRunners(config) {
  const errors = [];
  const allowed = new Set(["opencode", "claude-code", "custom-command"]);

  if (!Array.isArray(config?.runners) || !config.runners.length) {
    errors.push("runners must contain at least one runner");
  }

  for (const [index, runner] of (config?.runners || []).entries()) {
    if (!runner.name) errors.push(`runners[${index}].name is required`);
    if (!allowed.has(runner.type)) {
      errors.push(`runners[${index}].type must be one of ${Array.from(allowed).join(", ")}`);
    }
    if (!runner.command) errors.push(`runners[${index}].command is required`);
  }

  throwIfErrors("runners", errors);
}

function throwIfErrors(label, errors) {
  if (errors.length) {
    throw new Error(`${label} config is invalid:\n- ${errors.join("\n- ")}`);
  }
}
