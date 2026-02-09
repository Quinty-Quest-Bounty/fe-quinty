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
        className="bg-white/90 hover:bg-white text-[#0EA885] h-8 px-3 font-medium text-xs tracking-wide shadow-none border-0 transition-colors"
      >
        Sign In
      </Button>
      <AuthModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
