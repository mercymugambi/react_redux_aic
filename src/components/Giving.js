import React, { useState } from 'react';
import axios from 'axios';

const Giving = () => {
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleGiving = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/v1/payment', {
        phone,
        amount: amount || 100 // Default amount if not provided
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Failed to send payment request. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full">
        <h2 className="text-2xl font-semibold mb-4">M-Pesa Contribution Request</h2>

        {/* Phone Number Input with Label */}
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
            Enter Phone Number:
          </label>
          <input
            type="text"
            id="phone"
            placeholder="(e.g., 2547XXXXXXXX)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Amount Input with Label */}
        <div className="mb-4">
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
            Enter Amount:
          </label>
          <input
            type="number"
            id="amount"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Submit Button with Label */}
        <button
          onClick={handleGiving}
          disabled={loading}
          className={`w-full mt-4 py-2 px-4 rounded-md bg-blue-600 text-white font-semibold shadow transition duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Sending...' : 'Send Payment Request'}
        </button>

        {message && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
      </div>
    </section>
  );
};

export default Giving;
