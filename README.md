
## Vecteurs d'états
On peut noter les principaux **vecteurs d'états** dans le code du fichier source "*Voting.sol*"

- WorkflowStatus
- onlyOwner
- onlyVoters

Ainsi que les données qui évoluent en fonctions du déroulement du processus de vote et des intéractions réalisées par le "*owner*" et les votants.

- winningProposalID
- proposalsArray
- voters

Le cas **proposalsArray** est intéressant car à partir du passage à l'étape **ProposalsRegistrationStarted** du déroulement du processus de vote (workflow) il y a au moins **UNE** proposition, la proposition **GENESIS**, il y a donc un état testable !

#### Extrait :
```javascript
let proposalStruct = await voting.getOneProposal(0, {from: _voter1});
assert.equal(proposalStruct.description, "GENESIS",  "Not GENESIS proposal");
```


## Déploiement
Au déploiement du **contrat**, celui-ci ne possède :
- ni votant
- ni proposition de vote
- ni résultat de vote
- il est juste "*possédé*" par le **owner** qui l'a déployé

#### Extrait :
```javascript
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
```


## Évolution du processus de vote
Le déroulement du processus de vote, se fait dans une ordre bien défini, de *RegisteringVoters* vers *VotesTallied* (voir tableau plus bas) un **revert** se porduit en cas de mauvais enchainement d'états.

Des **events** précis sont émis lors du changement d'étape.

#### Les étapes du déroulement du vote sont les suivantes :

| WorkflowStatus               | Descriptions                 |
| ---------------------------- | ---------------------------- |
| RegisteringVoters            | Enregistrement des électeurs |
| ProposalsRegistrationStarted | On récolte les propositions  |
| ProposalsRegistrationEnded   | On clos les propositions     |
| VotingSessionStarted         | Le vote est commencé         |
| VotingSessionEnded           | Le vote est clos             |
| VotesTallied                 | Le dépouillement est fait    |

#### Extrait #1 :
```javascript
await expectRevert(
	voting.endVotingSession(),
	"Voting session havent started yet"
);
```
#### Extrait #2 :
```javascript
expectEvent(
	await voting.startProposalsRegistering(),
	"WorkflowStatusChange", {
		previousStatus: RegisteringVoters,
		newStatus     : ProposalsRegistrationStarted,
	}
);
```


## onlyVoters
Concernant les vecteurs d'états **onlyVoters** l'accès aux fonctions *getVoter()* et *getOneProposal()* sont testables sans condition particulière.

*addProposal()* et *setVote()* nécessite par contre des états particuliers pour être testés plus profondément.

#### Extrait :
```javascript
expectEvent(
	await voting.setVote( BN(1), {from: _voter1}),
	"Voted", {
		voter: _voter1,
		proposalId: BN(1)
	}
);

await expectRevert(
	voting.setVote( BN(1), {from: _voter2}),
	"You're not a voter"
);
```


#### Accès aux fonctions concernées par le modifier **onlyVoters** :

| WorkflowStatus               | getVoter | getOneProposal | addProposal | setVote |
| ---------------------------- | -------- | -------------- | ----------- | ------- |
| RegisteringVoters            | ✅       | ✅             |             |         |
| ProposalsRegistrationStarted | ✅       | ✅             | ✅          |         |
| ProposalsRegistrationEnded   | ✅       | ✅             |             |         |
| VotingSessionStarted         | ✅       | ✅             |             | ✅      |
| VotingSessionEnded           | ✅       | ✅             |             |         |
| VotesTallied                 | ✅       | ✅             |             |         |


## onlyOwner




#### Accès aux fonctions concernées par le modifier **onlyOwner** :

| WorkflowStatus               | addVoter | startProposalsRegistering | endProposalsRegistering | startVotingSession | endVotingSession | tallyVotes |
| ---------------------------- | -------- | ------------------------- | ----------------------- | ------------------ | ---------------- | ---------- |
| RegisteringVoters            | ✅       | ✅                        |                         |                    |                  |            |
| ProposalsRegistrationStarted |          |                           | ✅                      |                    |                  |            |
| ProposalsRegistrationEnded   |          |                           |                         | ✅                 |                  |            |
| VotingSessionStarted         |          |                           |                         |                    | ✅               |            |
| VotingSessionEnded           |          |                           |                         |                    |                  | ✅         |
| VotesTallied                 |          |                           |                         |                    |                  |            |



#### Extrait :
```javascript
it("onlyOwner functions : check access if not owner", async () => {

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
```
