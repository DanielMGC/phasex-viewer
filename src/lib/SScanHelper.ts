import type { PhasexDataCube } from './data/PhasexDataCube.svelte';

export interface SScanGeometry {
    originX: number;      // Virtual origin X in Canvas pixels
    originY: number;      // Virtual origin Y in Canvas pixels (usually negative if start > 0)
    scale: number;        // Pixels per mm
    minAngle: number;
    maxAngle: number;
    startRadius: number;  // Radius in mm where data begins
    endRadius: number;    // Radius in mm where data ends
    beamCount: number;
}

export class SScanHelper {
    
    /**
     * Calculates the scaling and positioning to fit the physical S-Scan into the canvas.
     */
    static calculateGeometry(cube: PhasexDataCube, canvasWidth: number, canvasHeight: number): SScanGeometry | null {
        const meta = cube.Meta;
        if (meta.beamCount === 0) return null;

        // 1. Calculate Physical Coordinates of the Wedge
        // We assume a Sector Scan (S-Scan) pivots around a single Exit Point defined by IndexOffset/ScanOffset
        // If IndexOffset varies per beam, this logic needs to be inside the loop, but usually S-Scan is fixed exit.
        
        const exitX = cube.beamMeta[0].indexOffset; // Physical Exit X (mm)
        const exitY = cube.beamMeta[0].scanOffset;  // Physical Exit Y (mm) usually 0

        const rStart = meta.sampleOrigin; // Start distance (mm) - Defines the "Convex Start"
        const rEnd = meta.sampleOrigin + meta.sampleLength; // End distance (mm)

        // Find the bounding box of the "Fan" in physical space
        let minPhyX = Number.MAX_VALUE;
        let maxPhyX = -Number.MAX_VALUE;
        let maxPhyY = -Number.MAX_VALUE; // Depth always grows positive downwards

        // Check 4 corners of the sector fan
        const angles = [meta.startAngle, meta.stopAngle];
        const radii = [rStart, rEnd];

        for (const angleDeg of angles) {
            const angleRad = (angleDeg * Math.PI) / 180;
            const sin = Math.sin(angleRad);
            const cos = Math.cos(angleRad);

            for (const r of radii) {
                // Physical formula: X = Exit + R*sin(theta), Y = Exit + R*cos(theta)
                const px = exitX + (r * sin);
                const py = exitY + (r * cos);

                if (px < minPhyX) minPhyX = px;
                if (px > maxPhyX) maxPhyX = px;
                if (py > maxPhyY) maxPhyY = py;
            }
        }
        
        // Add a tiny margin (e.g. 1mm)
        const margin = 1.0; 
        const totalWidthMm = (maxPhyX - minPhyX) + (margin * 2);
        const totalHeightMm = maxPhyY + margin; // Assuming Y starts at 0

        // 2. Calculate Scale to fit Canvas
        const scaleX = canvasWidth / totalWidthMm;
        const scaleY = canvasHeight / totalHeightMm;
        const scale = Math.min(scaleX, scaleY); // Maintain Aspect Ratio

        // 3. Calculate Virtual Origin in Canvas Pixels
        // We want 'minPhyX' to align with x=0 (plus margin)
        // CanvasX = (PhysicalX - minPhyX) * scale
        // Therefore, VirtualOriginX corresponds to PhysicalX = exitX
        
        const canvasOriginX = (exitX - minPhyX + margin) * scale;
        const canvasOriginY = (exitY + margin) * scale; // Usually close to 0 or top margin

        return {
            originX: canvasOriginX,
            originY: canvasOriginY,
            scale: scale,
            minAngle: Math.min(meta.startAngle, meta.stopAngle),
            maxAngle: Math.max(meta.startAngle, meta.stopAngle),
            startRadius: rStart,
            endRadius: rEnd,
            beamCount: meta.beamCount
        };
    }

    /**
     * Fast lookup: Converts Pixel (x,y) -> Beam Index & Sample Index
     */
    static getSampleForPixel(x: number, y: number, geo: SScanGeometry, sampleCount: number): {b: number, s: number} | null {
        
        // 1. Inverse Transform: Canvas Px -> Physical Coordinates relative to Exit Point
        const dx = (x - geo.originX) / geo.scale; // Physical X relative to exit
        const dy = (y - geo.originY) / geo.scale; // Physical Y relative to exit

        // 2. Cartesian -> Polar
        // R = Distance from Exit Point
        const r = Math.sqrt(dx*dx + dy*dy);
        
        // Check Radius bounds (This creates the "Convex Start" arc!)
        if (r < geo.startRadius || r > geo.endRadius) return null;

        // Theta = Angle
        let thetaRad = Math.atan2(dx, dy); 
        let thetaDeg = (thetaRad * 180) / Math.PI;

        // 3. Map to Beam Index
        // Check Angle bounds
        if (thetaDeg < geo.minAngle || thetaDeg > geo.maxAngle) return null;

        const span = geo.maxAngle - geo.minAngle;
        const beamPct = (thetaDeg - geo.minAngle) / span;
        const b = Math.floor(beamPct * (geo.beamCount - 1));

        // 4. Map to Sample Index
        // Sample 0 is at startRadius, Sample N is at endRadius
        const radiusSpan = geo.endRadius - geo.startRadius;
        const sampPct = (r - geo.startRadius) / radiusSpan;
        const s = Math.floor(sampPct * (sampleCount - 1));

        return { b, s };
    }

    static mapDepthToY(depthMm: number, geo: SScanGeometry): number {
        // Physical Y = Depth (assuming 0 is top)
        // Canvas Y = (PhysicalY * scale) + originY
        // Note: Check if originY includes the scanOffset logic. 
        // Based on calculateGeometry: canvasOriginY corresponds to physical Y = exitY (usually 0).
        // So this is a direct scaling.
        return (depthMm * geo.scale) + geo.originY;
    }
} 