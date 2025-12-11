export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' }
  }
  return { valid: true }
}

export const validateRequired = (value: string | undefined | null): boolean => {
  return !!value && value.trim().length > 0
}

export const validatePrice = (price: number): boolean => {
  return price > 0 && isFinite(price)
}


