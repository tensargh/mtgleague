// Test script to verify base URL configuration
console.log('Testing base URL configuration...')

// Check environment variables
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL)
console.log('VERCEL_URL:', process.env.VERCEL_URL)

// Test the getBaseUrl function logic
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  return 'http://localhost:3000' // fallback for local development
}

const result = getBaseUrl()
console.log('getBaseUrl() result:', result)

if (process.env.NEXT_PUBLIC_BASE_URL) {
  console.log('✅ Using explicit NEXT_PUBLIC_BASE_URL')
} else if (process.env.VERCEL_URL) {
  console.log('✅ Using Vercel URL')
} else {
  console.log('✅ Using localhost fallback')
}

console.log('Test completed!') 