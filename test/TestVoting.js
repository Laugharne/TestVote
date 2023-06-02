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

	it("status : RegisteringVoters, no voter, no proposal", async () => {
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
		//let status = voting.workflowStatus.call();
		//console.log( status);
	});

	it("status : RegisteringVoters, add a voter 2 times", async () => {
		await voting.addVoter( _voter1);
		await expectRevert(
			voting.addVoter( _voter1),
			"Already registered"
		);
	});

	it("status : RegisteringVoters, test emit for addVoter()", async () => {

		let receipt = await voting.addVoter( _voter1);
		/*
		expectEvent.inLogs(
			receipt.logs,
			"VoterRegistered",
			{voterAddress: _voter1}
		);*/

		expectEvent(
			receipt,
			"VoterRegistered",
			{voterAddress: _voter1}
		);

	});

});
