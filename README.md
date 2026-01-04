# furtrack-api

An unofficial Node.js package for accessing the Furtrack API.

> ⚠️ **Warning**: This package was built by **reverse engineering the FurTrack frontend**, and it is a **best-effort implementation**. FurTrack's internal API may change at any time, which can cause this package to break or behave unexpectedly.


## Features

- Fetch posts, users, tags, albums, and thumbnails from Furtrack
- Supports API key authentication
- Customizable HTTP headers (e.g., User-Agent)
- Tag parsing and filtering utilities

## Installation

```sh
npm install furtrack-api
```

## Usage

```js
const FurtrackAPI = require('furtrack-api');

// Basic usage
const api = new FurtrackAPI();

// With API key and custom headers
const apiWithAuth = new FurtrackAPI({
	apiKey: 'YOUR_API_KEY',
	headers: {
	'User-Agent': 'MyCustomAgent/1.0',
	'X-Custom-Header': 'foobar'
	}
});

// Set or update API key later
api.setApiKey('NEW_API_KEY');

// Set or merge additional headers
api.setHeaders({
	'User-Agent': 'AnotherAgent/2.0'
});

// Fetch a user
api.getUser('username').then(user => {
	console.log(user);
});

api.getPost(1337).then(post => {
	console.log(post);
})

// fetch a user's posts
api.getPostsByUser('username').then(posts => {
	console.log(posts);
});

// Fetch posts by tag with pagination
api.getPostsByTag('1:Fluffy', 2).then(posts => {
	console.log(posts);
});

// Fetch a user's liked posts
api.getLikes('username').then(posts => {
	console.log(posts);
})

// Fetch a post's thumbnail URL
api.getThumbnail(12345).then(url => {
	console.log(url);
});

// Fetch a user's album.
api.getAlbum('username', 'albumid').then(album => {
	console.log(album)
})

// Fetch all tags
api.getTags().then(tags => {
	console.log(tags);
})

```

Functions which return a list of arrays additional support a page argument, FurTrack generally paginates albums longer than 200 images, by default only the first page is retrieved.

## Tag Utilities

```js
// Parse a tag string
const parsed = api.parseTag('1:Fluffy');
// => { type: 'character', value: 'Fluffy' }

// Filter tags by type
const tags = [{ tagName: '1:Alpha' }, { tagName: '2:Beta' }];
const characters = FurtrackAPI.getTagsByType(tags, FurtrackAPI.TagTypes.Character);
// => ['Alpha']
```

---

MIT License © 2025 blumlaut
