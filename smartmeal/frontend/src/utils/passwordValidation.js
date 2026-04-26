export const validatePassword = (password, userData = {}) => {
  const errors = [];
  
  // Length check
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }
  if (password.length > 64) {
    errors.push("Password must not exceed 64 characters");
  }
  
  // Character types check
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must include at least one number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must include at least one special character");
  }
  
  // User data check
  const appName = "smartrecipe";
  if (password.toLowerCase().includes(appName)) {
    errors.push("Password must not contain the application name");
  }
  
  if (userData) {
    const name = userData.name?.toLowerCase() || "";
    const email = userData.email?.toLowerCase() || "";
    const username = email.split("@")[0] || "";
    
    if (name && password.toLowerCase().includes(name)) {
      errors.push("Password must not contain your name");
    }
    if (email && password.toLowerCase().includes(email)) {
      errors.push("Password must not contain your email");
    }
    if (username && password.toLowerCase().includes(username)) {
      errors.push("Password must not contain your username");
    }
  }
  
  // Common passwords check
  const commonPasswords = [
    "password", "123456", "123456789", "12345", "12345678", "qwerty", "password123",
    "111111", "admin", "123123", "abc123", "password!", "Password123!", "welcome",
    "p@ssword", "login", "secret", "smartrecipe", "smartmeal", "user123"
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push("This is a common, weak password. Please choose a more unique one.");
  }
  
  return errors;
};

export const getPasswordStrength = (password) => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 12) strength += 20;
  if (/[A-Z]/.test(password)) strength += 20;
  if (/[a-z]/.test(password)) strength += 20;
  if (/\d/.test(password)) strength += 20;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 20;
  return strength;
};
