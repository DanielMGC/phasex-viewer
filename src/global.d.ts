// Tells TypeScript that importing any .dat file with ?url returns a string (the URL path)
declare module '*.dat?url' {
    const src: string;
    export default src;
}