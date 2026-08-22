export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isStrongPassword = (password) => {
  return password.length >= 6;
};

export const validateLogin = (email, password) => {
  const errors = {};
  if (!email) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Invalid email format';
  if (!password) errors.password = 'Password is required';
  else if (!isStrongPassword(password)) errors.password = 'Password must be at least 6 characters';
  return errors;
};

export const validateRegister = (name, email, password, confirmPassword) => {
  const errors = {};
  if (!name) errors.name = 'Name is required';
  if (!email) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Invalid email format';
  if (!password) errors.password = 'Password is required';
  else if (!isStrongPassword(password)) errors.password = 'Password must be at least 6 characters';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  return errors;
};

export const validateItem = (title, category, location, description, status) => {
  const errors = {};
  if (!title?.trim()) errors.title = 'Title is required';
  if (!category) errors.category = 'Category is required';
  if (!location?.trim()) errors.location = 'Location is required';
  if (!description?.trim()) errors.description = 'Description is required';
  if (!status) errors.status = 'Status is required';
  return errors;
};

export const validateClaim = (message) => {
  const errors = {};
  if (!message?.trim()) errors.message = 'Message is required';
  return errors;
};
