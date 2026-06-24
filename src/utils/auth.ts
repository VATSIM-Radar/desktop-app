export const getVatsimAuthUrl = (deepLink: string): string | undefined => {
    try {
        const url = new URL(deepLink);

        if (url.protocol !== 'vatsim-radar:' || url.hostname || url.pathname !== '/auth/vatsim') {
            return;
        }

        const authUrl = new URL('/api/auth/vatsim', process.env.VITE_DOMAIN!);
        authUrl.search = url.search;
        return authUrl.toString();
    }
    catch {
        return;
    }
};

export const getNavigraphAuthUrl = (deepLink: string): string | undefined => {
    try {
        const url = new URL(deepLink);

        if (url.protocol !== 'vatsim-radar:' || url.hostname || url.pathname !== '/auth/navigraph') {
            return;
        }

        const authUrl = new URL('/api/auth/navigraph', process.env.VITE_DOMAIN!);
        authUrl.search = url.search;
        authUrl.searchParams.set('webview', '1');
        return authUrl.toString();
    }
    catch {
        return;
    }
};