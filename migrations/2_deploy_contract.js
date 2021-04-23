const DAO = artifacts.require('DAO');

module.exports = async function (deployer, _network, accounts) {
  await deployer.deploy(DAO, 5184000, 5184000, 2);
  const dao = await DAO.deployed();
  await Promise.all([
    dao.contribute({ from: accounts[1], value: 1000 }),
    dao.contribute({ from: accounts[2], value: 2000 }),
    dao.contribute({ from: accounts[3], value: 2000 }),
  ]);
  await dao.createProposal('Proposal 1', 100, accounts[3], {
    from: accounts[1],
  });
};
