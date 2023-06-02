const Voting = artifacts.require("./Voting.sol");
const { BN , expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');


contract("Voting", accounts => {

	let MyInstance;

	beforeEach(async function(){
		MyInstance= await Voting.new({from: _owner});
	});

});
