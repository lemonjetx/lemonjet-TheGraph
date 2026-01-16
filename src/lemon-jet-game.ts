import {
  GameReleased as GameReleasedEvent,
  GameStarted as GameStartedEvent,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent
} from "../generated/LemonJetGame/LemonJetGame"
import { GameReleased, GameStarted, VaultSnapshot } from "../generated/schema"
import { LemonJetGame } from "../generated/LemonJetGame/LemonJetGame"
import { Address, ethereum, BigInt } from "@graphprotocol/graph-ts"

const PROXY_ADDRESS = Address.fromString("0x28f4df2bd04587f0fd979117f46af9cf1f03ddc2")
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
  let gameId = event.block.number.toI32().toString() + "-" + event.logIndex.toI32().toString()

  let gameEntity = new GameReleased(gameId)
  gameEntity.requestId = event.params.requestId
  gameEntity.playerAddress = event.params.playerAddress
  gameEntity.payout = event.params.payout
  gameEntity.randomNumber = event.params.randomNumber
  gameEntity.x = event.params.x
  gameEntity.blockNumber = event.block.number
  gameEntity.blockTimestamp = event.block.timestamp
  gameEntity.transactionHash = event.transaction.hash
  gameEntity.save()

  saveVaultSnapshot(event)
}

export function handleGameStarted(event: GameStartedEvent): void {
  let gameId = event.block.number.toI32().toString() + "-" + event.logIndex.toI32().toString()

  let gameEntity = new GameStarted(gameId)
  gameEntity.requestId = event.params.requestId
  gameEntity.playerAddress = event.params.player
  gameEntity.bet = event.params.bet
  gameEntity.coef = event.params.coef
  gameEntity.blockNumber = event.block.number
  gameEntity.blockTimestamp = event.block.timestamp
  gameEntity.transactionHash = event.transaction.hash
  gameEntity.save()
}

export function handleDeposit(event: DepositEvent): void {
  saveVaultSnapshot(event)
}

export function handleWithdraw(event: WithdrawEvent): void {
  saveVaultSnapshot(event)
}
