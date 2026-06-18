const config = {
    packagerConfig: {
        asar: true,
        osxSign: false,
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
    makers: [],
};


if (process.platform === 'darwin') {
    config.makers.push({
        name: '@electron-forge/maker-zip',
        platforms: ['darwin'],
        arch: ['universal'],
        config: {
            options: {
                level: 9
            }
        },
    });
} else if (process.platform === 'win32') {
    config.makers.push({
        name: '@electron-forge/maker-zip',
        platforms: ['win32'],
        config: {
            options: {
                level: 9
            }
        }
    });
} else if (process.platform === 'linux') {
    config.makers.push({
        name: '@reforged/maker-appimage',
        config: {
            compression: 'xz'
        },
    });
}

module.exports = config;