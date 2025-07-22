export const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

export const validateEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

export const validatePassword = (password) => {
  return PASSWORD_REGEX.test(password);
};

export const getEmailError = (email) => {
  if (!email) return 'Email is required';
  if (!validateEmail(email)) return 'Please enter a valid email address';
  return '';
};

export const getPasswordError = (password) => {
  if (!password) return 'Password is required';
  if (!validatePassword(password)) {
    return 'Password must be at least 8 characters long and contain letters, numbers, and at least one special character (@$!%*#?&)';
  }
  return '';
}; 