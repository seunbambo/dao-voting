pragma solidity ^0.5.2;

contract DAO {
  struct Proposal {
    uint id;
    string name;
    uint amount;
    address payable recipient;
    uint votes;
    uint end;
    bool executed;
  }

  mapping(address => bool) public investors;
  mapping(address => uint) public stakes;
  mapping(address => mapping(uint => bool)) public votes;
  mapping(uint => Proposal) public proposals;
  mapping(address => bool) public voters;
  uint public totalStakes;
  uint public availableFunds;
  uint public contributionEnd;
  uint public nextProposalId;
  uint public voteTime;
  uint public quorum;
  address public admin;

  constructor(
    uint contributionTime, 
    uint _voteTime,
    uint _quorum) 
    public {
    require(_quorum > 0 && _quorum < 100, 'quorum must be between 0 and 100');
    contributionEnd = now + contributionTime;
    voteTime = _voteTime;
    quorum = _quorum;
    admin = msg.sender;
  }

  function contribute() payable external {
    require(now < contributionEnd, 'cannot contribute after contributionEnd');
    investors[msg.sender] = true;
    stakes[msg.sender] += msg.value;
    totalStakes += msg.value;
    availableFunds += msg.value;
  }
    
  function transferStake(uint amount, address to) external {
    require(stakes[msg.sender] >= amount, 'not enough stakes');
    stakes[msg.sender] -= amount;
    stakes[to] += amount;
    investors[to] = true;
  }

  function createProposal(
    string memory name,
    uint amount,
    address payable recipient) 
    public 
    onlyInvestors() {
    require(availableFunds >= amount, 'amount too big');
    proposals[nextProposalId] = Proposal(
      nextProposalId,
      name,
      amount,
      recipient,
      0,
      now + voteTime,
      false
    );
    availableFunds -= amount;
    nextProposalId++;
  }

  function vote(uint proposalId) external onlyInvestors() {
    Proposal storage proposal = proposals[proposalId];
    require(votes[msg.sender][proposalId] == false, 'investor can only vote once for a proposal');
    require(now < proposal.end, 'can only vote until proposal end date');
    votes[msg.sender][proposalId] = true;
    proposal.votes += stakes[msg.sender];
  }

  function executeProposal(uint proposalId) external onlyAdmin() {
    Proposal storage proposal = proposals[proposalId];
    require(now >= proposal.end, 'cannot execute proposal before end date');
    require(proposal.executed == false, 'cannot execute proposal already executed');
    require(((proposal.votes * 100) / totalStakes) >= quorum, 'cannot execute proposal with votes # below quorum');
    
    proposal.executed = true;
    _transferEther(proposal.amount, proposal.recipient);
  }
  
  function _transferEther(uint amount, address payable to) internal {
    require(amount <= availableFunds, 'not enough availableFunds');
    availableFunds -= amount;
    to.transfer(amount);
  }

  //For ether returns of proposal investments
  function() payable external {
    availableFunds += msg.value;
  }

  modifier onlyInvestors() {
    require(investors[msg.sender] == true, 'only investors');
    _;
  }

  modifier onlyAdmin() {
    require(msg.sender == admin, 'only admin');
    _;
  }
}
