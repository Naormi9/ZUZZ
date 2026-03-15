'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@zuzz/ui';
import { shareListing, hapticLight } from '@/lib/mobile';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Share button component that uses native share sheet on mobile
 * and Web Share API / clipboard on web.
 */
export function ShareButton({
  title,
  text,
  url,
  className,
  variant = 'outline',
  size = 'sm',
}: ShareButtonProps) {
  const handleShare = async () => {
    await hapticLight();
    await shareListing({ title, text, url });
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleShare}>
      <Share2 className="h-4 w-4" />
      <span className="mr-1.5">שתף</span>
    </Button>
  );
}
