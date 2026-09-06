import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
  createMockedFunction
} from "matchstick-as"
import {Address, BigInt, ethereum, Bytes} from "@graphprotocol/graph-ts"
import {
  handleGameReleased,
  handleGameStarted,
  handleDeposit,
  handleWithdraw,
  handleReferrerSettled,
  handleReferrerRewardIssued
} from "../src/lemon-jet-game"
import {
  createGameReleasedEvent,
  createGameStartedEvent,
  createDepositEvent,
  createWithdrawEvent,
  createReferrerSettledEvent,
  createReferrerRewardIssuedEvent
} from "./lemon-jet-game-utils"

const PROXY_ADDRESS = Address.fromString("0xf36fed68017F6E84D2EB1D4bD35AB56ae0cD914a")

describe("LemonJetGame Event Handlers", () => {
  beforeAll(() => {
    createMockedFunction(
      PROXY_ADDRESS,
      "totalAssets",
      "totalAssets():(uint256)"
    )
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1000000))])

    createMockedFunction(
      PROXY_ADDRESS,
      "totalSupply",
      "totalSupply():(uint256)"
    )
      .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(950000))])
  })

  afterAll(() => {
    clearStore()
  })

  test("handleGameReleased creates Game entity and VaultSnapshot", () => {
    clearStore()

    let requestId = BigInt.fromI32(1)
    let playerAddress = Address.fromString("0x0000000000000000000000000000000000000001")
    let payout = BigInt.fromI32(1000)
    let randomNumber = BigInt.fromI32(12345)
    let x = BigInt.fromI32(5)

    let gameReleasedEvent = createGameReleasedEvent(
      requestId,
      playerAddress,
      payout,
      randomNumber,
      x
    )

    gameReleasedEvent.block.number = BigInt.fromI32(100)
    gameReleasedEvent.block.timestamp = BigInt.fromI32(1000)
    gameReleasedEvent.transaction.hash = Bytes.fromHexString("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
    gameReleasedEvent.logIndex = BigInt.fromI32(0)

    handleGameReleased(gameReleasedEvent)

    let gameId = requestId.toString()

    assert.entityCount("Game", 1)
    assert.fieldEquals(
      "Game",
      gameId,
      "requestId",
      requestId.toString()
    )
    assert.fieldEquals(
      "Game",
      gameId,
      "playerAddress",
      playerAddress.toHexString()
    )
    assert.fieldEquals("Game", gameId, "payout", payout.toString())
    assert.fieldEquals(
      "Game",
      gameId,
      "randomNumber",
      randomNumber.toString()
    )
    assert.fieldEquals("Game", gameId, "x", x.toString())
    assert.fieldEquals(
      "Game",
      gameId,
      "releasedBlockNumber",
      gameReleasedEvent.block.number.toString()
    )
    assert.fieldEquals(
      "Game",
      gameId,
      "releasedBlockTimestamp",
      gameReleasedEvent.block.timestamp.toString()
    )

    let day = gameReleasedEvent.block.timestamp.div(BigInt.fromI32(86400))
    let snapshotId = day.toI32().toString()

    assert.entityCount("VaultSnapshot", 1)
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "totalAssets",
      "1000000"
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "totalSupply",
      "950000"
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "blockNumber",
      gameReleasedEvent.block.number.toString()
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "blockTimestamp",
      gameReleasedEvent.block.timestamp.toString()
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "day",
      day.toString()
    )
  })

  test("handleDeposit creates VaultSnapshot", () => {
    clearStore()

    let sender = Address.fromString("0x0000000000000000000000000000000000000001")
    let owner = Address.fromString("0x0000000000000000000000000000000000000002")
    let assets = BigInt.fromI32(5000)
    let shares = BigInt.fromI32(5000)

    let depositEvent = createDepositEvent(sender, owner, assets, shares)

    depositEvent.block.number = BigInt.fromI32(200)
    depositEvent.block.timestamp = BigInt.fromI32(2000)
    depositEvent.transaction.hash = Bytes.fromHexString("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890")
    depositEvent.logIndex = BigInt.fromI32(0)

    handleDeposit(depositEvent)

    let day = depositEvent.block.timestamp.div(BigInt.fromI32(86400))
    let snapshotId = day.toI32().toString()

    assert.entityCount("VaultSnapshot", 1)
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "totalAssets",
      "1000000"
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "totalSupply",
      "950000"
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "blockNumber",
      depositEvent.block.number.toString()
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "blockTimestamp",
      depositEvent.block.timestamp.toString()
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "day",
      day.toString()
    )
  })

  test("handleWithdraw creates VaultSnapshot", () => {
    clearStore()

    let sender = Address.fromString("0x0000000000000000000000000000000000000001")
    let receiver = Address.fromString("0x0000000000000000000000000000000000000002")
    let owner = Address.fromString("0x0000000000000000000000000000000000000003")
    let assets = BigInt.fromI32(3000)
    let shares = BigInt.fromI32(3000)

    let withdrawEvent = createWithdrawEvent(sender, receiver, owner, assets, shares)

    withdrawEvent.block.number = BigInt.fromI32(300)
    withdrawEvent.block.timestamp = BigInt.fromI32(3000)
    withdrawEvent.transaction.hash = Bytes.fromHexString("0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321")
    withdrawEvent.logIndex = BigInt.fromI32(0)

    handleWithdraw(withdrawEvent)

    let day = withdrawEvent.block.timestamp.div(BigInt.fromI32(86400))
    let snapshotId = day.toI32().toString()

    assert.entityCount("VaultSnapshot", 1)
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "totalAssets",
      "1000000"
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "totalSupply",
      "950000"
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "blockNumber",
      withdrawEvent.block.number.toString()
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "blockTimestamp",
      withdrawEvent.block.timestamp.toString()
    )
    assert.fieldEquals(
      "VaultSnapshot",
      snapshotId,
      "day",
      day.toString()
    )
  })

  test("handleGameReleased with multiple events in same day creates only one snapshot", () => {
    clearStore()

    let requestId1 = BigInt.fromI32(1)
    let requestId2 = BigInt.fromI32(2)
    let playerAddress = Address.fromString("0x0000000000000000000000000000000000000001")
    let payout = BigInt.fromI32(1000)
    let randomNumber = BigInt.fromI32(12345)
    let x = BigInt.fromI32(5)

    let timestamp1 = BigInt.fromI32(1000) // Day 0
    let timestamp2 = BigInt.fromI32(5000) // Still day 0 (less than 86400)

    let event1 = createGameReleasedEvent(
      requestId1,
      playerAddress,
      payout,
      randomNumber,
      x
    )
    event1.block.number = BigInt.fromI32(100)
    event1.block.timestamp = timestamp1
    event1.transaction.hash = Bytes.fromHexString("0x1111111111111111111111111111111111111111111111111111111111111111")
    event1.logIndex = BigInt.fromI32(0)

    let event2 = createGameReleasedEvent(
      requestId2,
      playerAddress,
      payout,
      randomNumber,
      x
    )
    event2.block.number = BigInt.fromI32(101)
    event2.block.timestamp = timestamp2
    event2.transaction.hash = Bytes.fromHexString("0x2222222222222222222222222222222222222222222222222222222222222222")
    event2.logIndex = BigInt.fromI32(0)

    handleGameReleased(event1)
    handleGameReleased(event2)

    assert.entityCount("Game", 2)
    assert.entityCount("VaultSnapshot", 1)
  })

  test("handleGameReleased with events in different days creates multiple snapshots", () => {
    clearStore()

    let requestId1 = BigInt.fromI32(1)
    let requestId2 = BigInt.fromI32(2)
    let playerAddress = Address.fromString("0x0000000000000000000000000000000000000001")
    let payout = BigInt.fromI32(1000)
    let randomNumber = BigInt.fromI32(12345)
    let x = BigInt.fromI32(5)

    let timestamp1 = BigInt.fromI32(1000) // Day 0
    let timestamp2 = BigInt.fromI32(90000) // Day 1 (86400 < 90000 < 172800)

    let event1 = createGameReleasedEvent(
      requestId1,
      playerAddress,
      payout,
      randomNumber,
      x
    )
    event1.block.number = BigInt.fromI32(100)
    event1.block.timestamp = timestamp1
    event1.transaction.hash = Bytes.fromHexString("0x1111111111111111111111111111111111111111111111111111111111111111")
    event1.logIndex = BigInt.fromI32(0)

    let event2 = createGameReleasedEvent(
      requestId2,
      playerAddress,
      payout,
      randomNumber,
      x
    )
    event2.block.number = BigInt.fromI32(101)
    event2.block.timestamp = timestamp2
    event2.transaction.hash = Bytes.fromHexString("0x2222222222222222222222222222222222222222222222222222222222222222")
    event2.logIndex = BigInt.fromI32(0)

    handleGameReleased(event1)
    handleGameReleased(event2)

    assert.entityCount("Game", 2)
    assert.entityCount("VaultSnapshot", 2)
  })

  test("handleGameStarted creates Game entity", () => {
    clearStore()

    let requestId = BigInt.fromI32(1)
    let playerAddress = Address.fromString("0x0000000000000000000000000000000000000001")
    let bet = BigInt.fromI32(5000)
    let coef = BigInt.fromI32(200)

    let gameStartedEvent = createGameStartedEvent(
      requestId,
      playerAddress,
      bet,
      coef
    )

    gameStartedEvent.block.number = BigInt.fromI32(100)
    gameStartedEvent.block.timestamp = BigInt.fromI32(1000)
    gameStartedEvent.transaction.hash = Bytes.fromHexString("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef")
    gameStartedEvent.logIndex = BigInt.fromI32(0)

    handleGameStarted(gameStartedEvent)

    let gameId = requestId.toString()

    assert.entityCount("Game", 1)
    assert.fieldEquals(
      "Game",
      gameId,
      "requestId",
      requestId.toString()
    )
    assert.fieldEquals(
      "Game",
      gameId,
      "playerAddress",
      playerAddress.toHexString()
    )
    assert.fieldEquals("Game", gameId, "bet", bet.toString())
    assert.fieldEquals("Game", gameId, "coef", coef.toString())
    assert.fieldEquals(
      "Game",
      gameId,
      "startedBlockNumber",
      gameStartedEvent.block.number.toString()
    )
    assert.fieldEquals(
      "Game",
      gameId,
      "startedBlockTimestamp",
      gameStartedEvent.block.timestamp.toString()
    )
    assert.fieldEquals(
      "Game",
      gameId,
      "startedTransactionHash",
      gameStartedEvent.transaction.hash.toHexString()
    )
  })

  test("handleGameStarted with multiple events creates multiple entities", () => {
    clearStore()

    let requestId1 = BigInt.fromI32(1)
    let requestId2 = BigInt.fromI32(2)
    let playerAddress = Address.fromString("0x0000000000000000000000000000000000000001")
    let bet = BigInt.fromI32(5000)
    let coef = BigInt.fromI32(200)

    let event1 = createGameStartedEvent(
      requestId1,
      playerAddress,
      bet,
      coef
    )
    event1.block.number = BigInt.fromI32(100)
    event1.block.timestamp = BigInt.fromI32(1000)
    event1.transaction.hash = Bytes.fromHexString("0x1111111111111111111111111111111111111111111111111111111111111111")
    event1.logIndex = BigInt.fromI32(0)

    let event2 = createGameStartedEvent(
      requestId2,
      playerAddress,
      bet,
      coef
    )
    event2.block.number = BigInt.fromI32(101)
    event2.block.timestamp = BigInt.fromI32(2000)
    event2.transaction.hash = Bytes.fromHexString("0x2222222222222222222222222222222222222222222222222222222222222222")
    event2.logIndex = BigInt.fromI32(0)

    handleGameStarted(event1)
    handleGameStarted(event2)

    assert.entityCount("Game", 2)
  })

  test("handleGameStarted and handleGameReleased with same requestId merge into one Game entity", () => {
    clearStore()

    let requestId = BigInt.fromI32(1)
    let playerAddress = Address.fromString("0x0000000000000000000000000000000000000001")
    let bet = BigInt.fromI32(5000)
    let coef = BigInt.fromI32(200)
    let payout = BigInt.fromI32(1000)
    let randomNumber = BigInt.fromI32(12345)
    let x = BigInt.fromI32(5)

    // First, handle GameStarted event
    let gameStartedEvent = createGameStartedEvent(
      requestId,
      playerAddress,
      bet,
      coef
    )
    gameStartedEvent.block.number = BigInt.fromI32(100)
    gameStartedEvent.block.timestamp = BigInt.fromI32(1000)
    gameStartedEvent.transaction.hash = Bytes.fromHexString("0x1111111111111111111111111111111111111111111111111111111111111111")
    gameStartedEvent.logIndex = BigInt.fromI32(0)

    handleGameStarted(gameStartedEvent)

    // Then, handle GameReleased event with the same requestId
    let gameReleasedEvent = createGameReleasedEvent(
      requestId,
      playerAddress,
      payout,
      randomNumber,
      x
    )
    gameReleasedEvent.block.number = BigInt.fromI32(200)
    gameReleasedEvent.block.timestamp = BigInt.fromI32(2000)
    gameReleasedEvent.transaction.hash = Bytes.fromHexString("0x2222222222222222222222222222222222222222222222222222222222222222")
    gameReleasedEvent.logIndex = BigInt.fromI32(0)

    handleGameReleased(gameReleasedEvent)

    let gameId = requestId.toString()

    // Should have only one Game entity with both started and released data
    assert.entityCount("Game", 1)
    assert.fieldEquals("Game", gameId, "requestId", requestId.toString())
    assert.fieldEquals("Game", gameId, "playerAddress", playerAddress.toHexString())
    assert.fieldEquals("Game", gameId, "bet", bet.toString())
    assert.fieldEquals("Game", gameId, "coef", coef.toString())
    assert.fieldEquals("Game", gameId, "payout", payout.toString())
    assert.fieldEquals("Game", gameId, "randomNumber", randomNumber.toString())
    assert.fieldEquals("Game", gameId, "x", x.toString())
    assert.fieldEquals("Game", gameId, "startedBlockNumber", gameStartedEvent.block.number.toString())
    assert.fieldEquals("Game", gameId, "releasedBlockNumber", gameReleasedEvent.block.number.toString())
  })
})


const REFERRER_ADDRESS = Address.fromString("0x867f932d4be792239bce45a1e576118debb7c750")
const FIRST_PLAYER = Address.fromString("0x00000000000000000000000000000000000000a1")
const SECOND_PLAYER = Address.fromString("0x00000000000000000000000000000000000000a2")

describe("Referral Event Handlers", () => {
  afterAll(() => {
    clearStore()
  })

  test("handleReferrerSettled links the referral and counts the wallet once", () => {
    clearStore()

    let settledEvent = createReferrerSettledEvent(FIRST_PLAYER, REFERRER_ADDRESS)
    settledEvent.block.number = BigInt.fromI32(50829447)
    settledEvent.block.timestamp = BigInt.fromI32(1788000000)
    settledEvent.transaction.hash = Bytes.fromHexString("0x1111111111111111111111111111111111111111111111111111111111111111")
    settledEvent.logIndex = BigInt.fromI32(2)

    handleReferrerSettled(settledEvent)
    handleReferrerSettled(settledEvent)

    assert.entityCount("Referrer", 1)
    assert.entityCount("Referral", 1)
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "referredWallets", "1")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "referredPlayers", "0")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "rewardCount", "0")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "totalRewardAssets", "0")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "address", REFERRER_ADDRESS.toHexString())

    let referralId = FIRST_PLAYER.toHexString()
    assert.fieldEquals("Referral", referralId, "referrer", REFERRER_ADDRESS.toHexString())
    assert.fieldEquals("Referral", referralId, "referee", FIRST_PLAYER.toHexString())
    assert.fieldEquals("Referral", referralId, "settledBlockNumber", "50829447")
    assert.fieldEquals("Referral", referralId, "settledBlockTimestamp", "1788000000")
    assert.fieldEquals("Referral", referralId, "rewardCount", "0")
  })

  test("handleReferrerRewardIssued accumulates the exact assets per referrer", () => {
    clearStore()

    let settledEvent = createReferrerSettledEvent(FIRST_PLAYER, REFERRER_ADDRESS)
    settledEvent.block.number = BigInt.fromI32(50829447)
    settledEvent.block.timestamp = BigInt.fromI32(1788000000)
    handleReferrerSettled(settledEvent)

    let firstReward = createReferrerRewardIssuedEvent(
      REFERRER_ADDRESS,
      FIRST_PLAYER,
      BigInt.fromString("30000000000000000")
    )
    firstReward.block.number = BigInt.fromI32(50829447)
    firstReward.block.timestamp = BigInt.fromI32(1788000000)
    firstReward.transaction.hash = Bytes.fromHexString("0x2222222222222222222222222222222222222222222222222222222222222222")
    firstReward.logIndex = BigInt.fromI32(3)

    let secondReward = createReferrerRewardIssuedEvent(
      REFERRER_ADDRESS,
      FIRST_PLAYER,
      BigInt.fromString("45000000000000000")
    )
    secondReward.block.number = BigInt.fromI32(50829500)
    secondReward.block.timestamp = BigInt.fromI32(1788000100)
    secondReward.transaction.hash = Bytes.fromHexString("0x3333333333333333333333333333333333333333333333333333333333333333")
    secondReward.logIndex = BigInt.fromI32(7)

    handleReferrerRewardIssued(firstReward)
    handleReferrerRewardIssued(secondReward)

    assert.entityCount("ReferralReward", 2)
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "rewardCount", "2")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "referredPlayers", "1")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "referredWallets", "1")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "totalRewardAssets", "75000000000000000")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "firstRewardAt", "1788000000")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "lastRewardAt", "1788000100")

    let referralId = FIRST_PLAYER.toHexString()
    assert.fieldEquals("Referral", referralId, "rewardCount", "2")
    assert.fieldEquals("Referral", referralId, "totalRewardAssets", "75000000000000000")
    assert.fieldEquals("Referral", referralId, "lastRewardAt", "1788000100")

    let rewardId = secondReward.transaction.hash.toHexString() + "-7"
    assert.fieldEquals("ReferralReward", rewardId, "referrer", REFERRER_ADDRESS.toHexString())
    assert.fieldEquals("ReferralReward", rewardId, "referral", referralId)
    assert.fieldEquals("ReferralReward", rewardId, "player", FIRST_PLAYER.toHexString())
    assert.fieldEquals("ReferralReward", rewardId, "assets", "45000000000000000")
    assert.fieldEquals("ReferralReward", rewardId, "blockNumber", "50829500")
    assert.fieldEquals("ReferralReward", rewardId, "logIndex", "7")
  })

  test("handleReferrerRewardIssued counts a player without a settled referral", () => {
    clearStore()

    let firstPlayerReward = createReferrerRewardIssuedEvent(
      REFERRER_ADDRESS,
      FIRST_PLAYER,
      BigInt.fromString("30000000000000000")
    )
    firstPlayerReward.block.number = BigInt.fromI32(50829447)
    firstPlayerReward.block.timestamp = BigInt.fromI32(1788000000)
    firstPlayerReward.transaction.hash = Bytes.fromHexString("0x4444444444444444444444444444444444444444444444444444444444444444")
    firstPlayerReward.logIndex = BigInt.fromI32(1)

    let secondPlayerReward = createReferrerRewardIssuedEvent(
      REFERRER_ADDRESS,
      SECOND_PLAYER,
      BigInt.fromString("30000000000000000")
    )
    secondPlayerReward.block.number = BigInt.fromI32(50829448)
    secondPlayerReward.block.timestamp = BigInt.fromI32(1788000002)
    secondPlayerReward.transaction.hash = Bytes.fromHexString("0x5555555555555555555555555555555555555555555555555555555555555555")
    secondPlayerReward.logIndex = BigInt.fromI32(1)

    handleReferrerRewardIssued(firstPlayerReward)
    handleReferrerRewardIssued(secondPlayerReward)

    assert.entityCount("Referral", 2)
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "referredPlayers", "2")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "referredWallets", "0")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "rewardCount", "2")
    assert.fieldEquals("Referrer", REFERRER_ADDRESS.toHexString(), "totalRewardAssets", "60000000000000000")
    assert.fieldEquals("Referral", SECOND_PLAYER.toHexString(), "referrer", REFERRER_ADDRESS.toHexString())
  })
})
