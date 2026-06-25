import { defineConfig, loadEnv } from 'vite';

/** @type {import('vite').UserConfig} */
export default ({ mode }) => {
    // Load app-level env vars to node-level env vars.
    const env = loadEnv(mode, process.cwd());
    process.env = { ...process.env, ...env };

    return defineConfig({
        define: {
            'process.env.VITE_DOMAIN': JSON.stringify(env.VITE_DOMAIN),
        },
    });
};
