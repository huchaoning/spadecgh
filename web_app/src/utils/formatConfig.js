export const formatConfig = ({ sigma, pixelSize, resX, resY, modes, algo }) => {
    return {
        global: {
            sigma,
            pixel_size: pixelSize,
            resolution: [resX, resY],
            algorithm: algo
        },
        modes: modes.map(mode => {
            const base = {
                type: mode.type,
                o1: mode.o1,
                o2: mode.o2,
                nx: mode.nx,
                ny: mode.ny,
                sx: mode.sx,
                sy: mode.sy,
            };

            if (mode.type === "PM") {
                return {
                    ...base,
                    children: {
                        plus: mode.plusModes.map(sub => ({
                            type: sub.type,
                            o1: sub.o1,
                            o2: sub.o2,
                            sx: sub.sx,
                            sy: sub.sy,
                        })),
                        minus: mode.minusModes.map(sub => ({
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