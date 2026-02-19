<script lang="ts">
  import type { PhasexDataCube } from '../../lib/data/PhasexDataCube.svelte';

  let { cube, column = 0, row = 0 } = $props<{
    cube: PhasexDataCube;
    column?: number;
    row?: number;
  }>();

  let canvas: HTMLCanvasElement;

  // We use $derived.by to reactively redraw when cube data or selection changes
  $effect(() => {
    if (!canvas || !cube.dataCube.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const beams = cube.meta.beamCount;
    const samples = cube.meta.sampleCount;

    // Set canvas internal dimensions to match data resolution
    canvas.width = beams;
    canvas.height = samples;

    const imgData = ctx.createImageData(beams, samples);

    for (let b = 0; b < beams; b++) {
      for (let s = 0; s < samples; s++) {
        // Use the indexing logic we established earlier
        const val = cube.getValue(b, column, row, s);
        
        // Simple normalization: map short (-32768 to 32767) to 0-255 grayscale
        // Adjust this math based on your specific signal range
        const intensity = ((val + 32768) / 65535) * 255;
        
        const pixelIdx = (s * beams + b) * 4;
        imgData.data[pixelIdx] = intensity;     // R
        imgData.data[pixelIdx + 1] = intensity; // G
        imgData.data[pixelIdx + 2] = intensity; // B
        imgData.data[pixelIdx + 3] = 255;       // A (Opaque)
      }
    }

    ctx.putImageData(imgData, 0, 0);
  });
</script>

<div class="viewer">
  <canvas bind:this={canvas}></canvas>
  <div class="info">
    Displaying Col: {column}, Row: {row}
  </div>
</div>

<style>
  .viewer {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #111;
    padding: 1rem;
    border-radius: 8px;
  }

  canvas {
    width: 100%; /* Stretch to container */
    max-width: 600px;
    height: auto;
    image-rendering: pixelated; /* Keeps the data sharp */
    border: 1px solid #444;
  }

  .info {
    color: #ccc;
    margin-top: 0.5rem;
    font-family: sans-serif;
  }
</style>