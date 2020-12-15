require("web3");

const DappToken = artifacts.require("DappToken");
const DaiToken = artifacts.require("DaiToken");
const TokenFarm = artifacts.require("TokenFarm");

require("chai")
  .use(require("chai-as-promised"))
  .should()

function tokens(n) {
  return web3.utils.toWei(n, "ether");
}

contract("TokenFarm", (accounts) => {
  let daiToken, dappToken, tokenFarm

  before(async() => {
    // load contracts
    daiToken = await DaiToken.new()
    dappToken = await DappToken.new()
    tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

    // transfer all dapp tokens to the token farm
    await dappToken.transfer(tokenFarm.address, tokens('100000'))

    // transfer tokens to investor
    await daiToken.transfer(accounts[1], tokens("100"), { from: accounts[0]})
  })


  describe("Mock Dai Deployment", async () => {
    it('has a name', async () => {
      const name = await daiToken.name()
      assert.equal(name, "Mock DAI Token")
    })
  })

  describe("Farming Tokens", async () => {
    it("rewards investors for staking tokens", async() => {
      let result;

      result = await daiToken.balanceOf(accounts[1])
      assert.equal(result.toString(), tokens('100'), "Incorrect balance before staking")

      // stake mock dai tokens
      await daiToken.approve(tokenFarm.address, tokens('100'), { from: accounts[1] })
      await tokenFarm.stakeTokens(tokens('100'), { from: accounts[1] })

      // check staking result
      result = await daiToken.balanceOf(accounts[1])
      assert.equal(result.toString(), tokens('0'), "Incorrect balance after staking")

      // check token farm balance
      result = await daiToken.balanceOf(tokenFarm.address)
      assert.equal(result.toString(), tokens('100'), "Token farm balance incorrect")


      result = await tokenFarm.stakingBalance(accounts[1])
      assert.equal(result.toString(), tokens('100'), "Investor staking balance incorrect after staking")

      result = await tokenFarm.isStaking(accounts[1])
      assert.equal(result.toString(), 'true', "Investor staking status incorrect")


      // Issue tokens
      await tokenFarm.issueTokens({ from: accounts[0] })

      // check balance of investors
      result = await dappToken.balanceOf(accounts[1])
      assert.equal(result.toString(), tokens('100'), "Incorrect dapp token balance after issueing tokens")

      // ensure only owner can call issue tokens
      await tokenFarm.issueTokens({ from: accounts[1]}).should.be.rejected;


      // unstake tokens
      await tokenFarm.unstakeTokens({ from: accounts[1] })

      // check balance after unstake
      result = await daiToken.balanceOf(accounts[1])
      assert.equal(result.toString(), tokens('100'), "Incorrect dai token balance after unstaking tokens")

      // check balance of farm after unstake
      result = await daiToken.balanceOf(tokenFarm.address)
      assert.equal(result.toString(), tokens('0'), "Incorrect token farm dai token balance after unstaking tokens")

      // check investor staking balance
      result = await tokenFarm.stakingBalance(accounts[1])
      assert.equal(result.toString(), tokens('0'), "Incorrect staking balance after unstaking tokens")

      // check if investor is still staking
      result = await tokenFarm.isStaking(accounts[1])
      assert.equal(result.toString(), 'false', "Incorrect staking status after unstaking tokens")
    })
  })
})