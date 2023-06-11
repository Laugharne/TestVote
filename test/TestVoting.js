const Voting = artifacts.require("./Voting.sol");
const { BN , expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');


const RegisteringVoters            = BN(0);
const ProposalsRegistrationStarted = BN(1);
const ProposalsRegistrationEnded   = BN(2);
const VotingSessionStarted         = BN(3);
const VotingSessionEnded           = BN(4);
const VotesTallied                 = BN(5);

const INDEX_GENESIS         = BN(0);
const INDEX_PROPOSAL_1      = BN(1);
const INDEX_PROPOSAL_WINNER = BN(1);
const NN_VOTE               = BN(2);


contract("Voting", accounts => {

	const OWNER   = accounts[0];
	const VOTER_1 = accounts[1];
	const VOTER_2 = accounts[2];
	const VOTER_3 = accounts[3];

	let voting;


	describe("Initialisation", function() {

		beforeEach(async function() {
			voting = await Voting.new({from: OWNER});
		});

		
		it("Ownership", async () => {
			expect( await voting.owner()).to.be.bignumber.equal( BN(OWNER));
		});
	
		it("Initial workflow status", async () => {
			exceptDefinedStatus( voting, RegisteringVoters);
		});

		it("No voter", async () => {
			await expectRevert(
				voting.getVoter(OWNER, {from: OWNER}),
				"You're not a voter"
			);
	
			await expectRevert(
				voting.getVoter(VOTER_1, {from: OWNER}),
				"You're not a voter"
			);

		});
	
		it("No proposal", async () => {
			// No registered voter, so no access to getOneProposal()
			await expectRevert(
				voting.getOneProposal(0, {from: OWNER}),
				"You're not a voter"
			);
			await expectRevert(
				voting.getOneProposal(0, {from: VOTER_1}),
				"You're not a voter"
			);

		});
	
		it("No result", async () => {

			// No result !
			await expectRevert(
				voting.tallyVotes( {from: OWNER}),
				"Current status is not voting session ended"
			);

			let winningProposalID = (await voting.winningProposalID( {from: OWNER}));
			expect(winningProposalID).to.be.bignumber.equal(BN(0));

		});

	});


	describe("Check workflow status evolution", function() {

		beforeEach(async function() {
			voting = await Voting.new({from: OWNER});
		});
	

		it("Chronological order", async () => {
			await expectStatusScheduling( voting);
		});

		it("Revert order", async () => {

			await expectStatusScheduling( voting);

			await expectRevert(
				voting.tallyVotes({from: OWNER}),
				"Current status is not voting session ended"
			);

			await expectRevert(
				voting.endVotingSession({from: OWNER}),
				"Voting session havent started yet"
			);

			await expectRevert(
				voting.startVotingSession({from: OWNER}),
				"Registering proposals phase is not finished"
			);

			await expectRevert(
				voting.endProposalsRegistering({from: OWNER}),
				"Registering proposals havent started yet"
			);

			await expectRevert(
				voting.startProposalsRegistering({from: OWNER}),
				"Registering proposals cant be started now"
			);

		});

	});


	describe("\"onlyOwner\" functions access", function() {

		beforeEach(async function() {
			voting = await Voting.new({from: OWNER});
		});


		it("If not owner", async () => {

			await expectRevert(
				voting.addVoter( VOTER_3, {from: VOTER_1}),
				"caller is not the owner"
			);
			
			await expectRevert(
				voting.startProposalsRegistering( {from: VOTER_1}),
				"caller is not the owner"
			);
	
			await expectRevert(
				voting.endProposalsRegistering( {from: VOTER_1}),
				"caller is not the owner"
			);
	
			await expectRevert(
				voting.startVotingSession( {from: VOTER_1}),
				"caller is not the owner"
			);
	
			await expectRevert(
				voting.endVotingSession( {from: VOTER_1}),
				"caller is not the owner"
			);
	
			await expectRevert(
				voting.tallyVotes( {from: VOTER_1}),
				"caller is not the owner"
			);
	
		});

		it("If owner", async () => {
			await expectAddNewVoter( voting, VOTER_1, OWNER);
			await expectStatusScheduling( voting);	
		});
	
	});



	describe("Vote", function() {

		beforeEach(async function() {
			voting = await Voting.new({from: OWNER});
		});


		it("Voters : check emit & revert for addVoter()", async () => {

			// Add voter1
			await expectAddNewVoter( voting, VOTER_1, OWNER);
	
			// Add voter2
			await expectAddNewVoter( voting, VOTER_2, OWNER);
	
			// Attempt to add voter1 AGAIN, it's fail
			await expectRevert(
				voting.addVoter( VOTER_1, {from: OWNER}),
				"Already registered"
			);
	
			// Time to propose now
			await expectStatusChangeOk( voting, RegisteringVoters, ProposalsRegistrationStarted, await voting.startProposalsRegistering()) ;
			// STATUS has change !

			// Attempt to add voter3, it's fail
			await expectRevert(
				voting.addVoter( VOTER_3, {from: OWNER}),
				"Voters registration is not open yet"
			);
	
		});


		it("Proposals : check emit & revert for addProposal()", async () => {

			const proposal1  = "proposal 1, from voter 1";
			const proposal2  = "proposal 2, from voter 1";
			const voidString = "";
	
			// Add voter1
			await expectAddNewVoter( voting, VOTER_1, OWNER);

			// voter1 attempt to propose, and fail
			await expectRevert(
				voting.addProposal( proposal1, {from: VOTER_1}),
				"Proposals are not allowed yet"
			);

			// Registration start now
			await expectStatusChangeOk( voting, RegisteringVoters, ProposalsRegistrationStarted, await voting.startProposalsRegistering()) ;

			// voter1 attempt to propose with success
			// there' is now ONE proposal
			expectEvent(
				await voting.addProposal( proposal1, {from: VOTER_1}),
				"ProposalRegistered",
				{proposalId: BN(1)}
			);
	
			// voter1 attempt to propose with success
			// there' is now TWO proposals
			expectEvent(
				await voting.addProposal( proposal2, {from: VOTER_1}),
				"ProposalRegistered",
				{proposalId: NN_VOTE}
			);
	
			// voter1 attempt to propose a void string, and fail
			await expectRevert(
				voting.addProposal( voidString, {from: VOTER_1}),
				"Vous ne pouvez pas ne rien proposer"
			);
	
		});


		it("Full \"onlyVoters\" check access, check proposals & vote processing", async () => {

			const proposal1 = "proposal 1";
			const proposal2 = "proposal 2";
	
			// Add voter1 (the only one voter registered, no voter2 registered)
			await expectAddNewVoter( voting, VOTER_1, OWNER);

			// Add voter3 (voter1 & voter3 are registered now, still no voter2 registered)
			await expectAddNewVoter( voting, VOTER_3, OWNER);
			await checkGetVoterAndGetProposal( voting, VOTER_1, VOTER_2, false, false);
	
			// Registration start
			// ------------------
			await expectStatusChangeOk( voting, RegisteringVoters, ProposalsRegistrationStarted, await voting.startProposalsRegistering());
			await checkGetVoterAndGetProposal( voting, VOTER_1, VOTER_2, false, false);
	
			// voter1 attempt to propose with success
			// there' is now one proposal
			expectEvent(
				await voting.addProposal( proposal1, {from: VOTER_1}),
				"ProposalRegistered",
				{proposalId: INDEX_PROPOSAL_1}
			);
	
			// voter2 attempt to propose, and fail
			await expectRevert(
				voting.addProposal( proposal2, {from: VOTER_2}),
				"You're not a voter"
			);
	
			await checkGetVoterAndGetProposal( voting, VOTER_1, VOTER_2, true, false);
	
			// Registration stop
			// -----------------
			expectStatusChangeOk( voting, ProposalsRegistrationStarted, ProposalsRegistrationEnded, await voting.endProposalsRegistering()) ;

			await checkGetVoterAndGetProposal( voting, VOTER_1, VOTER_2, true, false);

	
			// Voting start
			// ------------
			expectStatusChangeOk( voting, ProposalsRegistrationEnded, VotingSessionStarted, await voting.startVotingSession()) ;

			await checkGetVoterAndGetProposal( voting, VOTER_1, VOTER_2, true, false);
	
			// voter1 attempt to votefor proposition #1, succeed
			expectEvent(
				await voting.setVote( INDEX_PROPOSAL_1, {from: VOTER_1}),
				"Voted", {
					voter: VOTER_1,
					proposalId: INDEX_PROPOSAL_1
				}
			);
	
			// voter2 attempt to vote, and fail
			await expectRevert(
				voting.setVote( INDEX_PROPOSAL_1, {from: VOTER_2}),
				"You're not a voter"
			);

			// voter3 attempt to vote for proposition #1, succeed
			expectEvent(
				await voting.setVote( INDEX_PROPOSAL_1, {from: VOTER_3}),
				"Voted", {
					voter: VOTER_3,
					proposalId: INDEX_PROPOSAL_1
				}
			);

			// There is now TWO votes for proposal #1
			await checkGetVoterAndGetProposal( voting, VOTER_1, VOTER_2, true, true);

			// Voting stop
			// -----------
			expectStatusChangeOk( voting, VotingSessionStarted, VotingSessionEnded, await voting.endVotingSession()) ;

			await checkGetVoterAndGetProposal( voting, VOTER_1, VOTER_2, true, true);

			// Tallied
			// -------
			expectStatusChangeOk( voting, VotingSessionEnded, VotesTallied, await voting.tallyVotes()) ;

			// Check for winner
			// ----------------
			let winningProposalID = (await voting.winningProposalID({from: OWNER}));
			expect(winningProposalID).to.be.bignumber.equal(INDEX_PROPOSAL_WINNER);

			await checkGetVoterAndGetProposal( voting, VOTER_1, VOTER_2, true, true);
	
		});
	
	});

});


/**
 * Multi purpose function to check emit + revert of getVoter() & getOneProposal()
 * with differents contexts :
 *     - we have a proposal available
 *     - voter #1 & voter #3 have allready voted for proposal #1
 * 
 * @param {*} voting 
 * @param {*} registeredVoter VOTER_1
 * @param {*} unregisteredVoter VOTER_2
 * @param bool hasProposal  expect to have at least, one voter proposal available and the GENESIS proposal
 * @param bool hasVoted  expect to have at least one registered voter available
 * @returns 
 */
async function checkGetVoterAndGetProposal( voting, registeredVoter, unregisteredVoter, hasProposal, hasVoted) {

	voterStruct = await voting.getVoter(registeredVoter, {from: registeredVoter});
	assert.equal(voterStruct.isRegistered, true, "Not registered");
	//expect(voterStruct.isRegistered).to.be.bool.equal(true);
	if( hasVoted == false) {
		expect(voterStruct.votedProposalId).to.be.bignumber.equal(BN(0));
		assert.equal(voterStruct.hasVoted, false, "Allready voted");
	} else {
		expect(voterStruct.votedProposalId).to.be.bignumber.equal(INDEX_PROPOSAL_1);
		let proposalStruct = await voting.getOneProposal(INDEX_PROPOSAL_1, {from: registeredVoter});
		expect(proposalStruct.voteCount).to.be.bignumber.equal(NN_VOTE);
	}

	// Attempt to add voter2, it's fail
	await expectRevert(
		voting.getVoter( registeredVoter, {from: unregisteredVoter}),
		"You're not a voter"
	);

	await expectRevert(
		voting.getOneProposal(INDEX_GENESIS, {from: unregisteredVoter}),
		"You're not a voter"
	);

	if( hasProposal == false) return;
	let proposalStruct = await voting.getOneProposal(INDEX_GENESIS, {from: registeredVoter});
	assert.equal(proposalStruct.description, "GENESIS",  "Not GENESIS proposal");

	proposalStruct = await voting.getOneProposal(INDEX_PROPOSAL_1, {from: registeredVoter});
	assert.equal(proposalStruct.description, "proposal 1",  "Not proposal 1");

}



async function exceptDefinedStatus( _voting, _status) {
	workflowStatus = (await _voting.workflowStatus());
	expect(workflowStatus).to.be.bignumber.equal(_status);
}

async function expectStatusChangeOk( _voting, _prevStatus, _newStatus, _func) {
	expectEvent(
		_func,
		"WorkflowStatusChange", {
			previousStatus: _prevStatus,
			newStatus     : _newStatus,
		}
	);
	exceptDefinedStatus( _voting, _newStatus);
}

/**
 * Proceed to an evolution of the workflow status in
 * chronological order from "RegisteringVoters" to "VotesTallied",
 * check events emitted and status after evolution
 * 
 * @param any voting 
 */
async function expectStatusScheduling( _voting) {

	expectStatusChangeOk( _voting, RegisteringVoters, ProposalsRegistrationStarted, await _voting.startProposalsRegistering()) ;
	expectStatusChangeOk( _voting, ProposalsRegistrationStarted, ProposalsRegistrationEnded, await _voting.endProposalsRegistering()) ;
	expectStatusChangeOk( _voting, ProposalsRegistrationEnded, VotingSessionStarted, await _voting.startVotingSession()) ;
	expectStatusChangeOk( _voting, VotingSessionStarted, VotingSessionEnded, await _voting.endVotingSession()) ;
	expectStatusChangeOk( _voting, VotingSessionEnded, VotesTallied, await _voting.tallyVotes()) ;
}

async function revertStatusChange( _message, _func) {
	await expectRevert(
		_func,
		_message
	);
}

async function expectAddNewVoter( _voting, _address, _owner) {
	expectEvent(
		await _voting.addVoter( _address, {from: _owner}),
		"VoterRegistered",
		{voterAddress: _address}
	);

	voterStruct = await _voting.getVoter( _address, {from: _address});
	expect(voterStruct.isRegistered).to.be.true;
	expect(voterStruct.hasVoted).to.be.false;
	expect(voterStruct.votedProposalId).to.be.bignumber.equal( BN(0));

}