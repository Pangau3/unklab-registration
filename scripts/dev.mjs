import fs from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";

const children = [];
let shuttingDown = false;
const SESSION_FILE = path.join(process.cwd(), ".dev-session.json");

function getProcessConfig(binary) {
  if (process.platform === "win32" && binary === "npm") {
    return {
      command: "cmd.exe",
      args: ["/d", "/s", "/c", "npm --prefix frontend run dev"],
    };
  }

  return {
    command: binary,
    args: binary === "npm" ? ["--prefix", "frontend", "run", "dev"] : ["run", "."],
  };
}

function startProcess(name, command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    shell: false,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: ["inherit", "pipe", "pipe"],
  });

  children.push(child);
  persistSession();

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`);
  });

  child.on("exit", (code) => {
    persistSession();

    if (shuttingDown) {
      return;
    }

    if (code !== 0) {
      console.error(`[${name}] process exited with code ${code}`);
      shutdown(code || 1);
      return;
    }

    console.log(`[${name}] process stopped`);
    shutdown(0);
  });

  return child;
}

function ensurePortAvailable(port) {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();

    tester.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        reject(new Error(buildPortConflictMessage(port)));
        return;
      }

      reject(error);
    });

    tester.once("listening", () => {
      tester.close(() => resolve());
    });

    tester.listen(port, "127.0.0.1");
  });
}

function buildPortConflictMessage(port) {
  const portOwner = getListeningProcessForPort(port);

  if (!portOwner) {
    return `Port ${port} sedang dipakai. Tutup proses lama sebelum menjalankan npm run dev.`;
  }

  return [
    `Port ${port} sedang dipakai oleh ${portOwner.name} (PID ${portOwner.pid}).`,
    "Tutup proses lama dulu, atau jalankan npm run stop:dev jika proses itu berasal dari launcher project ini.",
  ].join(" ");
}

function getListeningProcessForPort(port) {
  if (process.platform !== "win32") {
    return null;
  }

  const netstatResult = spawnSync("netstat", ["-ano", "-p", "tcp"], {
    encoding: "utf8",
    shell: false,
  });

  if (netstatResult.status !== 0) {
    return null;
  }

  const line = netstatResult.stdout
    .split(/\r?\n/)
    .find((entry) => entry.includes(`:${port}`) && entry.includes("LISTENING"));

  if (!line) {
    return null;
  }

  const parts = line.trim().split(/\s+/);
  const pid = Number(parts.at(-1));
  if (!Number.isInteger(pid)) {
    return null;
  }

  const tasklistResult = spawnSync(
    "tasklist",
    ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"],
    {
      encoding: "utf8",
      shell: false,
    }
  );

  let name = "proses tidak dikenal";
  if (tasklistResult.status === 0) {
    const firstLine = tasklistResult.stdout
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .find(Boolean);

    if (firstLine && !firstLine.startsWith("INFO:")) {
      name = firstLine.replace(/^"|"$/g, "").split('","')[0] || name;
    }
  }

  return { pid, name };
}

function waitForPortOpen(port, { host = "127.0.0.1", timeoutMs = 15000, intervalMs = 250 } = {}) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    function attemptConnection() {
      const socket = net.createConnection({ port, host });

      socket.once("connect", () => {
        socket.end();
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();

        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Backend di port ${port} belum siap setelah ${timeoutMs / 1000} detik.`));
          return;
        }

        setTimeout(attemptConnection, intervalMs);
      });
    }

    attemptConnection();
  });
}

function persistSession() {
  const activeChildren = children
    .filter((child) => child?.pid && child.exitCode === null)
    .map((child) => ({
      pid: child.pid,
      spawnfile: child.spawnfile,
      spawnargs: child.spawnargs,
    }));

  if (activeChildren.length === 0) {
    clearSessionFile();
    return;
  }

  fs.writeFileSync(
    SESSION_FILE,
    JSON.stringify(
      {
        launcherPid: process.pid,
        createdAt: new Date().toISOString(),
        pids: activeChildren,
      },
      null,
      2
    )
  );
}

function clearSessionFile() {
  if (!fs.existsSync(SESSION_FILE)) {
    return;
  }

  fs.unlinkSync(SESSION_FILE);
}

function cleanupPreviousSession() {
  if (!fs.existsSync(SESSION_FILE)) {
    return;
  }

  let session;
  try {
    session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
  } catch {
    clearSessionFile();
    return;
  }

  const pids = Array.isArray(session?.pids) ? session.pids : [];
  const launcherPid = Number.isInteger(session?.launcherPid) ? session.launcherPid : null;

  if (!launcherPid && pids.length === 0) {
    clearSessionFile();
    return;
  }

  console.log("Membersihkan sesi dev sebelumnya...");
  if (launcherPid && launcherPid !== process.pid) {
    terminatePid(launcherPid, true);
  }

  for (const processInfo of pids) {
    if (Number.isInteger(processInfo?.pid)) {
      terminatePid(processInfo.pid, true);
    }
  }
  clearSessionFile();
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  clearSessionFile();
  for (const child of children) {
    terminateChild(child);
  }

  setTimeout(() => {
    for (const child of children) {
      terminateChild(child, true);
    }
    process.exit(exitCode);
  }, 500);
}

function terminateChild(child, force = false) {
  if (!child || child.killed || child.exitCode !== null) {
    return;
  }

  terminatePid(child.pid, force);
}

function terminatePid(pid, force = false) {
  if (!pid) {
    return;
  }

  if (process.platform === "win32") {
    const taskkillArgs = ["/pid", String(pid), "/t"];
    if (force) {
      taskkillArgs.push("/f");
    }

    spawnSync("taskkill", taskkillArgs, {
      stdio: "ignore",
      shell: false,
    });
    return;
  }

  try {
    process.kill(pid, force ? "SIGTERM" : "SIGINT");
  } catch {
    return;
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

async function main() {
  cleanupPreviousSession();
  await ensurePortAvailable(8081);
  await ensurePortAvailable(5173);

  console.log("Starting backend Go on http://localhost:8081");
  const apiProcess = getProcessConfig("go");
  startProcess("api", apiProcess.command, apiProcess.args, {
    cwd: process.cwd(),
  });

  await waitForPortOpen(8081);
  console.log("Backend Go ready on http://localhost:8081");
  console.log("Starting frontend Vite on http://localhost:5173");

  const webProcess = getProcessConfig("npm");
  startProcess("web", webProcess.command, webProcess.args, {
    cwd: process.cwd(),
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
