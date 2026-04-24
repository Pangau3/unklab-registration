import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const SESSION_FILE = path.join(process.cwd(), ".dev-session.json");

function terminatePid(pid) {
  if (!pid) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], {
      stdio: "ignore",
      shell: false,
    });
    return;
  }

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return;
  }
}

function clearSessionFile() {
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }
}

function readSessionFile() {
  if (!fs.existsSync(SESSION_FILE)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
  } catch {
    clearSessionFile();
    return null;
  }
}

function describeKnownPorts() {
  if (process.platform !== "win32") {
    return [];
  }

  const netstatResult = spawnSync("netstat", ["-ano", "-p", "tcp"], {
    encoding: "utf8",
    shell: false,
  });

  if (netstatResult.status !== 0) {
    return [];
  }

  const interestingPorts = new Set([8081, 5173, 5174]);
  const listeners = [];

  for (const line of netstatResult.stdout.split(/\r?\n/)) {
    if (!line.includes("LISTENING")) {
      continue;
    }

    const parts = line.trim().split(/\s+/);
    const localAddress = parts[1] || "";
    const pid = Number(parts.at(-1));
    const port = Number(localAddress.split(":").at(-1));

    if (!interestingPorts.has(port) || !Number.isInteger(pid)) {
      continue;
    }

    listeners.push({ port, pid });
  }

  return listeners;
}

function main() {
  const session = readSessionFile();
  const pids = Array.isArray(session?.pids) ? session.pids : [];
  const launcherPid = Number.isInteger(session?.launcherPid) ? session.launcherPid : null;

  if (!launcherPid && pids.length === 0) {
    const listeners = describeKnownPorts();
    if (listeners.length === 0) {
      console.log("Tidak ada sesi dev yang tersimpan.");
      return;
    }

    console.log("Tidak ada sesi dev tersimpan, tetapi ada proses yang masih memakai port dev:");
    for (const listener of listeners) {
      console.log(`- port ${listener.port} dipakai PID ${listener.pid}`);
    }
    console.log("Tutup proses tersebut secara manual jika memang bukan sesi launcher terbaru.");
    return;
  }

  console.log("Menghentikan sesi dev tersimpan...");
  if (launcherPid && launcherPid !== process.pid) {
    terminatePid(launcherPid);
  }

  for (const processInfo of pids) {
    if (Number.isInteger(processInfo?.pid)) {
      terminatePid(processInfo.pid);
    }
  }

  clearSessionFile();
  console.log("Sesi dev berhasil dihentikan.");
}

main();
