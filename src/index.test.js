
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

	describe('API methods', () => {
		beforeEach(() => {
			global.fetch = jest.fn();
		});
		afterEach(() => {
			jest.resetAllMocks();
		});

		test('getTag calls fetchJSON with correct path', async () => {
			api.fetchJSON = jest.fn().mockResolvedValue({ tag: 'data' });
			const result = await api.getTag('foo');
			expect(api.fetchJSON).toHaveBeenCalledWith('/get/index/foo');
			expect(result).toEqual({ tag: 'data' });
		});

		test('getUser calls fetchJSON with correct path', async () => {
			api.fetchJSON = jest.fn().mockResolvedValue({ user: 'data' });
			const result = await api.getUser('bar');
			expect(api.fetchJSON).toHaveBeenCalledWith('/get/u/bar');
			expect(result).toEqual({ user: 'data' });
		});

		test('getPost calls fetchJSON with correct path', async () => {
			api.fetchJSON = jest.fn().mockResolvedValue({ post: 'data' });
			const result = await api.getPost(123);
			expect(api.fetchJSON).toHaveBeenCalledWith('/view/post/123');
			expect(result).toEqual({ post: 'data' });
		});

		test('getPostsByTag returns posts array', async () => {
			api.fetchJSON = jest.fn().mockResolvedValue({ posts: [1, 2] });
			const result = await api.getPostsByTag('foo');
			expect(api.fetchJSON).toHaveBeenCalledWith('/get/tag/foo');
			expect(result).toEqual([1, 2]);
		});

		test('getPostsByTag returns empty array if no posts', async () => {
			api.fetchJSON = jest.fn().mockResolvedValue({});
			const result = await api.getPostsByTag('foo');
			expect(result).toEqual([]);
		});

		test('getPostsByUser returns posts array', async () => {
			api.fetchJSON = jest.fn().mockResolvedValue({ posts: [3, 4] });
			const result = await api.getPostsByUser('user', 2);
			expect(api.fetchJSON).toHaveBeenCalledWith('/view/album/user/3/2');
			expect(result).toEqual([3, 4]);
		});

		test('getLikes returns posts array', async () => {
			api.fetchJSON = jest.fn().mockResolvedValue({ posts: [5, 6] });
			const result = await api.getLikes('user', 1);
			expect(api.fetchJSON).toHaveBeenCalledWith('/view/album/user/o/1');
			expect(result).toEqual([5, 6]);
		});

		test('getThumbnail returns correct URL', async () => {
			api.getPost = jest.fn().mockResolvedValue({
				submitUserId: 42,
				id: 99,
				metaFingerprint: 'abc',
				metaFiletype: 'jpg'
			});
			const url = await api.getThumbnail(99);
			expect(url).toBe('https://orca2.furtrack.com/gallery/42/99-abc.jpg');
		});

		test('getAlbum calls fetchJSON with correct path', async () => {
			api.fetchJSON = jest.fn().mockResolvedValue({ album: 'data' });
			const result = await api.getAlbum('user', 'albumid');
			expect(api.fetchJSON).toHaveBeenCalledWith('/view/album/user/albumid');
			expect(result).toEqual({ album: 'data' });
		});
	});
});