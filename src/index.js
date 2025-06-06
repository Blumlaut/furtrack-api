const https = require('https');


/**
 * FurtrackAPI provides methods to interact with the Furtrack API, including fetching posts, users, tags, albums, and thumbnails.
 * 
 * @class
 * @param {Object} [options] - Configuration options.
 * @param {string} [options.apiKey] - Optional API key for authenticated requests.
 * @param {Object} [options.headers] - Additional headers to include in requests.
 * 
 * @property {string} apiKey - The API key used for authentication.
 * @property {string} baseUrl - The base URL for the Furtrack API.
 * @property {Object} agent - HTTPS agent for custom TLS settings.
 * @property {Object} defaultHeaders - Default headers for all requests.
 * 
 * @static
 * @property {Object} TagTypes - Enum for tag types.
 * @property {Object} tagTypePrefixes - Mapping of tag prefixes to tag types.
 * 
 * @method setApiKey Sets the API key for authentication.
 * @param {string} apiKey - The API key to set.
 * 
 * @method setHeaders Sets additional headers for requests.
 * @param {Object} headers - Headers to merge with the default headers.
 * 
 * @method fetchJSON Fetches JSON data from a given API path.
 * @param {string} path - The API endpoint path.
 * @param {Object} [options] - Additional fetch options.
 * @returns {Promise<Object>} The parsed JSON response.
 * 
 * @method getTag Fetches information about a specific tag.
 * @param {string} tag - The tag to fetch.
 * @returns {Promise<Object>} Tag information.
 * 
 * @method getUser Fetches information about a specific user.
 * @param {string} username - The username to fetch.
 * @returns {Promise<Object>} User information.
 * 
 * @method getPost Fetches information about a specific post.
 * @param {string|number} postId - The post ID to fetch.
 * @returns {Promise<Object>} Post information.
 * 
 * @method getPostsByTag Fetches posts associated with a tag, with pagination.
 * @param {string} tag - The tag to search for.
 * @param {number} [page=0] - The page number for pagination.
 * @returns {Promise<Array>} Array of posts.
 * 
 * @method getPostsByUser Fetches posts by a specific user, with pagination.
 * @param {string} username - The username whose posts to fetch.
 * @param {number} [page=0] - The page number for pagination.
 * @returns {Promise<Array>} Array of posts.
 * 
 * @method getLikes Fetches posts liked by a user, with pagination.
 * @param {string} username - The username whose liked posts to fetch.
 * @param {number} [page=0] - The page number for pagination.
 * @returns {Promise<Array>} Array of liked posts.
 * 
 * @method getThumbnail Constructs the thumbnail URL for a post.
 * @param {string|number} postId - The post ID.
 * @returns {Promise<string>} The thumbnail URL.
 * 
 * @method getAlbum Fetches information about a user's album.
 * @param {string} username - The username.
 * @param {string|number} albumId - The album ID.
 * @returns {Promise<Object>} Album information.
 * 
 * @method parseTag Parses a tag string into its type and value.
 * @param {string} tagString - The tag string to parse.
 * @returns {Object} An object with `type` and `value` properties.
 * 
 * @static
 * @method getTagsByType Filters and extracts tag values by type.
 * @param {Array} tags - Array of tag objects with a `tagName` property.
 * @param {string} type - The tag type to filter by.
 * @returns {Array<string>} Array of tag values matching the type.
 */

class FurtrackAPI {
	constructor({ apiKey = undefined, headers = {} } = {}) {
		this.apiKey = apiKey;
		this.baseUrl = 'https://solar.furtrack.com';
		this.agent = new https.Agent({
			rejectUnauthorized: false,
			ciphers: 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384',
			honorCipherOrder: true,
			minVersion: 'TLSv1.2',
			maxVersion: 'TLSv1.3'
		});

		this.defaultHeaders = {
			"User-Agent": "furtrack-api/1.0 (https://github.com/blumlaut/furtrack-api)",
			"Accept": "application/json, text/plain, */*",
			"Referer": "https://www.furtrack.com/",
			"Origin": "https://www.furtrack.com",
			"Accept-Language": "en-US,en;q=0.5",
			...headers
		};

		if (this.apiKey) {
			this.defaultHeaders['Authorization'] = `Bearer ${this.apiKey}`;
		}
	}

	static TagTypes = {
		Character: 'character',
		Maker: 'maker',
		Photographer: 'photographer',
		Species: 'species',
		Event: 'event',
		General: 'general'
	};

	static tagTypePrefixes = {
		'1:': this.TagTypes.Character,
		'2:': this.TagTypes.Maker,
		'3:': this.TagTypes.Photographer,
		'5:': this.TagTypes.Event,
		'6': this.TagTypes.Species,

	};

	setApiKey(apiKey) {
		this.apiKey = apiKey;
		this.defaultHeaders['Authorization'] = `Bearer ${apiKey}`;
	}

	setHeaders(headers) {
		this.defaultHeaders = { ...this.defaultHeaders, ...headers };
	}

	async fetchJSON(path, options = {}) {
		const url = `${this.baseUrl}${path}`;
		const fetchOptions = {
			method: 'GET',
			agent: this.agent,
			headers: this.defaultHeaders,
			...options
		};
		const res = await fetch(url, fetchOptions);
		if (!res.ok) throw new Error(`HTTP error ${res.status}`);
		return res.json();
	}

	getTag(tag) {
		return this.fetchJSON(`/get/index/${encodeURIComponent(tag)}`);
	}

	getUser(username) {
		return this.fetchJSON(`/get/u/${encodeURIComponent(username)}`);
	}

	getPost(postId) {
		return this.fetchJSON(`/view/post/${encodeURIComponent(postId)}`);
	}

	// function to get posts from a tag with pagination support
	async getPostsByTag(tag, page = 0) {
		const response = await this.fetchJSON(`/get/tag/${encodeURIComponent(tag)}${page > 0 ? `/${page}` : ''}`);
		return response.posts || [];
	}

	async getPostsByUser(username, page = 0) {
		const response = await this.fetchJSON(`/view/album/${encodeURIComponent(username)}/3${page > 0 ? `/${page}` : ''}`);
		return response.posts || [];
	}

	// function to get user's liked posts with pagination support
	async getLikes(username, page = 0) {
		const response = await this.fetchJSON(`/view/album/${encodeURIComponent(username)}/o${page > 0 ? `/${page}` : ''}`);
		return response.posts || [];
	}
	
	async getThumbnail(postId) {
		const postData = await this.getPost(postId);
		return `https://orca2.furtrack.com/gallery/${postData.submitUserId}/${postData.id}-${postData.metaFingerprint}.${postData.metaFiletype}`;
	}

	getAlbum(username, albumId, page = 0) {
		return this.fetchJSON(`/view/album/${encodeURIComponent(username)}/${encodeURIComponent(albumId)}${page > 0 ? `/${page}` : ''}`);
	}

	parseTag(tagString) {
		return FurtrackAPI.parseTag(tagString);
	}

	static parseTag(tagString) {
		for (const [prefix, type] of Object.entries(this.tagTypePrefixes)) {
			if (tagString.startsWith(prefix)) {
				return { type, value: tagString.slice(prefix.length) };
			}
		}
		return { type: this.TagTypes.General, value: tagString };
	}


	static getTagsByType(tags, type) {
		return tags
			.map(tag => this.parseTag(tag.tagName))
			.filter(parsed => parsed.type === type)
			.map(parsed => parsed.value);
	}

}

module.exports = FurtrackAPI;