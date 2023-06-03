const Voting = artifacts.require("./Voting.sol");
const { BN , expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');


contract("Voting", accounts => {
	const _owner  = accounts[0];
	const _voter1 = accounts[1];
	const _voter2 = accounts[2];
	const _voter3 = accounts[3];
	const _voter4 = accounts[4];
	const _voter5 = accounts[5];
	const _fraud6 = accounts[6];

	const RegisteringVoters            = BN(0);
	const ProposalsRegistrationStarted = BN(1);
	const ProposalsRegistrationEnded   = BN(2);
	const VotingSessionStarted         = BN(3);
	const VotingSessionEnded           = BN(4);
	const VotesTallied                 = BN(5);

	let voting;

	beforeEach(async function(){
		voting= await Voting.new({from: _owner});
	});

	it("status : RegisteringVoters, no voter, no proposal, no result", async () => {

		// Voters
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
			voting.getVoter(_fraud6),
			"You're not a voter"
		);

		// Proposal
		await expectRevert(
			voting.getOneProposal(0),
			"You're not a voter"
		);

		// result
		await expectRevert(
			voting.tallyVotes(),
			"Current status is not voting session ended"
		);

	});

	it("status : RegisteringVoters, attempt to add a voter 2 times", async () => {
		await voting.addVoter( _voter1);
		await expectRevert(
			voting.addVoter( _voter1),
			"Already registered"
		);
	});

	it("status : RegisteringVoters, check emit for addVoter()", async () => {

		expectEvent(
			await voting.addVoter( _voter1),
			"VoterRegistered",
			{voterAddress: _voter1}
		);

	});

	it("onlyOwner : checks functions", async () => {
		await expectRevert(
			voting.addVoter( _voter3, {from: _voter1}),
			"caller is not the owner"
		);

		await expectRevert(
			voting.startProposalsRegistering( {from: _voter1}),
			"caller is not the owner"
		);

		await expectRevert(
			voting.endProposalsRegistering( {from: _voter1}),
			"caller is not the owner"
		);

		await expectRevert(
			voting.startVotingSession( {from: _voter1}),
			"caller is not the owner"
		);

		await expectRevert(
			voting.endVotingSession( {from: _voter1}),
			"caller is not the owner"
		);

		await expectRevert(
			voting.tallyVotes( {from: _voter1}),
			"caller is not the owner"
		);

	});

	it("status evolution : checks", async () => {

		expectEvent(
			await voting.startProposalsRegistering(),
			"WorkflowStatusChange",
			{
				previousStatus: RegisteringVoters,
				newStatus     : ProposalsRegistrationStarted,
			}
		);

		expectEvent(
			await voting.endProposalsRegistering(),
			"WorkflowStatusChange",
			{
				previousStatus: ProposalsRegistrationStarted,
				newStatus     : ProposalsRegistrationEnded,
			}
		);

		expectEvent(
			await voting.startVotingSession(),
			"WorkflowStatusChange",
			{
				previousStatus: ProposalsRegistrationEnded,
				newStatus     : VotingSessionStarted,
			}
		);

		expectEvent(
			await voting.endVotingSession(),
			"WorkflowStatusChange",
			{
				previousStatus: VotingSessionStarted,
				newStatus     : VotingSessionEnded,
			}
		);

		expectEvent(
			await voting.tallyVotes(),
			"WorkflowStatusChange",
			{
				previousStatus: VotingSessionEnded,
				newStatus     : VotesTallied,
			}
		);

		// revert order for status evolution, now

		await expectRevert(
			voting.endVotingSession(),
			"Voting session havent started yet"
		);

		await expectRevert(
			voting.startVotingSession(),
			"Registering proposals phase is not finished"
		);

		await expectRevert(
			voting.endProposalsRegistering(),
			"Registering proposals havent started yet"
		);

		await expectRevert(
			voting.startProposalsRegistering(),
			"Registering proposals cant be started now"
		);

	});

});
