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