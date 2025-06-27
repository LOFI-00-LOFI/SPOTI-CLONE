// Generate a consistent gradient based on string input (track name or ID)
export const getGradientFromString = (input: string): string => {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-purple-500', 
    'from-green-500 to-blue-500',
    'from-yellow-500 to-red-500',
    'from-pink-500 to-yellow-500',
    'from-indigo-500 to-purple-500',
    'from-red-500 to-pink-500',
    'from-teal-500 to-green-500',
    'from-orange-500 to-red-500',
    'from-cyan-500 to-blue-500',
    'from-emerald-500 to-teal-500',
    'from-rose-500 to-pink-500',
    'from-violet-500 to-purple-500',
    'from-sky-500 to-blue-500',
    'from-amber-500 to-orange-500',
  ];
  
  // Create a hash from the input string
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use the hash to select a gradient consistently
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

// Get the first letter of a string, handling edge cases
export const getInitialLetter = (text: string): string => {
  return text && text.length > 0 ? text.charAt(0).toUpperCase() : '?';
}; 