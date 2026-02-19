import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const target = document.getElementById('app');

// We use an 'if' check or a '!' (non-null assertion) 
// to satisfy the TypeScript compiler.
const app = mount(App, {
  target: target!, 
})

export default app