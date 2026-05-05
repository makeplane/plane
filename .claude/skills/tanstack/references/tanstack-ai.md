# TanStack AI Reference (Alpha)

**Status: Alpha — not production-ready.**

## Setup
```bash
npm i @tanstack/ai @tanstack/react-ai
npm i @tanstack/ai-openai      # or @tanstack/ai-anthropic, @tanstack/ai-google
```

## Client — useChat
```tsx
import { useChat, fetchServerSentEvents } from '@tanstack/react-ai'

function Chat() {
  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  })

  return (
    <div>
      {messages.map((m) => <div key={m.id}>{m.role}: {m.content}</div>)}
      <form onSubmit={(e) => {
        e.preventDefault()
        sendMessage({ role: 'user', content: inputValue })
      }}>
        <input ... />
        <button disabled={isLoading}>Send</button>
      </form>
    </div>
  )
}
```

## Server — chat()
```ts
import { chat, toStreamResponse } from '@tanstack/ai'
import { openaiAdapter } from '@tanstack/ai-openai'

// TanStack Start API route
import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/chat')({
  POST: async ({ request }) => {
    const { messages } = await request.json()
    const stream = chat({
      adapter: openaiAdapter,
      model: 'gpt-4o',
      messages,
    })
    return toStreamResponse(stream)
  },
})
```

## Structured Output
```ts
const stream = chat({
  adapter: openaiAdapter,
  model: 'gpt-4o',
  messages,
  outputSchema: z.object({
    sentiment: z.enum(['positive', 'negative', 'neutral']),
    summary: z.string(),
  }),
})
```

## Isomorphic Tools
```ts
import { toolDefinition } from '@tanstack/ai'

const weatherTool = toolDefinition('getWeather')
  .input(z.object({ city: z.string() }))
  .server(async ({ input }) => {
    return await fetchWeatherAPI(input.city)
  })
  .client(({ result }) => {
    // Render tool result in UI
    return <WeatherCard data={result} />
  })
```

## Provider Adapters
| Package | Provider |
|---------|----------|
| `@tanstack/ai-openai` | OpenAI |
| `@tanstack/ai-anthropic` | Anthropic |
| `@tanstack/ai-google` | Google Gemini |
| `@tanstack/ai-ollama` | Ollama (local) |

## Key Differences from Vercel AI SDK
- Isomorphic tools (define once, run server+client) vs split implementation
- Stronger per-model type safety
- Framework-agnostic (React, Solid, Preact)
- Fewer providers currently (~10 vs 25+)
- Less mature ecosystem
