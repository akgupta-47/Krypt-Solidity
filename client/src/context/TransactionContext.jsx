import React, { useEffect, useState } from 'react';
// ethers help in all waller opertions in javascript
import { ethers } from 'ethers';

import { contractABI, contractAddress } from '../utils/constants';

export const TransactionContext = React.createContext();

// metamask helps to provide this on window object
const { ethereum } = window;

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(ethereum);
  const signer = provider.getSigner();
  // we need 3 things to get out contract
  const transactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer
  );

  return transactionContract;
};

const TransactionsProvider = (props) => {
  const [formData, setformData] = useState({
    addressTo: '',
    amount: '',
    keyword: '',
    message: '',
  });
  const [currentAccount, setCurentAccount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(
    localStorage.getItem('transactionCount')
  );
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    // the input field would have a 'name' property and formData has all properties with those names, so here [name] will match the property from form data and update the value.
    setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) return alert('Please install Metamask!!');
      const transactionsContract = getEthereumContract();

      const availableTransactions =
        await transactionsContract.getAllTransactions();

        const structuredTransactions = availableTransactions.map((transaction) => ({
          addressTo: transaction.receiver,
          addressFrom: transaction.sender,
          timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
          message: transaction.message,
          keyword: transaction.keyword,
          amount: parseInt(transaction.amount._hex) / (10 ** 18)
        }));

        setTransactions(structuredTransactions);
    } catch (error) {
      console.log(error);

      throw new Error('No ethreum object.');
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) return alert('Please install Metamask!!');
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length) {
        setCurentAccount(accounts[0]);
        console.log(accounts);
        getAllTransactions();
      } else {
        console.log('No accounts found');
      }
    } catch (error) {
      console.log(error);

      throw new Error('No ethreum object.');
    }
  };

  const checkIfTransactionExists = async () => {
    try {
      const transactionsContract = getEthereumContract();
      const transactionsCount =
        await transactionsContract.getTransactionCount();

      window.localStorage.setItem('transactionCount', transactionsCount);
    } catch (error) {
      console.log(error);

      throw new Error('No ethreum object.');
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert('Please install metamask');

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      setCurentAccount(accounts[0]);
    } catch (error) {
      console.log(error);

      throw new Error('No ethreum object.');
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return alert('Please install metamask');

      const { addressTo, amount, keyword, message } = formData;
      const transactionsContract = getEthereumContract();
      const parsedAmount = ethers.utils.parseEther(amount);

      await ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: currentAccount,
            to: addressTo,
            gas: '0x5208', // 21000 gwei
            value: parsedAmount._hex,
          },
        ],
      });

      const transactionHash = await transactionsContract.addToBlockchain(
        addressTo,
        parsedAmount,
        message,
        keyword
      );

      setIsLoading(true);
      console.log(`Loading - ${transactionHash.hash}`);
      // this will wait for the transaction to be over
      await transactionHash.wait();
      console.log(`Success - ${transactionHash.hash}`);
      setIsLoading(false);

      const transactionsCount =
        await transactionsContract.getTransactionCount();

      setTransactionCount(transactionsCount.toNumber());
    } catch (error) {
      console.log(error);

      throw new Error('No ethreum object.');
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    checkIfTransactionExists();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        connectWallet,
        currentAccount,
        formData,
        sendTransaction,
        handleChange,
        transactions,
        isLoading,
      }}
    >
      {props.children}
    </TransactionContext.Provider>
  );
};

export default TransactionsProvider;
