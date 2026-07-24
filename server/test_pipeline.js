import { processWithGemini } from './ai_extractor.js';
import { initDatabase, getAllIncidents } from './db.js';

console.log('Testing MIIS Pipeline...');

initDatabase();

const incidents = getAllIncidents();
console.log(`[Database Test] Total seeded/stored incidents: ${incidents.length}`);

const testTweet = "CRITICAL: Live stranded humpback whale calf spotted near Pigeon Island, Trincomalee. Coordinates ~8.718, 81.205. Need DWC response team immediately!";
console.log(`\n[AI Extraction Test] Input Tweet:\n"${testTweet}"`);

const result = await processWithGemini(testTweet);
console.log('\n[Gemini AI Triage Result]:');
console.log(JSON.stringify(result, null, 2));

console.log('\nPipeline Test Complete!');
