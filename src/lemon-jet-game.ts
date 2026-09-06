import {
  GameReleased as GameReleasedEvent,
  GameStarted as GameStartedEvent,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  ReferrerSettled as ReferrerSettledEvent,
  ReferrerRewardIssued as ReferrerRewardIssuedEvent
} from "../generated/LemonJetGame/LemonJetGame"
import {
  Game,
  Referral,
  ReferralReward,
  Referrer,
  VaultSnapshot
} from "../generated/schema"
import { LemonJetGame } from "../generated/LemonJetGame/LemonJetGame"
import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts"

const PROXY_ADDRESS = Address.fromString("0xf36fed68017F6E84D2EB1D4bD35AB56ae0cD914a")
const SECONDS_PER_DAY = BigInt.fromI32(86400) // 24 * 60 * 60

function saveVaultSnapshot(event: ethereum.Event): void {
  let contract = LemonJetGame.bind(PROXY_ADDRESS)
  let totalAssetsResult = contract.try_totalAssets()
  let totalSupplyResult = contract.try_totalSupply()
  
  if (!totalAssetsResult.reverted && !totalSupplyResult.reverted) {
    let day = event.block.timestamp.div(SECONDS_PER_DAY)
    let dayId = day.toI32().toString()
    
    let existingSnapshot = VaultSnapshot.load(dayId)
    
    if (existingSnapshot == null) {
      let snapshot = new VaultSnapshot(dayId)
      snapshot.totalAssets = totalAssetsResult.value
      snapshot.totalSupply = totalSupplyResult.value
      snapshot.blockNumber = event.block.number
      snapshot.blockTimestamp = event.block.timestamp
      snapshot.transactionHash = event.transaction.hash
      snapshot.day = day
      snapshot.save()
    }
  }
}

export function handleGameReleased(event: GameReleasedEvent): void {
  let gameId = event.params.requestId.toString()

  let gameEntity = Game.load(gameId)
  if (gameEntity == null) {
    gameEntity = new Game(gameId)
    gameEntity.requestId = event.params.requestId
    gameEntity.playerAddress = event.params.playerAddress
  }

  gameEntity.payout = event.params.payout
  gameEntity.randomNumber = event.params.randomNumber
  gameEntity.x = event.params.x
  gameEntity.releasedBlockNumber = event.block.number
  gameEntity.releasedBlockTimestamp = event.block.timestamp
  gameEntity.releasedTransactionHash = event.transaction.hash
  gameEntity.save()

  saveVaultSnapshot(event)
}

export function handleGameStarted(event: GameStartedEvent): void {
  let gameId = event.params.requestId.toString()

  let gameEntity = Game.load(gameId)
  if (gameEntity == null) {
    gameEntity = new Game(gameId)
    gameEntity.requestId = event.params.requestId
  }

  gameEntity.playerAddress = event.params.player
  gameEntity.bet = event.params.bet
  gameEntity.coef = event.params.coef
  gameEntity.startedBlockNumber = event.block.number
  gameEntity.startedBlockTimestamp = event.block.timestamp
  gameEntity.startedTransactionHash = event.transaction.hash
  gameEntity.save()
}

export function handleDeposit(event: DepositEvent): void {
  saveVaultSnapshot(event)
}

export function handleWithdraw(event: WithdrawEvent): void {
  saveVaultSnapshot(event)
}

function loadOrCreateReferrer(address: Address): Referrer {
  let id = address.toHexString()
  let referrer = Referrer.load(id)

  if (referrer == null) {
    referrer = new Referrer(id)
    referrer.address = address
    referrer.totalRewardAssets = BigInt.zero()
    referrer.rewardCount = 0
    referrer.referredPlayers = 0
    referrer.referredWallets = 0
  }

  return referrer as Referrer
}

function loadOrCreateReferral(referee: Address, referrer: Referrer): Referral {
  let id = referee.toHexString()
  let referral = Referral.load(id)

  if (referral == null) {
    referral = new Referral(id)
    referral.referee = referee
    referral.referrer = referrer.id
    referral.totalRewardAssets = BigInt.zero()
    referral.rewardCount = 0
  }

  return referral as Referral
}

export function handleReferrerSettled(event: ReferrerSettledEvent): void {
  let referrer = loadOrCreateReferrer(event.params.referrer)
  let referral = loadOrCreateReferral(event.params.referee, referrer)

  if (referral.settledBlockNumber === null) {
    referrer.referredWallets = referrer.referredWallets + 1
  }

  referral.settledBlockNumber = event.block.number
  referral.settledBlockTimestamp = event.block.timestamp
  referral.settledTransactionHash = event.transaction.hash
  referral.save()

  referrer.save()
}

export function handleReferrerRewardIssued(event: ReferrerRewardIssuedEvent): void {
  let referrer = loadOrCreateReferrer(event.params.referrer)
  let referral = loadOrCreateReferral(event.params.player, referrer)
  let rewardAmount = event.params.rewardAmount

  let reward = new ReferralReward(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  )
  reward.referrer = referrer.id
  reward.referral = referral.id
  reward.player = event.params.player
  reward.assets = rewardAmount
  reward.blockNumber = event.block.number
  reward.blockTimestamp = event.block.timestamp
  reward.transactionHash = event.transaction.hash
  reward.logIndex = event.logIndex
  reward.save()

  if (referral.rewardCount == 0) {
    referrer.referredPlayers = referrer.referredPlayers + 1
  }

  if (referral.firstRewardAt === null) {
    referral.firstRewardAt = event.block.timestamp
  }

  referral.rewardCount = referral.rewardCount + 1
  referral.totalRewardAssets = referral.totalRewardAssets.plus(rewardAmount)
  referral.lastRewardAt = event.block.timestamp
  referral.save()

  if (referrer.firstRewardAt === null) {
    referrer.firstRewardAt = event.block.timestamp
  }

  referrer.rewardCount = referrer.rewardCount + 1
  referrer.totalRewardAssets = referrer.totalRewardAssets.plus(rewardAmount)
  referrer.lastRewardAt = event.block.timestamp
  referrer.save()
}
