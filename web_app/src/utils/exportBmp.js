import { Jimp } from "jimp";

export const exportBmp = async (pixels, width, height, fileName) => {
    const image = new Jimp({ width, height });

    for (let i = 0; i < pixels.length; i++) {
        const g = pixels[i];
        const offset = i * 4;

        image.bitmap.data[offset] = g;
        image.bitmap.data[offset + 1] = g;
        image.bitmap.data[offset + 2] = g;
        image.bitmap.data[offset + 3] = 255;
    }

    const buffer = await image.getBuffer("image/bmp");
    const blob = new Blob([buffer], { type: "image/bmp" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = (fileName.trim() || "untitled") + ".bmp";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 60);
};