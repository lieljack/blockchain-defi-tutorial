// SPDX-License-Identifier: MIT
pragma solidity ^0.5.16;

import "./DaiToken.sol";
import "./DappToken.sol";

contract TokenFarm {
  string public name = "Token Farm";
  DappToken public dappToken;
  DaiToken public daiToken;
  address public owner;

  address [] public stakers;
  mapping(address => uint) public stakingBalance;
  mapping(address => bool) public hasStaked;
  mapping(address => bool) public isStaking;

  constructor(DappToken _dappToken, DaiToken _daiToken) public {
    dappToken = _dappToken;
    daiToken = _daiToken;
    owner = msg.sender;
  }

  // Stake tokens
  function stakeTokens(uint _amount) public {
    require(_amount > 0, "Amount cannot be 0");

    daiToken.transferFrom(msg.sender, address(this), _amount);

    // update staking balance
    stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;

    // add users to stakers array
    if(!hasStaked[msg.sender]) {
      stakers.push(msg.sender);
    }

    isStaking[msg.sender] = true;
    hasStaked[msg.sender] = true;
  }

  // Issuing tokens
  function issueTokens() public {
    require(msg.sender == owner, "Caller must be the owner");

    for(uint i = 0; i<stakers.length; i++) {
      address recipient = stakers[i];
      uint balance = stakingBalance[recipient];
      if(balance > 0) {
        dappToken.transfer(recipient, balance);
      }
    }
  }

  // Unstake tokens
  function unstakeTokens() public {
    // fetch staking balance
    uint balance = stakingBalance[msg.sender];

    // require amount to be greater than 0
    require(balance > 0, "Insufficient balance");

    daiToken.transfer(msg.sender, balance);

    // reset staking balance
    stakingBalance[msg.sender] = 0;
    isStaking[msg.sender] = false;
  }
}
