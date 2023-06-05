
## Vecteurs d'états
On peut noter les principaux **vecteurs d'états** dans le code du fichier source "*Voting.sol*"

- WorkflowStatus
- onlyOwner
- onlyVoters

Ainsi que les données qui évoluent en fonctions du déroulement du processus de vote et des intéractions réalisées par le "*owner*" et les votants.

- winningProposalID
- proposalsArray
- voters


## Déploiement
Au déploiement du **contrat**, celui-ci ne possède :
- ni votant
- ni proposition de vote
- ni résultat de vote
- il est juste "*possédé*" par le **owner**


## Évolution du processus de vote
Le déroulement du processus de vote, se fait dans une ordre bien défini, de *RegisteringVoters* vers *VotesTallied*. (voir tableau plus bas)

Des **events** sont émis lors du changement d'étape.

#### Les étapes du déroulement du vote sont les suivantes :

| WorkflowStatus               | Descriptions                 |
| ---------------------------- | ---------------------------- |
| RegisteringVoters            | Enregistrement des électeurs |
| ProposalsRegistrationStarted | On récolte les propositions  |
| ProposalsRegistrationEnded   | On clos les propositions     |
| VotingSessionStarted         | Le vote est commencé         |
| VotingSessionEnded           | Le vote est clos             |
| VotesTallied                 | Le dépouillement est fait    |


## onlyVoters
Concernant les vecteurs d'états **onlyVoters** l'accès aux fonctions *getVoter()* et *getOneProposal()* sont testables sans condition particulière.

*addProposal()* et *setVote()* nécessite par contre des états particuliers pour être testés pleinement.

#### Accès aux fonctions concernées par le modifier **onlyVoters** :

| WorkflowStatus               | getVoter | getOneProposal | addProposal | setVote |
| ---------------------------- | -------- | -------------- | ----------- | ------- |
| RegisteringVoters            | ✅       | ✅             |             |         |
| ProposalsRegistrationStarted | ✅       | ✅             | ✅          |         |
| ProposalsRegistrationEnded   | ✅       | ✅             |             |         |
| VotingSessionStarted         | ✅       | ✅             |             | ✅      |
| VotingSessionEnded           | ✅       | ✅             |             |         |
| VotesTallied                 | ✅       | ✅             |             |         |






#### Accès aux fonctions concernées par le modifier **onlyOwner** :

| WorkflowStatus               | addVoter | startProposalsRegistering | endProposalsRegistering | startVotingSession | endVotingSession | tallyVotes |
| ---------------------------- | -------- | ------------------------- | ----------------------- | ------------------ | ---------------- | ---------- |
| RegisteringVoters            | ✅       | ✅                        |                         |                    |                  |            |
| ProposalsRegistrationStarted |          |                           | ✅                      |                    |                  |            |
| ProposalsRegistrationEnded   |          |                           |                         | ✅                 |                  |            |
| VotingSessionStarted         |          |                           |                         |                    | ✅               |            |
| VotingSessionEnded           |          |                           |                         |                    |                  | ✅         |
| VotesTallied                 |          |                           |                         |                    |                  |            |



