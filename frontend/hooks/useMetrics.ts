import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useMetrics() {
  const { data, error, isLoading, mutate } = useSWR('/api/metrics/raw', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  })

  return {
    metrics: data,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}

export function useSuggestions() {
  const { data, error, isLoading, mutate } = useSWR('/api/suggestions/latest', fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: true,
  })

  return {
    suggestions: data,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}

export function useHealth() {
  const { data, error, isLoading, mutate } = useSWR('/api/health', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  })

  return {
    health: data,
    isLoading,
    isError: error,
    isHealthy: !error && data?.status === 'healthy',
    refresh: mutate,
  }
} 