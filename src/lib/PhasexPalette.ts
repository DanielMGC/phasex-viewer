export class PhasexPalette {
    palette: Uint32Array; // Stores 0xAABBGGRR for Canvas

    constructor() {
        this.palette = new Uint32Array(128);
        this.buildPalette();
    }

    private buildPalette() {
        const gradients = [
            // r, g, b (start) -> r, g, b (end)
            { s: [255, 255, 255], e: [192, 217, 245] },
            { s: [188, 215, 244], e: [125, 178, 235] },
            { s: [121, 175, 234], e: [73, 121, 201] },
            { s: [71, 117, 198], e: [28, 57, 157] },
            { s: [25, 53, 154], e: [16, 48, 130] },
            { s: [18, 52, 130], e: [46, 112, 128] },
            { s: [48, 116, 128], e: [86, 170, 117] },
            { s: [91, 172, 114], e: [166, 204, 71] },
            { s: [171, 206, 68], e: [246, 237, 25] },
            { s: [252, 240, 23], e: [234, 191, 56] },
            { s: [233, 188, 58], e: [216, 140, 91] },
            { s: [215, 136, 94], e: [208, 120, 78] },
            { s: [208, 120, 76], e: [204, 115, 43] },
            { s: [204, 114, 40], e: [190, 92, 24] },
            { s: [189, 89, 24], e: [165, 48, 26] },
            { s: [164, 45, 27], e: [140, 3, 29] }
        ];

        let offset = 0;
        const steps = 8; // 16 gradients * 8 steps = 128 colors

        for (const grad of gradients) {
            this.generateGradient(offset, steps, grad.s, grad.e);
            offset += steps;
        }
    }

    private generateGradient(offset: number, steps: number, start: number[], end: number[]) {
        const rInc = (end[0] - start[0]) / steps;
        const gInc = (end[1] - start[1]) / steps;
        const bInc = (end[2] - start[2]) / steps;

        for (let i = 0; i < steps; i++) {
            const r = Math.round(start[0] + (i * rInc));
            const g = Math.round(start[1] + (i * gInc));
            const b = Math.round(start[2] + (i * bInc));
            
            // ABGR format for little-endian Uint32Array
            this.palette[offset + i] = (255 << 24) | (b << 16) | (g << 8) | r;
        }
    }
}