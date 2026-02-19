// PhasexDataCubeMeta.svelte.ts
export class PhasexDataCubeMeta {
    // Just plain numbers - no $state() overhead
    rowCount: number = 0;
    columnCount: number = 0;
    sampleCount: number = 0;
    beamCount: number = 0;

    startAngle: number = 0;
    stopAngle: number = 0;
    angleResolution: number = 0;

    rowOrigin: number = 0;
    columnOrigin: number = 0;
    sampleOrigin: number = 0;

    rowLength: number = 0;
    columnLength: number = 0;
    sampleLength: number = 0;

    rowMicroSecs: number = 0;
    columnMicroSecs: number = 0;
    sampleMicroSecs: number = 0;
}