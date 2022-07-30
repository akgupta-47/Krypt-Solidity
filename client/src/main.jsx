import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import TransactionsProvier from './context/TransactionContext';

ReactDOM.render(
  <TransactionsProvier>
      <App />
  </TransactionsProvier>,
  document.getElementById('root')
);
