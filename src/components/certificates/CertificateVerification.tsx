import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, CheckCircle, XCircle, Award } from 'lucide-react';
import CertificateVerifier from './CertificateVerifier';

const CertificateVerification = () => {
  const [certificateId, setCertificateId] = useState('');

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8">
      <CertificateVerifier certificateId={certificateId} />
    </div>
  );
};

export default CertificateVerification;