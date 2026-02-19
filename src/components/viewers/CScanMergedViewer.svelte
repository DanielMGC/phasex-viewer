<script lang="ts">
  import type { PhasexDataCube } from '../../lib/data/PhasexDataCube.svelte';
  import { PhasexPalette } from '../../lib/PhasexPalette';
  import { SScanHelper } from '../../lib/SScanHelper';

  let { cube, gain = 1.0, sampleRangeMin = 0, sampleRangeMax = 50 } = $props<{ 
      cube: PhasexDataCube | null; 
      gain?: number;
      sampleRangeMin?: number;
      sampleRangeMax?: number;
  }>();

  let canvas: HTMLCanvasElement;
  const colorMap = new PhasexPalette(); 
  
  // Debounced State (Protects the render engine from UI lag)
  let calcRangeMin = $state(0);
  let calcRangeMax = $state(50);
  
  let isRendering = $state(false);
  let sScanHeight = 300; 

  // DEBOUNCER: Watch incoming props
  $effect(() => {
      const min = sampleRangeMin;
      const max = sampleRangeMax;

      const timer = setTimeout(() => {
          calcRangeMin = min;
          calcRangeMax = max;
      }, 150);

      return () => clearTimeout(timer);
  });

  // RENDER TRIGGER
  $effect(() => {
      if (!cube?.Meta || !cube.dataCube || cube.beamMeta.length === 0) return;
      generateCScanAsync(cube, calcRangeMin, calcRangeMax, gain);
  });

  // (Keep the exact same generateCScanAsync function here from the previous step)
  async function generateCScanAsync(currentCube: PhasexDataCube, minMM: number, maxMM: number, currentGain: number) {
      if (!canvas) return;
      isRendering = true;

      await new Promise(resolve => setTimeout(resolve, 0));
      const ctx = canvas.getContext('2d');
      if (!ctx) { isRendering = false; return; }

      const width = canvas.width;
      const height = canvas.height;

      const geo = SScanHelper.calculateGeometry(currentCube, height, height);
      if (!geo) { isRendering = false; return; }

      const gateY1 = Math.floor(SScanHelper.mapDepthToY(minMM, geo));
      const gateY2 = Math.floor(SScanHelper.mapDepthToY(maxMM, geo));

      const startY = Math.max(0, Math.min(gateY1, gateY2));
      const endY = Math.min(height, Math.max(gateY1, gateY2));

      const projectionMap: Array<{b: number, s: number}[]> = [];

      for (let x = 0; x < height; x++) {
          const pointsInColumn: {b: number, s: number}[] = [];
          for (let y = startY; y < endY; y++) {
              const hit = SScanHelper.getSampleForPixel(x, y, geo, currentCube.Meta.sampleCount);
              if (hit) pointsInColumn.push(hit);
          }
          projectionMap[x] = pointsInColumn;
      }

      await new Promise(resolve => setTimeout(resolve, 0));

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);

      const imgData = ctx.createImageData(width, height);
      const buf = new Uint32Array(imgData.data.buffer);
      const rowCount = currentCube.Meta.rowCount;
      const CHUNK_SIZE = 20; 

      for (let x = 0; x < width; x += CHUNK_SIZE) {
          for (let chunkX = x; chunkX < x + CHUNK_SIZE && chunkX < width; chunkX++) {
              const r = Math.floor((chunkX / width) * rowCount);
              if (r >= rowCount) continue;

              for (let y = 0; y < height; y++) {
                  const mapIdx = Math.floor((y / height) * projectionMap.length);
                  const pointsToCheck = projectionMap[mapIdx];

                  if (!pointsToCheck || pointsToCheck.length === 0) continue;

                  let maxVal = 0;
                  for (let i = 0; i < pointsToCheck.length; i++) {
                      const p = pointsToCheck[i];
                      const val = currentCube.getValue(p.b, 0, r, p.s);
                      const absVal = (val < 0) ? -val : val;
                      if (absVal > maxVal) maxVal = absVal;
                  }

                  let rawAmp = maxVal * currentGain; 
                  let paletteIdx = (rawAmp / 256) | 0; 
                  if (paletteIdx > 127) paletteIdx = 127;

                  buf[y * width + chunkX] = colorMap.palette[paletteIdx];
              }
          }
          await new Promise(resolve => setTimeout(resolve, 0));
      }

      ctx.putImageData(imgData, 0, 0);
      isRendering = false;
  }
</script>

<div class="canvas-container">
    {#if cube?.Meta}
        <canvas bind:this={canvas} width={cube.Meta.rowCount} height={sScanHeight}></canvas>
    {/if}
    
    {#if isRendering}
        <div class="loading-overlay">
            <span class="spinner"></span> Rendering...
        </div>
    {/if}
</div>

<style>
    .canvas-container { position: relative; width: 100%; max-width: 600px; display: block; }
    canvas { 
        background: #000; border: 1px solid #333; width: 100%;
        height: 300px; image-rendering: pixelated; display: block;
    }
    .loading-overlay {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.6); color: #4db8ff;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        font-family: sans-serif; font-weight: bold; border: 1px solid #333;
    }
    .spinner {
        width: 30px; height: 30px; border: 4px solid #333; border-top: 4px solid #4db8ff;
        border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 10px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
</style>