const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// makes should syntax available //
const should = chai.should();

const {DATABASE_URL} = require('../config');
const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

// deletes database to ensure data from one test doesn't 
// isn't around for next tests
function tearDownDb() {
	return new Promise((resolve, reject) => {
		console.warn('Deleting database');
		mongoose.connection.dropDatabase()
			.then(result => resolve(result))
			.catch(err => reject(err))
	});
}

function seedBlogData() {
	console.info('seeding blog data');
	const seedData = [];

	for (let i = 1; i <= 10; i++) {
		seedData.push({
			author: {
				firstName: faker.name.firstName(),
				lastName: faker.name.lastName()
			},
			title: faker.lorem.sentence(),
			content: faker.lorem.text()
			});
	}
	// returns a promise //
	return BlogPost.insertMany(seedData);
}

describe('blog posts API resource', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function() {
		return seedBlogData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});

	describe('GET endpoint', function() {
		it('should return all existing blog posts', function() {
			let res;
			return chai.request(app)
			.get('/posts')
			.then(_res => {
				res = _res;
				res.should.have.status(200);
				res.body.should.have.length.of.at.least(1);
				return BlogPost.count();
			})
			.then(count => {
				res.body.should.have.length.of(count);
			});
		});

		it('should return posts with right fields', function() {
			let resPost;
			return chai.request(app)
			.get('/posts')
			.then(function(res) {
				res.should.have.status(200);
				res.should.be.json;
				res.body.should.be.a('array');
				res.body.should.have.length.of.at.least(1);

				res.body.forEach(function(post) {
					post.should.be.a('object');
					post.should.include.keys('id', 'title', 'author', 'created');
				});
				resPost = res.body[0];
				return BlogPost.findById(resPost.id).exec();
			})
			.then(post => {
				resPost.title.should.be.equal(post.title);
				resPost.content.should.be.equal(post.content);
				resPost.author.should.be.equal(post.authorName);
			});
		});
	});

	describe('Post endpoint', function() {
		it('should add a new blog post', function() {
			const newPost = {
				title: faker.lorem.sentence(),
				author: {
					firstName: faker.name.firstName(),
					lastName: faker.name.lastName(),
				},
				content: faker.lorem.text()
			};

			return chai.request(app)
				.post('/posts')
				.send(newPost)
				.then(function(res) {
					res.should.have.status(201);
					res.should.be.json;
					res.body.should.be.a('object');
					res.body.should.include.keys(
						'id', 'title', 'content', 'author', 'created');
					res.body.title.should.equal(newPost.title);
					res.body.id.should.not.be.null;
					res.body.author.should.equal(
						`${newPost.author.firstName} ${newPost.author.lastName}`);
					res.body.content.should.equal(newPost.content);
					return BlogPost.findById(res.body.id).exec();
				})
				.then(function(post) {
					post.title.should.equal(newPost.title);
					post.content.should.equal(newPost.content);
					post.author.firstName.should.equal(newPost.author.firstName);
					post.author.lastName.should.equal(newPost.author.lastName);
				});
		});
	});

	describe('PUT endpoint', function() {
		it('should update fields user sends', function() {
			const updateData = {
				title: 'girls girls girls',
				content: 'about girls',
				author: {
					firstName: 'Edna',
					lastName: 'Garrett'
				}
			};

			return BlogPost
			.findOne()
			.exec()
			.then(post => {
				updateData.id = post.id;

				return chai.request(app)
				.put(`/posts/${post.id}`)
				.send(updateData)
			})
			.then(res => {
				res.should.have.status(201);
				res.should.be.json;
				res.body.should.be.a('object');
				res.body.title.should.equal(updateData.title);
				res.body.author.should.equal(
					`${updateData.author.firstName} ${updateData.author.lastName}`
					);
				res.body.content.should.equal(updateData.content);

				return BlogPost.findById(res.body.id).exec();
			})
			.then(post => {
				post.title.should.equal(updateData.title);
				post.content.should.equal(updateData.content);
				post.author.firstName.should.equal(updateData.author.firstName);
				post.author.lastName.should.equal(updateData.author.lastName);				
			});
		});
	});

	describe('DELETE endpoint', function() {
		it('should delete a post by id', function() {
			let post;

			return BlogPost
			.findOne()
			.exec()
			.then(_post => {
				post = _post;
				return chai.request(app).delete(`/posts/${post.id}`);
			})
			.then(res => {
				res.should.have.status(204);
				return BlogPost.findById(post.id);
			})
			.then(_post => {
				should.not.exist(_post);
			});
		});
	});
});

