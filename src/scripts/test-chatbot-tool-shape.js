import assert from 'assert';
import { searchPropertiesTool, toGeminiToolDeclarations } from '../modules/chatbot/property-search.tool.js';

const geminiTools = toGeminiToolDeclarations([searchPropertiesTool]);

assert.ok(Array.isArray(geminiTools), 'Expected Gemini tools to be returned as an array');
assert.equal(geminiTools.length, 1, 'Expected one Gemini tool declaration');
assert.ok(Array.isArray(geminiTools[0].functionDeclarations), 'Expected functionDeclarations array');
assert.equal(geminiTools[0].functionDeclarations[0].name, 'search_properties');
assert.ok(geminiTools[0].functionDeclarations[0].parametersJsonSchema, 'Expected JSON schema for parameters');
assert.equal(geminiTools[0].functionDeclarations[0].parametersJsonSchema.type, 'object');

console.log('Tool schema regression check passed');
