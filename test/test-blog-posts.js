const chai = require('chai');
const chatHttp = require('chai-http');
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
		consol.warn('Deleting database');
		mongoose.connection.dropDatabase()
			.then(result => resolve(result))
			.catch(err => reject(err))
	});
}

function seedBlogData() {
	console.info('seeding blog data');
	const seedData = [];

	for (let i = 1; i <= 10; i++) {
		seedData.push(generateSeedData());
	}
	// returns a promise //
	return BlogPost.insertMany(seedData);
}

function generateSeedData() {
	return {
		author: {
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		},
		title: faker.lorem.sentence(),
		content: fakerlorem.text()
	}
}

describe('blog posts API resource', function() {
	before(function() {
		return runServer(TEST_DATABASE_URL);
	});

	beforeEacg(function() {
		return seedBlogData();
	});

	afterEach(function() {
		return tearDownDb();
	});

	after(function() {
		return closeServer();
	});
})

