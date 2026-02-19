import { PhasexDataCube } from './PhasexDataCube.svelte';
import { PhasexDataBeamMeta } from './PhasexDataBeamMeta.svelte';
import { PhasexDataCubeMeta } from './PhasexDataCubeMeta.svelte';

export class PhasexDataCubeHelper {
    /**
     * Reads a .dat file directly using the browser's Stream API
     * This is the most memory-efficient way to load large binary files.
     */
    static async loadCubeFromStream(file: File): Promise<PhasexDataCube | null> {
        const stream = file.stream();
        const reader = stream.getReader();
        
        let cube: PhasexDataCube | null = null;
        let meta: PhasexDataCubeMeta | null = null;
        let accumulated = new Uint8Array(0);
        
        let isMetaRead = false;
        let currentBeam = 0;
        let isReadingBeamHeader = true; 
        let samplesReadInBeam = 0;

        try {
            while (true) {
                const { done, value } = await reader.read();
                
                if (value) {
                    // Combine leftover bytes with the new chunk
                    const next = new Uint8Array(accumulated.length + value.length);
                    next.set(accumulated);
                    next.set(value, accumulated.length);
                    accumulated = next;
                }

                let offset = 0;

                // 1. Parse Main Header (Exactly 112 bytes based on C# struct)
                if (!isMetaRead && accumulated.length >= 112) {
                    const view = new DataView(accumulated.buffer as ArrayBuffer, accumulated.byteOffset);
                    meta = new PhasexDataCubeMeta();
                    
                    // Match C# BinaryReader.ReadInt32() (4 bytes each)
                    meta.rowCount = view.getInt32(0, true);
                    meta.columnCount = view.getInt32(4, true);
                    meta.sampleCount = view.getInt32(8, true);
                    meta.beamCount = view.getInt32(12, true);

                    // Match C# BinaryReader.ReadDouble() (8 bytes each)
                    meta.startAngle = view.getFloat64(16, true);
                    meta.stopAngle = view.getFloat64(24, true);
                    meta.angleResolution = view.getFloat64(32, true);
                    
                    meta.rowOrigin = view.getFloat64(40, true);
                    meta.columnOrigin = view.getFloat64(48, true);
                    meta.sampleOrigin = view.getFloat64(56, true);
                    
                    meta.rowLength = view.getFloat64(64, true);
                    meta.columnLength = view.getFloat64(72, true);
                    meta.sampleLength = view.getFloat64(80, true);
                    
                    meta.rowMicroSecs = view.getFloat64(88, true);
                    meta.columnMicroSecs = view.getFloat64(96, true);
                    meta.sampleMicroSecs = view.getFloat64(104, true);

                    cube = new PhasexDataCube(meta);
                    
                    // Offset exactly 112 bytes for the remaining data
                    offset = 112; 
                    isMetaRead = true;
                }

                // 2. Parse Beams and Samples
                if (isMetaRead && cube && meta) {
                    const view = new DataView(accumulated.buffer as ArrayBuffer, accumulated.byteOffset);
                    
                    while (offset < accumulated.length && currentBeam < meta.beamCount) {
                        if (isReadingBeamHeader) {
                            if (accumulated.length - offset < 24) break; // Need 3 doubles
                            
                            cube.beamMeta.push(new PhasexDataBeamMeta(
                                view.getFloat64(offset, true),
                                view.getFloat64(offset + 8, true),
                                view.getFloat64(offset + 16, true)
                            ));
                            
                            offset += 24;
                            isReadingBeamHeader = false;
                            samplesReadInBeam = 0;
                        } else {
                            const totalSamplesPerBeam = meta.columnCount * meta.rowCount * meta.sampleCount;
                            const remainingInBeam = totalSamplesPerBeam - samplesReadInBeam;
                            const availableBytes = accumulated.length - offset;
                            const availableSamples = Math.floor(availableBytes / 2);
                            const toRead = Math.min(remainingInBeam, availableSamples);

                            if (toRead > 0) {
                                for (let i = 0; i < toRead; i++) {
                                    const val = view.getInt16(offset + (i * 2), true);
                                    
                                    // Map 1D index to the 4D flat structure
                                    const s = (samplesReadInBeam + i) % meta.sampleCount;
                                    const r = Math.floor((samplesReadInBeam + i) / meta.sampleCount) % meta.rowCount;
                                    const c = Math.floor((samplesReadInBeam + i) / (meta.sampleCount * meta.rowCount));
                                    
                                    const idx = (currentBeam * meta.columnCount * meta.rowCount * meta.sampleCount) +
                                                (c * meta.rowCount * meta.sampleCount) +
                                                (r * meta.sampleCount) + s;
                                    
                                    cube.dataCube[idx] = val;
                                }
                                offset += toRead * 2;
                                samplesReadInBeam += toRead;
                            }

                            if (samplesReadInBeam === totalSamplesPerBeam) {
                                isReadingBeamHeader = true;
                                currentBeam++;
                            } else {
                                break; // Chunk ended mid-beam
                            }
                        }
                    }
                }

                // Keep unprocessed bytes for the next chunk
                accumulated = accumulated.slice(offset);

                if (done) break;
            }
            return cube;
        } finally {
            reader.releaseLock();
        }
    }
}