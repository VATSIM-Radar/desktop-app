import type { App } from 'electron';
import { appendFileSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import * as path from 'node:path';

const maxAutoUpdaterLogBytes = 256 * 1024;

export type AutoUpdaterLogLevel = 'error' | 'info' | 'warn';

export const logAutoUpdate = (app: App, level: AutoUpdaterLogLevel, ...messages: unknown[]) => {
    try {
        const logsPath = app.getPath('logs');
        mkdirSync(logsPath, { recursive: true });
        const logPath = path.join(logsPath, 'auto-updater.log');
        const rotatedLogPath = `${ logPath }.1`;

        try {
            if (statSync(logPath).size >= maxAutoUpdaterLogBytes) {
                rmSync(rotatedLogPath, { force: true });
                renameSync(logPath, rotatedLogPath);
            }
        }
        catch {
            // Missing or locked log files should not prevent writing the next entry.
        }

        const line = [
            new Date().toISOString(),
            level.toUpperCase(),
            ...messages.map(message => message instanceof Error ? message.stack ?? message.message : JSON.stringify(message)),
        ].join(' ');

        appendFileSync(logPath, `${ line }\n`);
    }
    catch {
        // Update logging should never prevent the app from opening.
    }
};
