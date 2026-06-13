export const buildConfig = ({ sigma, pixelSize, resX, resY, modes }) => {
    return {
        global: {
            sigma: parseFloat(sigma),
            pixel_size: parseFloat(pixelSize),
            resolution: [parseInt(resX), parseInt(resY)]
        },
        modes: modes.map(mode => {
            const base = {
                type: mode.type,
                o1: parseInt(mode.o1) || 0,
                o2: parseInt(mode.o2) || 0,
                nx: parseFloat(mode.nx) || 0,
                ny: parseFloat(mode.ny) || 0,
                sx: parseFloat(mode.sx) || 0,
                sy: parseFloat(mode.sy) || 0,
            };

            if (mode.type === "PM") {
                return {
                    ...base,
                    children: {
                        plus: (mode.plusModes || []).map(sub => ({
                            type: sub.type,
                            o1: sub.o1,
                            o2: sub.o2,
                            sx: sub.sx,
                            sy: sub.sy,
                        })),
                        minus: (mode.minusModes || []).map(sub => ({
                            type: sub.type,
                            o1: sub.o1,
                            o2: sub.o2,
                            sx: sub.sx,
                            sy: sub.sy,
                        }))
                    }
                };
            }
            return base;
        })
    };
};