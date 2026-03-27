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
 * @method getTags Fetches all tags from FurTrack.
 * @returns {Promise<Object>} Tags data with success flag and tags array.
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
			"User-Agent": `furtrack-api/${require('../package.json').version} (https://github.com/blumlaut/furtrack-api) Mozilla/5.0 (compatible; FurtrackAPI/${require('../package.json').version}`,
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
		'6:': this.TagTypes.Species,

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

	getTags() {
		return this.fetchJSON(`/get/tags/all`);
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

	async getPostsByTag(tag, page = 0) {
		const response = await this.fetchJSON(`/view/index/${encodeURIComponent(tag)}${page > 0 ? `/${page}` : ''}`);
		return response.posts || [];
	}

	async getPostsByUser(username, page = 0) {
		const response = await this.fetchJSON(`/view/album/${encodeURIComponent(username)}/3${page > 0 ? `/${page}` : ''}`);
		return response.posts || [];
	}

	async getLikes(username, page = 0) {
		const response = await this.fetchJSON(`/view/album/${encodeURIComponent(username)}/o${page > 0 ? `/${page}` : ''}`);
		return response.posts || [];
	}
	
	async getThumbnail(postId) {
		const postData = await this.getPost(postId);
		if (!postData.submitUserId || !postData.id || !postData.metaFingerprint || !postData.metaFiletype) {
			throw new Error('Missing required fields in postData for constructing thumbnail URL');
		}
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

	/**
	 * Fetches all character tags associated with a maker tag.
	 * Returns the full character metadata including tag counts and followers.
	 * 
	 * @param {string} makerTag - The maker tag (e.g., "wild_dog_works" or "maker:wild_dog_works").
	 * @returns {Promise<Array>} Array of character tag objects with metadata.
	 * 
	 * @example
	 * const characters = await api.getCharactersByMaker('wild_dog_works');
	 * // Returns: [{ tagName: '1:colby_(husky)', tagType: 1, tagTitle: 'Colby', ... }, ...]
	 */
	async getCharactersByMaker(makerTag) {
		// Normalize tag format
		if (!makerTag.startsWith('2:')) {
			makerTag = `2:${makerTag}`;
		}
		const tagData = await this.getTag(makerTag.replace('2:', 'maker:'));
		return tagData.tagmeta?.tagChildrenFull || [];
	}

	/**
	 * Fetches all related tags for a character, including makers, species, and color tags.
	 * 
	 * @param {string} characterTag - The character tag (e.g., "colby_(husky)" or "character:colby_(husky)").
	 * @returns {Promise<Object>} Object with categorized related tags.
	 * @returns {Promise<Object>.makers} Array of maker tag values.
	 * @returns {Promise<Object>.species} Array of species tag values.
	 * @returns {Promise<Object>.colors} Array of color/general tag values.
	 * @returns {Promise<Object>.all} Array of all related tag names.
	 * 
	 * @example
	 * const related = await api.getRelatedTagsByCharacter('colby_(husky)');
	 * // Returns: { makers: ['wild_dog_works', 'pyrope_costumes'], species: ['husky'], colors: ['black', 'blue', ...], all: [...] }
	 */
	async getRelatedTagsByCharacter(characterTag) {
		// Normalize tag format
		if (!characterTag.startsWith('1:')) {
			characterTag = `1:${characterTag}`;
		}
		const tagData = await this.getTag(characterTag.replace('1:', 'character:'));
		const tagAlso = tagData.tagmeta?.tagAlso || [];
		
		return {
			makers: FurtrackAPI.getTagsByType(tagAlso.map(t => ({ tagName: t })), FurtrackAPI.TagTypes.Maker),
			species: FurtrackAPI.getTagsByType(tagAlso.map(t => ({ tagName: t })), FurtrackAPI.TagTypes.Species),
			colors: tagAlso.filter(t => !t.startsWith('1:') && !t.startsWith('2:') && !t.startsWith('3:') && !t.startsWith('5:') && !t.startsWith('6:')),
			all: tagAlso
		};
	}

	/**
	 * Fetches all makers associated with a character tag.
	 * 
	 * @param {string} characterTag - The character tag (e.g., "colby_(husky)" or "character:colby_(husky)").
	 * @returns {Promise<Array>} Array of maker tag values.
	 * 
	 * @example
	 * const makers = await api.getMakersByCharacter('colby_(husky)');
	 * // Returns: ['wild_dog_works', 'pyrope_costumes']
	 */
	async getMakersByCharacter(characterTag) {
		const related = await this.getRelatedTagsByCharacter(characterTag);
		return related.makers;
	}

}

module.exports = FurtrackAPI;