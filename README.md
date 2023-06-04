#### Les étapes du déroulement du vote sont les suivantes :

| WorkflowStatus               | Descriptions                 |
| ---------------------------- | ---------------------------- |
| RegisteringVoters            | Enregistrement des électeurs |
| ProposalsRegistrationStarted | On récolte les propositions  |
| ProposalsRegistrationEnded   | On clos les propositions     |
| VotingSessionStarted         | Le vote est commencé         |
| VotingSessionEnded           | Le vote est clos             |
| VotesTallied                 | Le dépouillement est fait    |



#### Accès fonctions concernées par le mofier **onlyOwner** :

| WorkflowStatus               | addVoter | startProposalsRegistering | endProposalsRegistering | startVotingSession | endVotingSession | tallyVotes |
| ---------------------------- | -------- | ------------------------- | ----------------------- | ------------------ | ---------------- | ---------- |
| RegisteringVoters            | ✅       | ✅                        |                         |                    |                  |            |
| ProposalsRegistrationStarted |          |                           | ✅                      |                    |                  |            |
| ProposalsRegistrationEnded   |          |                           |                         | ✅                 |                  |            |
| VotingSessionStarted         |          |                           |                         |                    | ✅               |            |
| VotingSessionEnded           |          |                           |                         |                    |                  | ✅         |
| VotesTallied                 |          |                           |                         |                    |                  |            |



#### Accès fonctions concernées par le mofier **onlyVoters** :

| WorkflowStatus               | getVoter | getOneProposal | addProposal | setVote |
| ---------------------------- | -------- | -------------- | ----------- | ------- |
| RegisteringVoters            | ✅       | ✅             |             |         |
| ProposalsRegistrationStarted | ✅       | ✅             | ✅          |         |
| ProposalsRegistrationEnded   | ✅       | ✅             |             |         |
| VotingSessionStarted         | ✅       | ✅             |             | ✅      |
| VotingSessionEnded           | ✅       | ✅             |             |         |
| VotesTallied                 | ✅       | ✅             |             |         |
