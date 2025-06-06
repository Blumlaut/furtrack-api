const { test, expect, describe, beforeEach } = require('@jest/globals');
const FurtrackAPI = require('./index');

describe('FurtrackAPI', () => {
	let api;

	beforeEach(() => {
		api = new FurtrackAPI();
	});

	test('constructor sets default values', () => {
		expect(api.apiKey).toBeUndefined();
		expect(api.baseUrl).toBe('https://solar.furtrack.com');
		expect(api.defaultHeaders['User-Agent']).toMatch(/furtrack-api/);
	});

	test('constructor sets apiKey and Authorization header', () => {
		const api2 = new FurtrackAPI({ apiKey: 'abc123' });
		expect(api2.apiKey).toBe('abc123');
		expect(api2.defaultHeaders.Authorization).toBe('Bearer abc123');
	});

	test('setApiKey updates apiKey and Authorization header', () => {
		api.setApiKey('newkey');
		expect(api.apiKey).toBe('newkey');
		expect(api.defaultHeaders.Authorization).toBe('Bearer newkey');
	});

	test('setHeaders merges headers', () => {
		api.setHeaders({ 'X-Test': 'foo' });
		expect(api.defaultHeaders['X-Test']).toBe('foo');
		expect(api.defaultHeaders['User-Agent']).toBeDefined();
	});

	describe('parseTag', () => {
		test('parses character tag', () => {
			const result = api.parseTag('1:Fluffy');
			expect(result).toEqual({ type: FurtrackAPI.TagTypes.Character, value: 'Fluffy' });
		});
		test('parses maker tag', () => {
			const result = api.parseTag('2:MakerName');
			expect(result).toEqual({ type: FurtrackAPI.TagTypes.Maker, value: 'MakerName' });
		});
		test('parses photographer tag', () => {
			const result = api.parseTag('3:PhotoGuy');
			expect(result).toEqual({ type: FurtrackAPI.TagTypes.Photographer, value: 'PhotoGuy' });
		});
		test('parses event tag', () => {
			const result = api.parseTag('5:SomeEvent');
			expect(result).toEqual({ type: FurtrackAPI.TagTypes.Event, value: 'SomeEvent' });
		});
		test('parses species tag', () => {
			const result = api.parseTag('6Wolf');
			expect(result).toEqual({ type: FurtrackAPI.TagTypes.Species, value: 'Wolf' });
		});
		test('parses general tag', () => {
			const result = api.parseTag('randomtag');
			expect(result).toEqual({ type: FurtrackAPI.TagTypes.General, value: 'randomtag' });
		});
	});

	describe('getTagsByType', () => {
		test('filters and extracts tag values by type', () => {
			const tags = [
				{ tagName: '1:Alpha' },
				{ tagName: '2:Beta' },
				{ tagName: '1:Gamma' },
				{ tagName: 'random' }
			];
			const result = FurtrackAPI.getTagsByType(tags, FurtrackAPI.TagTypes.Character);
			expect(result).toEqual(['Alpha', 'Gamma']);
		});
		test('returns empty array if no tags match', () => {
			const tags = [{ tagName: '2:Beta' }];
			const result = FurtrackAPI.getTagsByType(tags, FurtrackAPI.TagTypes.Event);
			expect(result).toEqual([]);
		});
	});
});