// PhasexDataCube.svelte.ts
import { PhasexDataCubeMeta } from './PhasexDataCubeMeta.svelte';
import { PhasexDataBeamMeta } from './PhasexDataBeamMeta.svelte';

export class PhasexDataCube {
    Meta: PhasexDataCubeMeta;
    beamMeta: PhasexDataBeamMeta[] = [];
    
    // The massive data array
    dataCube: Int16Array; 

    constructor(meta: PhasexDataCubeMeta) {
        this.Meta = meta;
        // Calculate total size once
        const size = meta.beamCount * meta.columnCount * meta.rowCount * meta.sampleCount;
        this.dataCube = new Int16Array(size);
    }

    getValue(b: number, c: number, r: number, s: number): number {
        const idx = (b * this.Meta.columnCount * this.Meta.rowCount * this.Meta.sampleCount) +
                    (c * this.Meta.rowCount * this.Meta.sampleCount) +
                    (r * this.Meta.sampleCount) + s;
        return this.dataCube[idx];
    }
}