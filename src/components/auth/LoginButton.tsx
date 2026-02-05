'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import AuthModal from './AuthModal';

export default function LoginButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="bg-white/90 backdrop-blur-sm border border-white/60 hover:bg-white text-slate-700 rounded-full px-5 h-10 font-medium shadow-sm hover:shadow-md transition-all duration-300"
      >
        Sign In
      </Button>
      <AuthModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
