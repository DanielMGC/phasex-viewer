<script lang="ts">
  import type { PhasexDataCube } from '../../lib/data/PhasexDataCube.svelte';
  import { PhasexPalette } from '../../lib/PhasexPalette';
  import { SScanHelper } from '../../lib/SScanHelper';

  let { cube, gain = 1.0, row = 0 } = $props<{ 
      cube: PhasexDataCube | null; 
      gain?: number;
      row?: number; 
  }>();

  let canvas: HTMLCanvasElement;
  const colorMap = new PhasexPalette(); 

  $effect(() => {
    if (!canvas || !cube?.Meta || !cube.dataCube || cube.beamMeta.length === 0) return;
    if (cube.Meta.beamCount === 0 || cube.Meta.sampleCount === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const geo = SScanHelper.calculateGeometry(cube, width, height);
    if (!geo) return;

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    const imgData = ctx.createImageData(width, height);
    const buf = new Uint32Array(imgData.data.buffer);
    const sampleCount = cube.Meta.sampleCount;
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const hit = SScanHelper.getSampleForPixel(x, y, geo, sampleCount);

            if (hit) {
                // Uses the 'row' prop directly now
                const val = cube.getValue(hit.b, 0, row, hit.s);
                
                let rawAmp = Math.abs(val) * gain; 
                let paletteIdx = Math.floor(rawAmp / 256); 
                if (paletteIdx > 127) paletteIdx = 127;
                
                buf[y * width + x] = colorMap.palette[paletteIdx];
            }
        }
    }
    ctx.putImageData(imgData, 0, 0);
  });
</script>

<canvas bind:this={canvas} width={800} height={600}></canvas>

<style>
    canvas { 
        cursor: crosshair; 
        background: #000; 
        border: 1px solid #333;
        display: block;
    }
</style>