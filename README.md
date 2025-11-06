# Guestbook Management Dashboard

An interactive command-line interface tool for managing replies to guestbook messages in the WRDLSS website. Built with TypeScript and powered by Supabase.

## ✨ Features

### 🎯 Core Features
- **Interactive Dashboard** - Menu-driven interface with real-time statistics
- **Arrow Key Navigation** - Browse and select messages using arrow keys
- **Continuous Operation** - Reply to multiple messages without restarting the tool
- **Message Browser** - View all messages with visual status indicators
- **Message Details** - Full message view with inline reply actions

### 📊 Advanced Features
- **Statistics & Analytics**
  - Total messages count
  - Reply rate percentage
  - Replied vs unreplied breakdown
  - Recent activity feed (last 10 replies)
  
- **Message History**
  - Filter by: All / Replied Only / Unreplied Only
  - Sort options for easy navigation
  - Quick access to message details

- **Bulk Operations**
  - Select multiple messages with checkboxes
  - Bulk delete replies
  - Export messages to JSON
  - Confirmation prompts for safety

- **Reply Management**
  - Add new replies
  - Edit existing replies
  - Delete replies
  - Track reply timestamps

### 🎨 UI/UX Enhancements
- Beautiful ASCII art header
- Colorful status badges (`[NEW]` for unreplied, `[✓]` for replied)
- Loading spinners for async operations
- Formatted tables for message lists
- Boxed statistics display
- Color-coded messages for better readability

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase project with guestbook_messages table

## 🚀 Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd guestbook
```

2. Install dependencies:
```bash
yarn install
# or
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

## 💻 Usage

Start the dashboard:
```bash
yarn start
# or
npm start
```

### Main Menu Options

1. **📬 View & Reply to Messages**
   - Browse all messages with arrow key navigation
   - Visual status indicators for replied/unreplied messages
   - Select any message to view details and take actions
   - Supports continuous operation - reply to multiple messages

2. **📚 Message History**
   - View filtered message lists
   - Filter options: All / Replied Only / Unreplied Only
   - Quickly access specific messages by ID
   - View full message details

3. **⚡ Bulk Operations**
   - Select multiple messages using checkboxes
   - Bulk delete replies (with confirmation)
   - Export selected messages to JSON
   - Perfect for managing large numbers of messages

4. **📊 Statistics & Analytics**
   - View total message counts
   - Check reply rate percentage
   - See recent activity feed
   - Monitor guestbook engagement

5. **🚪 Exit**
   - Cleanly exit the application

### Message Actions

When viewing a message, you can:
- **Add Reply** (if no reply exists)
- **Edit Reply** (if reply already exists)
- **Delete Reply** (with confirmation)
- **Back to List** (return to message browser)
- **Main Menu** (return to dashboard)

## 🗄️ Database Schema

The tool expects a `guestbook_messages` table with the following structure:

```sql
CREATE TABLE guestbook_messages (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reply TEXT,
  reply_created_at TIMESTAMP WITH TIME ZONE,
  random_name TEXT
);
```

### Optional Enhancements

For future multi-admin support, you can add:
```sql
ALTER TABLE guestbook_messages 
ADD COLUMN reply_edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reply_by TEXT;
```

## 🌐 Frontend Integration

This dashboard is designed to work alongside your frontend guestbook interface. Here's how to integrate the guestbook messages system in your web application:

<details>
<summary><strong>📦 Vue 3 (Composition API)</strong></summary>

```vue
<template>
  <div class="guestbook-container">
    <!-- Message Input Form -->
    <form @submit.prevent="handleMessageSubmit">
      <input
        v-model.trim="newMessage"
        type="text"
        placeholder="Leave a message..."
        :disabled="isSubmitting"
      />
      
      <!-- Simple Captcha -->
      <div class="captcha">
        <span>{{ captcha.question }}</span>
        <input v-model.trim="captchaAnswer" type="text" placeholder="?" />
      </div>
      
      <button type="submit" :disabled="isSubmitting || !isValidForm">
        {{ isSubmitting ? 'Sending...' : 'Send Message' }}
      </button>
    </form>

    <!-- Messages List -->
    <div class="messages-list">
      <div v-for="message in messages" :key="message.id" class="message">
        <div class="message-header">
          <span class="name">{{ message.random_name || 'Anonymous' }}</span>
          <span class="date">{{ formatDate(message.created_at) }}</span>
        </div>
        <p class="message-text">{{ message.message }}</p>
        <p v-if="message.reply" class="reply">
          <strong>Reply:</strong> {{ message.reply }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const messages = ref([])
const newMessage = ref('')
const isSubmitting = ref(false)
const captcha = ref({ question: '', answer: '' })
const captchaAnswer = ref('')

const isValidForm = computed(() => 
  newMessage.value && captchaAnswer.value === captcha.value.answer
)

const generateCaptcha = () => {
  const num1 = Math.floor(Math.random() * 10)
  const num2 = Math.floor(Math.random() * 10)
  captcha.value = {
    question: `${num1} + ${num2} = `,
    answer: String(num1 + num2)
  }
  captchaAnswer.value = ''
}

const fetchMessages = async () => {
  const { data, error } = await supabase
    .from('guestbook_messages')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (!error && data) messages.value = data
}

const handleMessageSubmit = async () => {
  if (captchaAnswer.value !== captcha.value.answer) {
    generateCaptcha()
    return
  }

  isSubmitting.value = true
  
  const { error } = await supabase
    .from('guestbook_messages')
    .insert([{ message: newMessage.value }])
  
  if (!error) {
    newMessage.value = ''
    await fetchMessages()
    generateCaptcha()
  }
  
  isSubmitting.value = false
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

onMounted(() => {
  fetchMessages()
  generateCaptcha()
})
</script>
```

</details>

<details>
<summary><strong>📦 Vue 3 (Options API)</strong></summary>

```vue
<template>
  <div class="guestbook-container">
    <!-- Message Input Form -->
    <form @submit.prevent="handleMessageSubmit">
      <input
        v-model.trim="newMessage"
        type="text"
        placeholder="Leave a message..."
        :disabled="isSubmitting"
      />
      
      <!-- Simple Captcha -->
      <div class="captcha">
        <span>{{ captcha.question }}</span>
        <input v-model.trim="captchaAnswer" type="text" placeholder="?" />
      </div>
      
      <button type="submit" :disabled="isSubmitting || !isValidForm">
        {{ isSubmitting ? 'Sending...' : 'Send Message' }}
      </button>
    </form>

    <!-- Messages List -->
    <div class="messages-list">
      <div v-for="message in messages" :key="message.id" class="message">
        <div class="message-header">
          <span class="name">{{ message.random_name || 'Anonymous' }}</span>
          <span class="date">{{ formatDate(message.created_at) }}</span>
        </div>
        <p class="message-text">{{ message.message }}</p>
        <p v-if="message.reply" class="reply">
          <strong>Reply:</strong> {{ message.reply }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { createClient } from '@supabase/supabase-js'

export default {
  data() {
    return {
      messages: [],
      newMessage: '',
      isSubmitting: false,
      supabase: null,
      captcha: { question: '', answer: '' },
      captchaAnswer: ''
    }
  },

  created() {
    this.supabase = createClient(
      process.env.VUE_APP_SUPABASE_URL,
      process.env.VUE_APP_SUPABASE_ANON_KEY
    )
  },

  mounted() {
    this.fetchMessages()
    this.generateCaptcha()
  },

  methods: {
    async fetchMessages() {
      const { data, error } = await this.supabase
        .from('guestbook_messages')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (!error) this.messages = data
    },

    generateCaptcha() {
      const num1 = Math.floor(Math.random() * 10)
      const num2 = Math.floor(Math.random() * 10)
      this.captcha = {
        question: `${num1} + ${num2} = `,
        answer: String(num1 + num2)
      }
      this.captchaAnswer = ''
    },

    async handleMessageSubmit() {
      if (this.captchaAnswer !== this.captcha.answer) {
        this.generateCaptcha()
        return
      }

      this.isSubmitting = true
      
      const { error } = await this.supabase
        .from('guestbook_messages')
        .insert([{ message: this.newMessage }])
      
      if (!error) {
        this.newMessage = ''
        await this.fetchMessages()
        this.generateCaptcha()
      }
      
      this.isSubmitting = false
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
  },

  computed: {
    isValidForm() {
      return this.newMessage && 
             this.captchaAnswer === this.captcha.answer
    }
  }
}
</script>
```

</details>

<details>
<summary><strong>⚛️ React (with TypeScript)</strong></summary>

```tsx
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
)

interface Message {
  id: number
  message: string
  created_at: string
  reply?: string
  reply_created_at?: string
  random_name?: string
}

interface Captcha {
  question: string
  answer: string
}

export default function Guestbook() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captcha, setCaptcha] = useState<Captcha>({ question: '', answer: '' })
  const [captchaAnswer, setCaptchaAnswer] = useState('')

  useEffect(() => {
    fetchMessages()
    generateCaptcha()
  }, [])

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('guestbook_messages')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) setMessages(data)
  }

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10)
    const num2 = Math.floor(Math.random() * 10)
    setCaptcha({
      question: `${num1} + ${num2} = `,
      answer: String(num1 + num2)
    })
    setCaptchaAnswer('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (captchaAnswer !== captcha.answer) {
      generateCaptcha()
      return
    }

    setIsSubmitting(true)
    
    const { error } = await supabase
      .from('guestbook_messages')
      .insert([{ message: newMessage }])
    
    if (!error) {
      setNewMessage('')
      await fetchMessages()
      generateCaptcha()
    }
    
    setIsSubmitting(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const isValidForm = newMessage.trim() && captchaAnswer === captcha.answer

  return (
    <div className="guestbook-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Leave a message..."
          disabled={isSubmitting}
        />
        
        <div className="captcha">
          <span>{captcha.question}</span>
          <input
            type="text"
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            placeholder="?"
          />
        </div>
        
        <button type="submit" disabled={isSubmitting || !isValidForm}>
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      <div className="messages-list">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <div className="message-header">
              <span className="name">{message.random_name || 'Anonymous'}</span>
              <span className="date">{formatDate(message.created_at)}</span>
            </div>
            <p className="message-text">{message.message}</p>
            {message.reply && (
              <p className="reply">
                <strong>Reply:</strong> {message.reply}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

</details>

<details>
<summary><strong>▲ Next.js (App Router with Server Components)</strong></summary>

```tsx
// app/guestbook/page.tsx
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import GuestbookForm from './GuestbookForm'

export const dynamic = 'force-dynamic'

async function getMessages() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  )

  const { data } = await supabase
    .from('guestbook_messages')
    .select('*')
    .order('created_at', { ascending: false })

  return data || []
}

export default async function GuestbookPage() {
  const messages = await getMessages()

  return (
    <div className="guestbook-container">
      <GuestbookForm />
      
      <div className="messages-list">
        {messages.map((message) => (
          <div key={message.id} className="message">
            <div className="message-header">
              <span className="name">{message.random_name || 'Anonymous'}</span>
              <span className="date">
                {new Date(message.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <p className="message-text">{message.message}</p>
            {message.reply && (
              <p className="reply">
                <strong>Reply:</strong> {message.reply}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

```tsx
// app/guestbook/GuestbookForm.tsx
'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function GuestbookForm() {
  const router = useRouter()
  const [newMessage, setNewMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captcha, setCaptcha] = useState(() => generateCaptcha())
  const [captchaAnswer, setCaptchaAnswer] = useState('')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10)
    const num2 = Math.floor(Math.random() * 10)
    return {
      question: `${num1} + ${num2} = `,
      answer: String(num1 + num2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (captchaAnswer !== captcha.answer) {
      setCaptcha(generateCaptcha())
      setCaptchaAnswer('')
      return
    }

    setIsSubmitting(true)
    
    const { error } = await supabase
      .from('guestbook_messages')
      .insert([{ message: newMessage }])
    
    if (!error) {
      setNewMessage('')
      setCaptchaAnswer('')
      setCaptcha(generateCaptcha())
      router.refresh()
    }
    
    setIsSubmitting(false)
  }

  const isValidForm = newMessage.trim() && captchaAnswer === captcha.answer

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Leave a message..."
        disabled={isSubmitting}
      />
      
      <div className="captcha">
        <span>{captcha.question}</span>
        <input
          type="text"
          value={captchaAnswer}
          onChange={(e) => setCaptchaAnswer(e.target.value)}
          placeholder="?"
        />
      </div>
      
      <button type="submit" disabled={isSubmitting || !isValidForm}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
```

</details>

<details>
<summary><strong>🔥 Svelte (with TypeScript)</strong></summary>

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { createClient } from '@supabase/supabase-js'

  const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  interface Message {
    id: number
    message: string
    created_at: string
    reply?: string
    reply_created_at?: string
    random_name?: string
  }

  interface Captcha {
    question: string
    answer: string
  }

  let messages: Message[] = []
  let newMessage = ''
  let isSubmitting = false
  let captcha: Captcha = { question: '', answer: '' }
  let captchaAnswer = ''

  $: isValidForm = newMessage.trim() && captchaAnswer === captcha.answer

  function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10)
    const num2 = Math.floor(Math.random() * 10)
    captcha = {
      question: `${num1} + ${num2} = `,
      answer: String(num1 + num2)
    }
    captchaAnswer = ''
  }

  async function fetchMessages() {
    const { data, error } = await supabase
      .from('guestbook_messages')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) messages = data
  }

  async function handleSubmit(e: Event) {
    e.preventDefault()
    
    if (captchaAnswer !== captcha.answer) {
      generateCaptcha()
      return
    }

    isSubmitting = true
    
    const { error } = await supabase
      .from('guestbook_messages')
      .insert([{ message: newMessage }])
    
    if (!error) {
      newMessage = ''
      await fetchMessages()
      generateCaptcha()
    }
    
    isSubmitting = false
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  onMount(() => {
    fetchMessages()
    generateCaptcha()
  })
</script>

<div class="guestbook-container">
  <form on:submit={handleSubmit}>
    <input
      type="text"
      bind:value={newMessage}
      placeholder="Leave a message..."
      disabled={isSubmitting}
    />
    
    <div class="captcha">
      <span>{captcha.question}</span>
      <input
        type="text"
        bind:value={captchaAnswer}
        placeholder="?"
      />
    </div>
    
    <button type="submit" disabled={isSubmitting || !isValidForm}>
      {isSubmitting ? 'Sending...' : 'Send Message'}
    </button>
  </form>

  <div class="messages-list">
    {#each messages as message (message.id)}
      <div class="message">
        <div class="message-header">
          <span class="name">{message.random_name || 'Anonymous'}</span>
          <span class="date">{formatDate(message.created_at)}</span>
        </div>
        <p class="message-text">{message.message}</p>
        {#if message.reply}
          <p class="reply">
            <strong>Reply:</strong> {message.reply}
          </p>
        {/if}
      </div>
    {/each}
  </div>
</div>
```

</details>

<details>
<summary><strong>🎯 Solid.js (with TypeScript)</strong></summary>

```tsx
import { createSignal, onMount, Show, For } from 'solid-js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

interface Message {
  id: number
  message: string
  created_at: string
  reply?: string
  reply_created_at?: string
  random_name?: string
}

interface Captcha {
  question: string
  answer: string
}

export default function Guestbook() {
  const [messages, setMessages] = createSignal<Message[]>([])
  const [newMessage, setNewMessage] = createSignal('')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [captcha, setCaptcha] = createSignal<Captcha>({ question: '', answer: '' })
  const [captchaAnswer, setCaptchaAnswer] = createSignal('')

  const isValidForm = () => 
    newMessage().trim() && captchaAnswer() === captcha().answer

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10)
    const num2 = Math.floor(Math.random() * 10)
    setCaptcha({
      question: `${num1} + ${num2} = `,
      answer: String(num1 + num2)
    })
    setCaptchaAnswer('')
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('guestbook_messages')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) setMessages(data)
  }

  const handleSubmit = async (e: Event) => {
    e.preventDefault()
    
    if (captchaAnswer() !== captcha().answer) {
      generateCaptcha()
      return
    }

    setIsSubmitting(true)
    
    const { error } = await supabase
      .from('guestbook_messages')
      .insert([{ message: newMessage() }])
    
    if (!error) {
      setNewMessage('')
      await fetchMessages()
      generateCaptcha()
    }
    
    setIsSubmitting(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  onMount(() => {
    fetchMessages()
    generateCaptcha()
  })

  return (
    <div class="guestbook-container">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={newMessage()}
          onInput={(e) => setNewMessage(e.currentTarget.value)}
          placeholder="Leave a message..."
          disabled={isSubmitting()}
        />
        
        <div class="captcha">
          <span>{captcha().question}</span>
          <input
            type="text"
            value={captchaAnswer()}
            onInput={(e) => setCaptchaAnswer(e.currentTarget.value)}
            placeholder="?"
          />
        </div>
        
        <button type="submit" disabled={isSubmitting() || !isValidForm()}>
          {isSubmitting() ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      <div class="messages-list">
        <For each={messages()}>
          {(message) => (
            <div class="message">
              <div class="message-header">
                <span class="name">{message.random_name || 'Anonymous'}</span>
                <span class="date">{formatDate(message.created_at)}</span>
              </div>
              <p class="message-text">{message.message}</p>
              <Show when={message.reply}>
                <p class="reply">
                  <strong>Reply:</strong> {message.reply}
                </p>
              </Show>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
```

</details>

<details>
<summary><strong>🅰️ Angular (Standalone Component)</strong></summary>

```typescript
// guestbook.component.ts
import { Component, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { environment } from '../environments/environment'

interface Message {
  id: number
  message: string
  created_at: string
  reply?: string
  reply_created_at?: string
  random_name?: string
}

interface Captcha {
  question: string
  answer: string
}

@Component({
  selector: 'app-guestbook',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="guestbook-container">
      <form (ngSubmit)="handleSubmit($event)">
        <input
          type="text"
          [(ngModel)]="newMessage"
          name="message"
          placeholder="Leave a message..."
          [disabled]="isSubmitting"
        />
        
        <div class="captcha">
          <span>{{ captcha.question }}</span>
          <input
            type="text"
            [(ngModel)]="captchaAnswer"
            name="captcha"
            placeholder="?"
          />
        </div>
        
        <button type="submit" [disabled]="isSubmitting || !isValidForm()">
          {{ isSubmitting ? 'Sending...' : 'Send Message' }}
        </button>
      </form>

      <div class="messages-list">
        <div *ngFor="let message of messages" class="message">
          <div class="message-header">
            <span class="name">{{ message.random_name || 'Anonymous' }}</span>
            <span class="date">{{ formatDate(message.created_at) }}</span>
          </div>
          <p class="message-text">{{ message.message }}</p>
          <p *ngIf="message.reply" class="reply">
            <strong>Reply:</strong> {{ message.reply }}
          </p>
        </div>
      </div>
    </div>
  `
})
export class GuestbookComponent implements OnInit {
  private supabase: SupabaseClient

  messages: Message[] = []
  newMessage = ''
  isSubmitting = false
  captcha: Captcha = { question: '', answer: '' }
  captchaAnswer = ''

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    )
  }

  ngOnInit() {
    this.fetchMessages()
    this.generateCaptcha()
  }

  isValidForm(): boolean {
    return !!this.newMessage.trim() && 
           this.captchaAnswer === this.captcha.answer
  }

  generateCaptcha() {
    const num1 = Math.floor(Math.random() * 10)
    const num2 = Math.floor(Math.random() * 10)
    this.captcha = {
      question: `${num1} + ${num2} = `,
      answer: String(num1 + num2)
    }
    this.captchaAnswer = ''
  }

  async fetchMessages() {
    const { data, error } = await this.supabase
      .from('guestbook_messages')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) this.messages = data
  }

  async handleSubmit(event: Event) {
    event.preventDefault()
    
    if (this.captchaAnswer !== this.captcha.answer) {
      this.generateCaptcha()
      return
    }

    this.isSubmitting = true
    
    const { error } = await this.supabase
      .from('guestbook_messages')
      .insert([{ message: this.newMessage }])
    
    if (!error) {
      this.newMessage = ''
      await this.fetchMessages()
      this.generateCaptcha()
    }
    
    this.isSubmitting = false
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
}
```

</details>

### Key Integration Points

1. **Supabase Client**: Use the public **anon key** for frontend (not the service role key)
2. **Message Submission**: Users can post messages via `.insert()` 
3. **Message Display**: Fetch all messages with `.select('*')`
4. **Replies**: Admin replies (added via this CLI tool) are automatically displayed
5. **Security**: Use Supabase Row Level Security (RLS) to control write access
6. **Real-time Updates** (Optional): Add Supabase real-time subscriptions to see new messages/replies instantly

### Recommended RLS Policies

```sql
-- Allow anyone to read messages
CREATE POLICY "Anyone can view messages"
  ON guestbook_messages FOR SELECT
  USING (true);

-- Allow anyone to insert messages (but not replies)
CREATE POLICY "Anyone can insert messages"
  ON guestbook_messages FOR INSERT
  WITH CHECK (reply IS NULL);

-- Only service role can add/edit replies (via this CLI tool)
```

## 🛠️ Development

### Tech Stack

- **TypeScript** - Type-safe development
- **Supabase JS Client** - Database integration
- **Inquirer.js** - Interactive CLI prompts
- **Chalk** - Terminal string styling
- **Figlet** - ASCII art headers
- **CLI Table 3** - Beautiful tables
- **Ora** - Elegant terminal spinners
- **Boxen** - Terminal boxes

### Project Structure

```
guestbook/
├── src/
│   └── index.ts       # Main application file
├── package.json       # Dependencies and scripts
├── tsconfig.json      # TypeScript configuration
├── .env               # Environment variables (not in git)
└── README.md          # This file
```

### Running in Development

```bash
yarn start
# or
npm start
```

The tool uses `tsx` for running TypeScript directly without compilation.

## 🔒 Security Notes

- Uses Supabase service role key for admin-level access
- Keep your `.env` file secure and never commit it
- The service key bypasses Row Level Security (RLS)
- Only use this tool in trusted environments

## 📝 License

MIT

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For questions or issues, please open an issue in the repository.
