<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from './lib/state.svelte';
  import { PhasexDataCubeHelper } from './lib/data/PhasexDataCubeHelper.svelte';
  import SScanViewer from './components/viewers/SScanViewer.svelte';
  import CScanMergedViewer from './components/viewers/CScanMergedViewer.svelte';

  // Import the file as a URL asset so Vite serves it correctly
  import scanFileUrl from './data/scans/DataAnalysis/PHASEXNDE.dat?url';
  // scans/DataAnalysis/PHASEXNDE.dat?url';

  // Hoisted states
  let gain = $state(5.0); // Increased default gain to 5.0 so colors pop immediately!
  let row = $state(0);
  let sampleRangeMin = $state(0);
  let sampleRangeMax = $state(50);
  
  let minDepth = $state(0);
  let maxDepth = $state(100);

  onMount(async () => {
    // ... (Keep your existing auto-load logic exactly the same)
    appState.isLoading = true;
    try {
      const response = await fetch(scanFileUrl);
      const blob = await response.blob();
      const file = new File([blob], "PHASEXNDE.dat");
      const cube = await PhasexDataCubeHelper.loadCubeFromStream(file);
      
      if (cube) {
        appState.cube = cube;
        minDepth = cube.Meta.sampleOrigin;
        maxDepth = cube.Meta.sampleOrigin + cube.Meta.sampleLength;
        sampleRangeMin = minDepth;
        sampleRangeMax = maxDepth;
      }
    } catch (err) {
      console.error(err);
    } finally {
      appState.isLoading = false;
    }
  });
</script>

<main class="app-layout">
  <aside class="sidebar">
    <div class="brand">
      <h2>Phasex Viewer</h2>
    </div>

    {#if appState.isLoading}
      <div class="loading">Loading binary file...</div>
    {:else if appState.cube && appState.cube.Meta}
      
      <div class="control-section">
        <h3>Global Settings</h3>
        <label>Gain: {gain.toFixed(1)}</label>
        <input 
            type="range" 
            min="0.1" 
            max="20" 
            step="0.1" 
            bind:value={gain} 
        />
      </div>

      <div class="control-section">
        <h3>S-Scan Controls</h3>
        <label>Row Index: {row} / {appState.cube.Meta.rowCount - 1}</label>
        <input type="range" min="0" max={appState.cube.Meta.rowCount - 1} step="1" bind:value={row} />
      </div>

      <div class="control-section">
        <h3>C-Scan Controls</h3>
        <label>Gate Min: {Number(sampleRangeMin).toFixed(1)} mm</label>
        <input type="range" min={minDepth} max={maxDepth} step="0.5" bind:value={sampleRangeMin} />

        <label style="margin-top: 10px;">Gate Max: {Number(sampleRangeMax).toFixed(1)} mm</label>
        <input type="range" min={minDepth} max={maxDepth} step="0.5" bind:value={sampleRangeMax} />
      </div>

    {/if}
  </aside>

  <section class="viewers-area">
    {#if appState.cube && appState.cube.Meta.beamCount > 0}
      <div class="viewers-grid">
        
        <div class="panel">
          <h3 class="panel-title">S-Scan (Side View)</h3>
          <SScanViewer cube={appState.cube} {row} {gain} />
        </div>

        <div class="panel">
          <h3 class="panel-title">C-Scan Merged (Top View)</h3>
          <CScanMergedViewer cube={appState.cube} {sampleRangeMin} {sampleRangeMax} {gain} />
        </div>

      </div>
    {/if}
  </section>
</main>

<style>
  :global(body) { margin: 0; background: #121212; color: #ddd; font-family: 'Segoe UI', sans-serif; overflow: hidden; }
  
  .app-layout {
    display: flex;
    height: 100vh;
    width: 100vw;
  }

  /* 20% Sidebar */
  .sidebar {
    width: 20%;
    min-width: 250px;
    background: #1e1e1e;
    border-right: 1px solid #333;
    padding: 20px;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 30px;
    overflow-y: auto;
  }

  .brand h2 { margin: 0; color: #4db8ff; font-size: 1.4rem; }
  
  .control-section {
    display: flex;
    flex-direction: column;
    background: #252525;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #3a3a3a;
  }
  
  .control-section h3 { margin: 0 0 15px 0; font-size: 1rem; color: #aaa; border-bottom: 1px solid #444; padding-bottom: 5px; }
  .control-section label { font-size: 0.85rem; color: #ccc; margin-bottom: 5px; }
  .control-section input[type=range] { width: 100%; cursor: pointer; }

  /* 80% Viewers Area */
  .viewers-area {
    flex: 1;
    background: #121212;
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto;
  }

  .viewers-grid {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .panel {
    background: #1a1a1a;
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
    border: 1px solid #2a2a2a;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .panel-title { margin: 0 0 10px 0; font-size: 1rem; color: #888; }
  .loading { color: #4db8ff; font-style: italic; }
</style>
<!--<script lang="ts">
  import { onMount } from 'svelte';
  import NumericInput from './components/NumericInput.svelte';

  let sideMin = -19.9;

  const increment = () => sideMin = Number.parseFloat((sideMin + 0.1).toFixed(2));
  const decrement = () => sideMin = Number.parseFloat((sideMin - 0.1).toFixed(2));
  
  let windowWidth:number;
  let windowHeight:number;

  const zipPattern = "^\\d{5}(-\\d{4})?$";
</script>

<svelte:window bind:innerWidth={windowWidth} bind:innerHeight={windowHeight} />

<div class="app-container">
  <aside class="sidebar">
    <NumericInput bind:value={sideMin} />
  </aside>

  <main class="content-area">
    
    <section class="graphic-row high-row">
      <div class="cell w30">Graphic 1 (30% Width)</div>
      <div class="cell w40">Graphic 2 (40% Width)</div>
    </section>

    <section class="graphic-row high-row">
      <div class="cell w30">Graphic 3 (30% Width)</div>
      <div class="cell w40">Graphic 4 (40% Width)</div>
    </section>

    <section class="list-row low-row">
      <header class="list-header">
        <span>ID</span><span>Status</span><span>Value</span><span>Timestamp</span>
      </header>
      <div class="list-content">
        <div class="list-item"><span>001</span><span>Active</span><span>89.2</span><span>12:00:01</span></div>
      </div>
    </section>

  </main>
</div>-->
