export const getExternalAuthUrl = (navigationUrl: string): string | undefined => {
    try {
        const url = new URL(navigationUrl);

        if (url.origin !== new URL(process.env.VITE_DOMAIN!).origin ||
            !['/api/auth/vatsim/redirect', '/api/auth/navigraph/redirect'].includes(url.pathname)) {
            return;
        }

        url.searchParams.set('app', '1');
        // Desktop callbacks must end in "-app", rather than "-app-iframe".
        url.searchParams.delete('iframe');
        return url.toString();
    }
    catch {
        return;
    }
};

export const getVatsimAuthUrl = (deepLink: string): string | undefined => {
    try {
        const url = new URL(deepLink);

        if (url.protocol !== 'vatsim-radar:' || url.hostname || url.pathname !== '/auth/vatsim') {
            return;
        }

        const authUrl = new URL('/api/auth/vatsim', process.env.VITE_DOMAIN!);
        authUrl.search = url.search;
        authUrl.searchParams.set('webview', '1');
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
