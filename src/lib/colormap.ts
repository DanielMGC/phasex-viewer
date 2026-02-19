export function createJetPalette(gain: number = 1): Uint32Array {
    const palette = new Uint32Array(256);
    
    for (let i = 0; i < 256; i++) {
        let r = 0, g = 0, b = 0;
        
        // Classic "Jet" / Ultrasound scheme
        // 0-31: Black/Dark Blue (Background)
        // 32-127: Blue to Cyan to Green
        // 128-255: Yellow to Red to White

        const val = i;
        
        if (val < 32) {
            // Thresholding noise (make bottom 12% transparent or black)
            r=0; g=0; b=0; 
        } else if (val < 96) {
            // Blue -> Cyan
            r=0; 
            g=Math.floor(255 * (val-32)/64); 
            b=255;
        } else if (val < 160) {
            // Cyan -> Yellow
            r=Math.floor(255 * (val-96)/64); 
            g=255; 
            b=Math.floor(255 * (1 - (val-96)/64));
        } else if (val < 224) {
            // Yellow -> Red
            r=255; 
            g=Math.floor(255 * (1 - (val-160)/64)); 
            b=0;
        } else {
            // Red -> White (Saturation)
            r=255; 
            g=Math.floor(255 * (val-224)/32); 
            b=Math.floor(255 * (val-224)/32);
        }

        // Store as 32-bit Integer (ABGR format for little-endian canvas)
        // Alpha is always 255 (fully opaque) unless it's the background
        const a = val < 20 ? 0 : 255; 
        palette[i] = (a << 24) | (b << 16) | (g << 8) | r;
    }
    return palette;
}