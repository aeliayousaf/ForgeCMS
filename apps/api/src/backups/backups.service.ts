import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { spawn } from "child_process";
import { promises as fs, createReadStream } from "fs";
import { join } from "path";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { SETTINGS_KEYS } from "@forgecms/shared";

const BACKUP_DIR = process.env.BACKUP_DIR ?? join(process.cwd(), "data", "backups");
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? join(process.cwd(), "data", "uploads");

function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port || "3306",
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ""),
  };
}

function run(cmd: string, args: string[], opts: { stdoutFile?: string } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { shell: false });
    if (opts.stdoutFile) {
      const out = require("fs").createWriteStream(opts.stdoutFile);
      child.stdout.pipe(out);
    }
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${stderr}`)),
    );
  });
}

@Injectable()
export class BackupsService {
  private readonly logger = new Logger("Backups");

  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  list() {
    return this.prisma.backup.findMany({ orderBy: { createdAt: "desc" } });
  }

  async create(type: "database" | "files" | "full") {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `forgecms-${type}-${stamp}.${type === "database" ? "sql" : "tar.gz"}`;
    const record = await this.prisma.backup.create({
      data: { filename, type, status: "pending" },
    });

    try {
      const target = join(BACKUP_DIR, filename);
      if (type === "database" || type === "full") {
        await this.dumpDatabase(type === "full" ? join(BACKUP_DIR, `db-${stamp}.sql`) : target);
      }
      if (type === "files" || type === "full") {
        await this.archiveFiles(type === "full" ? join(BACKUP_DIR, `files-${stamp}.tar.gz`) : target);
      }
      if (type === "full") {
        await run("tar", [
          "-czf",
          target,
          "-C",
          BACKUP_DIR,
          `db-${stamp}.sql`,
          `files-${stamp}.tar.gz`,
        ]);
        await fs.rm(join(BACKUP_DIR, `db-${stamp}.sql`), { force: true });
        await fs.rm(join(BACKUP_DIR, `files-${stamp}.tar.gz`), { force: true });
      }
      const stat = await fs.stat(target);
      return this.prisma.backup.update({
        where: { id: record.id },
        data: { status: "completed", size: Number(stat.size) },
      });
    } catch (err) {
      this.logger.error(`Backup failed: ${String(err)}`);
      return this.prisma.backup.update({
        where: { id: record.id },
        data: { status: "failed", error: String(err) },
      });
    }
  }

  private async dumpDatabase(target: string) {
    const db = parseDbUrl(process.env.DATABASE_URL ?? "");
    await run(
      "mysqldump",
      [
        "-h",
        db.host,
        "-P",
        db.port,
        "-u",
        db.user,
        `-p${db.password}`,
        "--single-transaction",
        "--quick",
        db.database,
      ],
      { stdoutFile: target },
    );
  }

  private async archiveFiles(target: string) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await run("tar", ["-czf", target, "-C", UPLOAD_DIR, "."]);
  }

  async streamFile(id: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) throw new NotFoundException("Backup not found");
    const path = join(BACKUP_DIR, backup.filename);
    await fs.access(path).catch(() => {
      throw new NotFoundException("Backup file missing on disk");
    });
    return { stream: createReadStream(path), filename: backup.filename };
  }

  async restore(id: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (!backup) throw new NotFoundException("Backup not found");
    if (backup.type !== "database") {
      throw new BadRequestException("Only database backups support automated restore in the MVP");
    }
    const db = parseDbUrl(process.env.DATABASE_URL ?? "");
    const sqlPath = join(BACKUP_DIR, backup.filename);
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        "mysql",
        ["-h", db.host, "-P", db.port, "-u", db.user, `-p${db.password}`, db.database],
        { shell: false },
      );
      createReadStream(sqlPath).pipe(child.stdin);
      let stderr = "";
      child.stderr.on("data", (d) => (stderr += d.toString()));
      child.on("error", reject);
      child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(stderr))));
    });
    return { ok: true };
  }

  async remove(id: string) {
    const backup = await this.prisma.backup.findUnique({ where: { id } });
    if (backup) {
      await fs.rm(join(BACKUP_DIR, backup.filename), { force: true });
      await this.prisma.backup.delete({ where: { id } });
    }
    return { ok: true };
  }

  // Daily scheduled backup when enabled in settings.
  @Cron("0 3 * * *")
  async scheduled() {
    const enabled = await this.settings.get(SETTINGS_KEYS.backupSchedule);
    if (enabled !== "daily") return;
    this.logger.log("Running scheduled daily backup");
    await this.create("full");
  }
}
