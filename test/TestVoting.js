const Voting = artifacts.require("./Voting.sol");
const { BN , expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');


contract("Voting", accounts => {
	const _owner  = accounts[0];
	const _voter1 = accounts[1];
	const _voter2 = accounts[2];
	const _voter3 = accounts[3];
	const _voter4 = accounts[4];

	let voting;

	beforeEach(async function(){
		voting= await Voting.new({from: _owner});
	});

	it("At first, no voter, no proposal", async () => {
		await expectRevert(
			voting.getVoter(_owner),
			"You're not a voter"
		);
		await expectRevert(
			voting.getVoter(_voter1),
			"You're not a voter"
		);
		await expectRevert(
			voting.getVoter(_voter2),
			"You're not a voter"
		);

		await expectRevert(
			voting.getOneProposal(0),
			"You're not a voter"
		);
	});

	
});
