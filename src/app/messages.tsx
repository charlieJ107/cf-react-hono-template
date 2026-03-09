import useSWR from 'swr'

const fetcher = (url: string) =>
    fetch(url, { credentials: "include" }).then((res) => res.json());

export default function Messages() {
    const { data, isLoading, error } = useSWR('/api/messages', fetcher)
    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error: {error.message}</div>
    if (!data) return <div>No data</div>

    return (
        <div>
            <h1>Messages</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    )
}