export const formatExpiryDate = (expiryDate: string): string => {
  const date = new Date(expiryDate)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return 'Expired'
  } else if (diffDays === 0) {
    return 'Expires today'
  } else if (diffDays === 1) {
    return 'Expires tomorrow'
  } else {
    return `Expires in ${diffDays} days`
  }
}

export const getExpiryStatus = (expiryDate: string | undefined): { status: 'expired' | 'expiring-soon' | 'expiring' | 'ok', daysUntil: number, color: string } => {
  if (!expiryDate) {
    return { status: 'ok', daysUntil: Infinity, color: 'green' }
  }

  const date = new Date(expiryDate)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { status: 'expired', daysUntil: diffDays, color: 'red' }
  } else if (diffDays <= 3) {
    return { status: 'expiring-soon', daysUntil: diffDays, color: 'orange' }
  } else if (diffDays <= 7) {
    return { status: 'expiring', daysUntil: diffDays, color: 'yellow' }
  } else {
    return { status: 'ok', daysUntil: diffDays, color: 'green' }
  }
}

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString()
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}





