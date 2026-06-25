import { addRoute, createRouter, findRoute } from 'rou3';
import { serve } from 'srvx';
import { Client } from '@xhayper/discord-rpc';

const router = createRouter<{ type: string }>();

addRoute(router, 'POST', '/presence', { type: 'set-presence' });
addRoute(router, 'DELETE', '/presence', { type: 'delete-presence' });

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function handleError(message: string, statusCode = 404) {
    return new Response(message, {
        status: statusCode,
        headers: corsHeaders,
    });
}

let client: Client | undefined;
let status = false;

export async function initDiscord() {
    if (client && status) return true;

    try {
        if (!client) {
            client = new Client({
                clientId: '1229876151602905220',
            });

            client.on('ready', async () => {
                status = true;
            });
        }

        await client.login();

        return true;
    }
    catch {
        status = false;
        return false;
    }
}

interface DiscordPresenceBody {
    details: string;
    state: string;
    pilotCallsign?: string;
    atcCallsign?: string;
    startTimestamp?: string;
    appAsVatsimRadar: boolean;
}

serve({
    port: 8442,
    async fetch(request) {
        const path = request.url.split(':8442')[1];
        const method = request.method;

        if (method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        const route = findRoute<{ type: string }>(router, method, path);

        if (!route) {
            return new Response('not found', {
                status: 404,
                headers: corsHeaders,
            });
        }

        if (route.data.type === 'set-presence') {
            await initDiscord();

            if (status) {
                const body = await request.json() as DiscordPresenceBody;

                try {
                    await client?.user?.setActivity({
                        name: body.appAsVatsimRadar ? 'VATSIM Radar' : 'VATSIM',
                        details: body.details,
                        detailsUrl: body.pilotCallsign
                            ? `https://vatsim-radar.com/?pilot=${ body.pilotCallsign }`
                            : body.atcCallsign
                                ? `https://vatsim-radar.com/?atc=${ body.atcCallsign }`
                                : undefined,
                        state: body.state,
                        startTimestamp: body.startTimestamp ? new Date(body.startTimestamp) : undefined,
                    });

                    return new Response('ok', {
                        headers: corsHeaders,
                    });
                }
                catch {
                    return new Response('Something went wrong', {
                        status: 500,
                        headers: corsHeaders,
                    });
                }
            }
        }
        else if (route.data.type === 'delete-presence') {
            await client?.user?.clearActivity();
        }

        return handleError('Not found');
    },
});

initDiscord();
