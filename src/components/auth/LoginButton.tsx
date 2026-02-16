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
        className="bg-[#0EA885] hover:bg-[#0EA885]/90 text-white h-8 px-4 font-medium text-[13px] tracking-wide shadow-none border-0 transition-colors"
      >
        Sign In
      </Button>
      <AuthModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
