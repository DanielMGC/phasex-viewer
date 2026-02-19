<script lang="ts">
  export let value = 0;
  export let precision = 2; // Default to 2 decimal places
  export let step = 0.1;    // Default step size
  export let min = -Infinity;
  export let max = Infinity;
  export let suffix = " mm";

  // Local state for what the user actually sees
  let displayValue = value.toFixed(precision) + " " + suffix;

  // Reactive statement to format value if it's changed from the outside
  $: {
    const formatted = value.toFixed(precision) + " " + suffix;
    if (displayValue !== formatted && document.activeElement !== inputRef) {
      displayValue = formatted;
    }
  }

  let inputRef:any;

  function handleInput(e:any) {
    // Extract numbers and decimal point
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(raw);
    
    if (!isNaN(parsed)) {
      value = Math.max(min, Math.min(max, parsed));
    }
  }

  function formatOnBlur() {
    // Re-apply the precision and suffix when the user stops typing
    displayValue = value.toFixed(precision) + " " + suffix;
  }

  function selectAll(e:any) {
    // Make editing easier by selecting the text on focus
    e.target.select();
  }
</script>

<input
  bind:this={inputRef}
  type="text"
  bind:value={displayValue}
  on:input={handleInput}
  on:blur={formatOnBlur}
  on:focus={selectAll}
/>