import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  const checkoutStatus = searchParams.get('checkout');
  const isSuccess = checkoutStatus === 'success';
  
  useEffect(() => {
    if (isSuccess) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isSuccess, navigate]);
  
  if (!isSuccess) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-md p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Zahlung erfolgreich!</h2>
        <p className="text-gray-300 mb-6">
          Vielen Dank für deinen Kauf. Deine Zahlung wurde erfolgreich verarbeitet.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center mx-auto"
        >
          Zum Dashboard
          <ArrowRight className="ml-2" size={20} />
        </button>
        <p className="text-sm text-gray-400 mt-4">
          Du wirst in {countdown} Sekunden weitergeleitet...
        </p>
      </div>
    </motion.div>
  );
};

export default PaymentSuccess;