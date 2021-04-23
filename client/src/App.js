import React, { useEffect, useState } from 'react';
import DAO from './contracts/DAO.json';
import { getWeb3 } from './utils.js';

import './App.css';

function App() {
  const [web3, setWeb3] = useState(undefined);
  const [accounts, setAccounts] = useState(undefined);
  const [contract, setContract] = useState(undefined);
  const [admin, setAdmin] = useState(undefined);
  const [stakes, setStakes] = useState(undefined);
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const networkId = await web3.eth.net.getId();

      if (networkId !== 4) {
        return (
          <div>
            Please install Metamask plugin and ensure you switch to Rinkeby Test
            Network.
          </div>
        );
      }
      const deployedNetwork = DAO.networks[networkId];
      const contract = new web3.eth.Contract(
        DAO.abi,
        deployedNetwork && deployedNetwork.address
      );

      const admin = await contract.methods.admin().call();

      setWeb3(web3);
      setAccounts(accounts);
      setContract(contract);
      setAdmin(admin);
    };
    init();
    window.ethereum.on('accountsChanged', (accounts) => {
      setAccounts(accounts);
    });
  }, []);

  const isReady = () => {
    return (
      typeof contract !== 'undefined' &&
      typeof web3 !== 'undefined' &&
      typeof accounts !== 'undefined' &&
      typeof admin !== 'undefined'
    );
  };

  useEffect(() => {
    if (isReady()) {
      updateStakes();
      updateProposals();
    }
  }, [accounts, contract, web3, admin]);

  async function updateStakes() {
    const stakes = await contract.methods.stakes(accounts[0]).call();
    setStakes(stakes);
  }

  async function updateProposals() {
    const nextProposalId = parseInt(
      await contract.methods.nextProposalId().call()
    );

    const proposals = [];
    for (let i = 0; i < nextProposalId; i++) {
      const [proposal, hasVoted] = await Promise.all([
        contract.methods.proposals(i).call(),
        contract.methods.votes(accounts[0], i).call(),
      ]);
      proposals.push({ ...proposal, hasVoted });
    }
    setProposals(proposals);
  }

  async function executeProposal(proposalId) {
    await contract.methods
      .executeProposal(proposalId)
      .send({ from: accounts[0] });
    await updateProposals();
  }

  async function withdraw(e) {
    e.preventDefault();
    const amount = e.target.elements[0].value;
    const to = e.target.elements[1].value;
    await contract.methods
      .withdrawEther(amount, to)
      .send({ from: accounts[0] });
  }

  async function contribute(e) {
    e.preventDefault();
    const amount = e.target.elements[0].value;
    await contract.methods
      .contribute()
      .send({ from: accounts[0], value: amount });
    await updateStakes();
  }

  async function redeemStakes(e) {
    e.preventDefault();
    const amount = e.target.elements[0].value;
    await contract.methods.redeemStake(amount).send({ from: accounts[0] });
    await updateStakes();
  }

  async function transferStakes(e) {
    e.preventDefault();
    const amount = e.target.elements[0].value;
    const address = e.target.elements[1].value;
    await contract.methods
      .transferStake(amount, address)
      .send({ from: accounts[0] });
    await updateStakes();
  }

  async function vote(ballotId) {
    await contract.methods.vote(ballotId).send({ from: accounts[0] });
    await updateProposals();
  }

  async function createProposal(e) {
    e.preventDefault();
    const name = e.target.elements[0].value;
    const amount = e.target.elements[1].value;
    const recipient = e.target.elements[2].value;
    await contract.methods
      .createProposal(name, amount, recipient)
      .send({ from: accounts[0] });
    await updateProposals();
  }

  function isFinished(proposal) {
    const now = new Date().getTime();
    const proposalEnd = new Date(parseInt(proposal.end) * 1000);
    return proposalEnd > now > 0 ? false : true;
  }

  if (!isReady()) {
    // return <div>Loading...</div>;
    return (
      <div>
        Please install Metamask plugin and ensure you switch to Rinkeby Test
        Network.
      </div>
    );
  } else {
    return (
      <div>
        <nav className='navbar navbar-expand-lg navbar-dark bg-secondary shadow mb-5'>
          <h1 className='mx-auto text-center text-light'>DAO</h1>
        </nav>
        <div className='container'>
          <div className='col-md-6 mx-auto'>
            <p>Stakes: {stakes}</p>

            <div className='row'>
              <div className='col-sm-12'>
                <h2>Contribute</h2>
                <form onSubmit={(e) => contribute(e)}>
                  <div className='form-group'>
                    <label htmlFor='amount'>Amount</label>
                    <input type='text' className='form-control' id='amount' />
                  </div>
                  <button type='submit' className='btn btn-info'>
                    <i className='fas fa-plus-circle'></i> Contribute
                  </button>
                </form>
              </div>
            </div>

            <hr />

            <div className='row'>
              <div className='col-sm-12'>
                <h2>Transfer stake</h2>
                <form onSubmit={(e) => transferStakes(e)}>
                  <div className='form-group'>
                    <label htmlFor='amount'>Amount</label>
                    <input
                      type='text'
                      className='form-control form-group'
                      id='amount'
                    />
                    <label htmlFor='address'>Address</label>
                    <input type='text' className='form-control' id='address' />
                  </div>
                  <button type='submit' className='btn btn-info'>
                    <i class='fa fa-paper-plane'></i> Transfer
                  </button>
                </form>
              </div>
            </div>

            <hr />

            <div className='row'>
              <div className='col-sm-12'>
                <h2>Create proposal</h2>
                <form onSubmit={(e) => createProposal(e)}>
                  <div className='form-group'>
                    <label htmlFor='name'>Name</label>
                    <input type='text' className='form-control' id='name' />
                  </div>
                  <div className='form-group'>
                    <label htmlFor='amount'>Amount</label>
                    <input type='text' className='form-control' id='amount' />
                  </div>
                  <div className='form-group'>
                    <label htmlFor='recipient'>Recipient</label>
                    <input
                      type='text'
                      className='form-control'
                      id='recipient'
                    />
                  </div>
                  <button type='submit' className='btn btn-info'>
                    <i class='fas fa-scroll'></i> Create Proposal
                  </button>
                </form>
              </div>
            </div>

            <hr />
          </div>

          <div className='row'>
            <div className='col-sm-12'>
              <h2>Proposals</h2>
              <table className='table table-responsive table-bordered table-striped'>
                <thead style={{ background: '#888888', color: 'white' }}>
                  <tr>
                    <th>Id</th>
                    <th>Name</th>
                    <th>Amount</th>
                    <th>Recipient</th>
                    <th>Votes</th>
                    <th>Vote</th>
                    <th>Ends on</th>
                    <th>Executed</th>
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((proposal) => (
                    <tr key={proposal.id}>
                      <td>{proposal.id}</td>
                      <td>{proposal.name}</td>
                      <td>{proposal.amount}</td>
                      <td>{proposal.recipient}</td>
                      <td>{proposal.votes}</td>
                      <td>
                        {isFinished(proposal) ? (
                          'Vote finished'
                        ) : proposal.hasVoted ? (
                          'You already voted'
                        ) : (
                          <button
                            onClick={(e) => vote(proposal.id)}
                            type='submit'
                            className='btn btn-outline-info'
                          >
                            Vote
                          </button>
                        )}
                      </td>
                      <td>
                        {new Date(
                          parseInt(proposal.end) * 1000
                        ).toLocaleString()}
                      </td>
                      <td>
                        {proposal.executed ? (
                          'Yes'
                        ) : admin.toLowerCase() ===
                          accounts[0].toLowerCase() ? (
                          <button
                            onClick={(e) => executeProposal(proposal.id)}
                            type='submit'
                            className='btn btn-info'
                          >
                            Execute
                          </button>
                        ) : (
                          'No'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
