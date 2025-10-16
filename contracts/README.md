# Quinty Smart Contract ABIs

This directory contains `all-abis.json`, a bundle of contract interfaces that power the Quinty funding and bounty ecosystem. The ABIs are consumed by the frontend to encode calls, decode responses, and keep UI flows in sync with the deployed contracts. The table below outlines the responsibilities of each contract and highlights notable entry points you are likely to call from the app.

## Contract Summaries

### AirdropBounty
- **Purpose**: Manages airdrop-style bounty programs where users submit entries that designated verifiers approve before rewards are released.
- **Key flows**: `createAirdrop` to open a campaign, `submitEntry` for participant submissions, `verifyEntry`/`verifyMultipleEntries` for verifier decisions, and `finalizeAirdrop` to close distribution.
- **Support tooling**: Getter functions such as `getAirdrop`, `getAirdropStats`, and `getEntryCount` feed campaign dashboards, while `verifiers`, `isVerifier`, and `addVerifier`/`removeVerifier` manage the verification authority list.

### Crowdfunding
- **Purpose**: Runs milestone-based crowdfunding campaigns where contributors deposit funds and project owners draw down after hitting milestones.
- **Key flows**: `createCampaign`, `contribute`, `releaseMilestone`, and `withdrawMilestone`/`claimRefund` cover the lifecycle from launch to settlement.
- **Support tooling**: Use `getCampaignInfo`, `getMilestone`, `getContribution`, and related counters for progress displays. `setNFTAddress` wires in `QuintyNFT` for contributor badge minting.

### DisputeResolver
- **Purpose**: Coordinates community resolution of disputes across the platform by staking, voting, and final adjudication.
- **Key flows**: `initiatePengadilanDispute` (standard dispute) or `initiateExpiryVote` (timed-out process) open cases. Participants call `vote`, and the contract tallies via `getVoteCount` before `resolveDispute` finalizes.
- **Support tooling**: Constants (`DISPUTE_STAKE_BPS`, `MIN_VOTING_STAKE`, `VOTING_DURATION`) expose governance parameters. `isDisputeActive`, `disputes`, and `getDispute` back UI status checks.

### GrantProgram
- **Purpose**: Handles grant rounds where program managers curate applicants and disburse funds to selected recipients.
- **Key flows**: `createGrant`, `applyForGrant`, `approveApplications`/`rejectApplications`, `finalizeSelection`, and `claimGrant`.
- **Support tooling**: `getGrantInfo`, `getApplication`, `getSelectedRecipients`, and `getRecipientAmount` populate overview pages. `postUpdate` enables grant owners to share progress logs. `setNFTAddress` links reward NFTs.

### LookingForGrant
- **Purpose**: Lets builders publish standalone funding requests that supporters can back directly.
- **Key flows**: `createFundingRequest`, `supportRequest`, and `withdrawFunds` govern the life of a request. `cancelRequest` and `updateProjectInfo` provide owner controls.
- **Support tooling**: `getRequestInfo`, `getSupporter`, and `getSupporterContribution` drive supporter lists, while `setNFTAddress` allows badge integration.

### Quinty
- **Purpose**: Core bounty coordination hub (sometimes called the “Quinty Hub”). It manages bounty listings, open recruitment, submissions, and winner selection while orchestrating cross-contract integrations.
- **Key flows**: `createBounty`, `applyToOprec`/`approveOprecApplications`/`rejectOprecApplications`, `submitSolution`, `revealSolution`, and `selectWinners`.
- **Support tooling**: `getBountyData`, `getSubmission`, `getSubmissionStruct`, and counters feed dashboards. `addReply` supports threaded discussions. `setAddresses` configures dependencies (`disputeAddress`, `reputationAddress`, `nftAddress`), and `triggerSlash` is available for penalizing misbehavior via the reputation system.

### QuintyNFT
- **Purpose**: ERC-721 badge contract that surfaces achievements earned across Quinty products.
- **Key flows**: `mintBadge` and `batchMintBadges` grant badges, while `authorizeMinter`/`revokeMinter` control which contracts can mint.
- **Support tooling**: Standard ERC-721 view functions (`balanceOf`, `tokenURI`, `ownerOf`) plus helpers like `getUserBadges` and `getBadgeCount` support profile pages. `setBaseTokenURI` adjusts metadata hosting.

### QuintyReputation
- **Purpose**: Tracks seasonal performance metrics and achievement NFTs that quantify contributor reputation.
- **Key flows**: Recording hooks (`recordBountyCreation`, `recordSubmission`, `recordWin`) update aggregate stats and unlock achievements.
- **Support tooling**: Seasonal views (`currentSeasonId`, `getCurrentSeasonLeaderboard`, `seasonStats`) and per-user queries (`getUserStats`, `getUserAchievements`). Standard ERC-721 functions cover reputation token metadata.

### ZKVerification
- **Purpose**: Manages identity verification through zero-knowledge proofs and institution attestations.
- **Key flows**: `submitZKProof`/`verifyZKProof` for proof handling, `verifyUser`/`revokeVerification` to manage verified accounts, and `verifyInstitution` for trusted organizations.
- **Support tooling**: `getVerification`, `verifications`, and `isVerified` drive badge rendering; `getAddressBySocialHandle` and `socialHandleToAddress` maintain social handle mappings. `addVerifier`/`removeVerifier` administer trusted verifiers.

## Working With the ABIs
- Each array under a contract key mirrors the on-chain ABI. Filter by `type` to target functions vs. events if you are wiring new hooks.
- Ownership functions (`owner`, `transferOwnership`, `renounceOwnership`) follow the standard OpenZeppelin pattern across contracts.
- The ABIs intentionally keep read helpers (`get*`, `*Counter`, `*Stats`) available for low-cost UI polling; prefer those over iterating on-chain arrays from the frontend.
- When integrating new features, update `all-abis.json` after recompiling the contracts so the frontend stays aligned with the deployed bytecode.
