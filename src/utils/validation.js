// Validation Utilities
// File: src/utils/validation.js

export const validateAddress = (address) => {
  if (!address) return false;
  // XRP address validation (starts with r, 25-34 characters)
  const xrpRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
  // Coreum address validation (starts with core, bech32)
  const coreumRegex = /^core[a-z0-9]{39,59}$/;
  
  return xrpRegex.test(address) || coreumRegex.test(address);
};

export const validatePrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0 && num < 1000000000;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload JPEG, PNG, GIF, or WebP.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 10MB.' };
  }
  
  return { valid: true };
};

export const validateNFTMetadata = (metadata) => {
  const errors = {};
  
  if (!metadata.name || metadata.name.trim().length < 3) {
    errors.name = 'Name must be at least 3 characters';
  }
  
  if (!metadata.description || metadata.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }
  
  if (metadata.price && !validatePrice(metadata.price)) {
    errors.price = 'Invalid price';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

