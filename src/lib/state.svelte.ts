import { PhasexDataCube } from './data/PhasexDataCube.svelte';
import { PhasexDataCubeMeta } from './data/PhasexDataCubeMeta.svelte';

// Create a globally accessible reactive state
export const appState = $state({
    cube: new PhasexDataCube(new PhasexDataCubeMeta()),
    isLoading: false
});