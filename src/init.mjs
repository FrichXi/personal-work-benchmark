import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export async function initBenchmark({
  taskId,
  templateDir = "templates/basic-web-task",
  outRoot = "benchmarks",
} = {}) {
  if (!taskId) {
    throw new Error("init requires a task id");
  }

  validateTaskId(taskId);

  const destination = path.join(outRoot, taskId);
  await mkdir(outRoot, { recursive: true });
  await cp(templateDir, destination, { recursive: true, errorOnExist: true, force: false });
  await replaceInTextFiles(destination, "basic-web-task", taskId);

  return { taskId, destination };
}

function validateTaskId(taskId) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(taskId)) {
    throw new Error("task id must use lowercase letters, numbers, and hyphens");
  }
}

async function replaceInTextFiles(directory, from, to) {
  const entries = await readdir(directory);

  for (const entry of entries) {
    const file = path.join(directory, entry);
    const info = await stat(file);

    if (info.isDirectory()) {
      await replaceInTextFiles(file, from, to);
      continue;
    }

    if (!isTextFile(file)) {
      continue;
    }

    const raw = await readFile(file, "utf8");
    await writeFile(file, raw.replaceAll(from, to));
  }
}

function isTextFile(file) {
  return [".csv", ".json", ".md", ".txt", ".yaml", ".yml"].includes(path.extname(file));
}
