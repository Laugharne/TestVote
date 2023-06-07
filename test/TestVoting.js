const Voting = artifacts.require("./Voting.sol");
const { BN , expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');


const RegisteringVoters            = BN(0);
const ProposalsRegistrationStarted = BN(1);
const ProposalsRegistrationEnded   = BN(2);
const VotingSessionStarted         = BN(3);
const VotingSessionEnded           = BN(4);
const VotesTallied                 = BN(5);


contract("Voting", accounts => {

	const _owner  = accounts[0];
	const _voter1 = accounts[1];
	const _voter2 = accounts[2];
	const _voter3 = accounts[3];
	const _voter4 = accounts[4];
	const _voter5 = accounts[5];
	const _fraud6 = accounts[6];

	let voting;


	beforeEach(async function(){
		voting = await Voting.new({from: _owner});
	});


	it("initialisation : no voter, no proposal, no result", async () => {

		expect( await voting.owner()).to.be.bignumber.equal( BN(_owner));

		// Voters
		await expectRevert(
			voting.getVoter(_owner),
			"You're not a voter"
		);

		await expectRevert(
			voting.getVoter(_voter1),
			"You're not a voter"
		);

		// No proposal, so no access to getOneProposal()

		// result
		await expectRevert(
			voting.tallyVotes(),
			"Current status is not voting session ended"
		);

	});


	describe("onlyOwner functions", function() {

		it("Check access if owner", async () => {

			expectEvent(
				await voting.addVoter( _voter1),
				"VoterRegistered",
				{voterAddress: _voter1}
			);
	
			await checkStatusScheduling( voting);
	
		});
	
		it("Check access if not owner", async () => {

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
	});




	it("status : check scheduling", async () => {

		await checkStatusScheduling( voting);

		// revert order for status evolution, now
		await expectRevert(
			voting.tallyVotes(),
			"Current status is not voting session ended"
		);

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

	});


	it("voters : check emit & revert for addVoter()", async () => {

		// Add voter1
		expectEvent(
			await voting.addVoter( _voter1),
			"VoterRegistered",
			{voterAddress: _voter1}
		);

		// Add voter2
		expectEvent(
			await voting.addVoter( _voter2),
			"VoterRegistered",
			{voterAddress: _voter2}
		);

		// Attempt to add voter1 again, it's fail
		await expectRevert(
			voting.addVoter( _voter1),
			"Already registered"
		);

		// Time to propose now
		await voting.startProposalsRegistering();

		// Attempt to add voter3, it's fail
		await expectRevert(
			voting.addVoter( _voter3),
			"Voters registration is not open yet"
		);

	});


	it("proposals : check emit & revert for addProposal()", async () => {

		const proposal1  = "proposal 1, from voter 1";
		const proposal2  = "proposal 2, from voter 1";
		const voidString = "";

		// Add voter1
		expectEvent(
			await voting.addVoter( _voter1),
			"VoterRegistered",
			{voterAddress: _voter1}
		);

		// voter1 attempt to propose, and fail
		await expectRevert(
			voting.addProposal( proposal1, {from: _voter1}),
			"Proposals are not allowed yet"
		);

		// Registration start now
		expectEvent(
			await voting.startProposalsRegistering(),
			"WorkflowStatusChange", {
				previousStatus: RegisteringVoters,
				newStatus     : ProposalsRegistrationStarted,
			}
		);

		// voter1 attempt to propose with success
		// there' is now one proposal
		expectEvent(
			await voting.addProposal( proposal1, {from: _voter1}),
			"ProposalRegistered",
			{proposalId: BN(1)}
		);

		// voter1 attempt to propose with success
		// there' is now two proposal
		expectEvent(
			await voting.addProposal( proposal2, {from: _voter1}),
			"ProposalRegistered",
			{proposalId: BN(2)}
		);

		// voter1 attempt to propose a void string, and fail
		await expectRevert(
			voting.addProposal( voidString, {from: _voter1}),
			"Vous ne pouvez pas ne rien proposer"
		);

	});


	it("vote : onlyVoters access, check proposal & vote processing", async () => {

		const proposal1  = "proposal 1";
		const proposal2  = "proposal 2";

		// Add voter1 (the only one voter registered, no voter2 registered)
		expectEvent(
			await voting.addVoter( _voter1),
			"VoterRegistered",
			{voterAddress: _voter1}
		);

		await assertGetVoterAndGetProposal( voting, _voter1, _voter2, false, false);


		// Registration start
		// ------------------
		await voting.startProposalsRegistering();
		await assertGetVoterAndGetProposal( voting, _voter1, _voter2, false, false);

		// voter1 attempt to propose with success
		// there' is now one proposal
		expectEvent(
			await voting.addProposal( proposal1, {from: _voter1}),
			"ProposalRegistered",
			{proposalId: BN(1)}
		);

		// voter2 attempt to propose, and fail
		await expectRevert(
			voting.addProposal( proposal2, {from: _voter2}),
			"You're not a voter"
		);

		await assertGetVoterAndGetProposal( voting, _voter1, _voter2, true, false);


		// Registration stop
		// -----------------
		await voting.endProposalsRegistering();
		await assertGetVoterAndGetProposal( voting, _voter1, _voter2, true, false);


		// voting start
		// ------------
		await voting.startVotingSession();
		await assertGetVoterAndGetProposal( voting, _voter1, _voter2, true, false);

		// voter1 attempt to vote, succeed
		expectEvent(
			await voting.setVote( BN(1), {from: _voter1}),
			"Voted", {
				voter: _voter1,
				proposalId: BN(1)
			}
		);

		// voter2 attempt to vote, and fail
		await expectRevert(
			voting.setVote( BN(1), {from: _voter2}),
			"You're not a voter"
		);

		await assertGetVoterAndGetProposal( voting, _voter1, _voter2, true, true);



		// voting stop
		// -----------
		await voting.endVotingSession();
		await assertGetVoterAndGetProposal( voting, _voter1, _voter2, true, true);


	});

});


async function assertGetVoterAndGetProposal( voting, _voter1, _voter2, hasProposal, hasVoted) {

	voterStruct = await voting.getVoter(_voter1, {from: _voter1});
	assert.equal(voterStruct.isRegistered, true, "Not registered");
	//expect(voterStruct.isRegistered).to.be.bool.equal(true);
	if( hasVoted == false) {
		expect(voterStruct.votedProposalId).to.be.bignumber.equal(BN(0));
		assert.equal(voterStruct.hasVoted,        false, "Still voted");
	} else {
		expect(voterStruct.votedProposalId).to.be.bignumber.equal(BN(1));
	}

	// Attempt to add voter2, it's fail
	await expectRevert(
		voting.getVoter( _voter1, {from: _voter2}),
		"You're not a voter"
	);

	await expectRevert(
		voting.getOneProposal(0, {from: _voter2}),
		"You're not a voter"
	);

	if( hasProposal == false) return;
	let proposalStruct = await voting.getOneProposal(0, {from: _voter1});
	assert.equal(proposalStruct.description, "GENESIS",  "Not GENESIS proposal");

	proposalStruct = await voting.getOneProposal(1, {from: _voter1});
	assert.equal(proposalStruct.description, "proposal 1",  "Not proposal 1");

}


async function checkStatusScheduling( voting) {

	expectEvent(
		await voting.startProposalsRegistering(),
		"WorkflowStatusChange", {
			previousStatus: RegisteringVoters,
			newStatus     : ProposalsRegistrationStarted,
		}
	);

	expectEvent(
		await voting.endProposalsRegistering(),
		"WorkflowStatusChange", {
			previousStatus: ProposalsRegistrationStarted,
			newStatus     : ProposalsRegistrationEnded,
		}
	);

	expectEvent(
		await voting.startVotingSession(),
		"WorkflowStatusChange", {
			previousStatus: ProposalsRegistrationEnded,
			newStatus     : VotingSessionStarted,
		}
	);

	expectEvent(
		await voting.endVotingSession(),
		"WorkflowStatusChange", {
			previousStatus: VotingSessionStarted,
			newStatus     : VotingSessionEnded,
		}
	);

	expectEvent(
		await voting.tallyVotes(),
		"WorkflowStatusChange", {
			previousStatus: VotingSessionEnded,
			newStatus     : VotesTallied,
		}
	);

}