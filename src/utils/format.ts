/**
 * Format Ethereum address to shortened version
 * @param address - Full Ethereum address
 * @param chars - Number of characters to show on each side (default: 4)
 * @returns Formatted address like "0x1234...5678"
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

/**
 * Format username from email or existing username
 * @param email - User email
 * @param existingUsername - Existing username if available
 * @returns Formatted username
 */
export function formatUsername(email?: string, existingUsername?: string): string {
  if (existingUsername) return existingUsername;
  if (email) return email.split('@')[0];
  return 'User';
}

/**
 * Get initials from name or username
 * @param name - Full name or username
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
