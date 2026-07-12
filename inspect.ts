import { INITIAL_MEMBERS } from './src/data';
const branches = new Set(INITIAL_MEMBERS.map(m => m.Branch));
console.log("Existing branches:", Array.from(branches));
console.log("Count:", INITIAL_MEMBERS.length);
