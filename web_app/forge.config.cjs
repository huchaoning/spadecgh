module.exports = {
    packagerConfig: {
        asar: true,
        ignore: (path) => {
            if (!path) return false;
            const allowedPaths = [
                '/dist',
                '/main.js',
                '/package.json',
            ];

            const isAllowed = allowedPaths.some(p => path.startsWith(p));
            if (path.startsWith('/node_modules')) return true;

            return !isAllowed;
        },
    },
    makers: [
        {
            name: '@electron-forge/maker-zip',
            platforms: ['win32'],
        },
    ],
};