import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  GameReleased,
  Deposit,
  Withdraw
} from "../generated/LemonJetGame/LemonJetGame"

export function createGameReleasedEvent(
  requestId: BigInt,
  playerAddress: Address,
  payout: BigInt,
  randomNumber: BigInt,
  x: BigInt
): GameReleased {
  let gameReleasedEvent = changetype<GameReleased>(newMockEvent())

  gameReleasedEvent.parameters = []

  gameReleasedEvent.parameters.push(
    new ethereum.EventParam(
      "requestId",
      ethereum.Value.fromUnsignedBigInt(requestId)
    )
  )
  gameReleasedEvent.parameters.push(
    new ethereum.EventParam(
      "playerAddress",
      ethereum.Value.fromAddress(playerAddress)
    )
  )
  gameReleasedEvent.parameters.push(
    new ethereum.EventParam("payout", ethereum.Value.fromUnsignedBigInt(payout))
  )
  gameReleasedEvent.parameters.push(
    new ethereum.EventParam(
      "randomNumber",
      ethereum.Value.fromUnsignedBigInt(randomNumber)
    )
  )
  gameReleasedEvent.parameters.push(
    new ethereum.EventParam("x", ethereum.Value.fromUnsignedBigInt(x))
  )

  return gameReleasedEvent
}

export function createDepositEvent(
  sender: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt
): Deposit {
  let depositEvent = changetype<Deposit>(newMockEvent())

  depositEvent.parameters = []

  depositEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  )
  depositEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return depositEvent
}

export function createWithdrawEvent(
  sender: Address,
  receiver: Address,
  owner: Address,
  assets: BigInt,
  shares: BigInt
): Withdraw {
  let withdrawEvent = changetype<Withdraw>(newMockEvent())

  withdrawEvent.parameters = []

  withdrawEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("receiver", ethereum.Value.fromAddress(receiver))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("assets", ethereum.Value.fromUnsignedBigInt(assets))
  )
  withdrawEvent.parameters.push(
    new ethereum.EventParam("shares", ethereum.Value.fromUnsignedBigInt(shares))
  )

  return withdrawEvent
}

