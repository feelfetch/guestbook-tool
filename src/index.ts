import { createClient } from '@supabase/supabase-js'
import inquirer from 'inquirer'
import dotenv from 'dotenv'
import chalk from 'chalk'
import Table from 'cli-table3'
import ora from 'ora'
import boxen from 'boxen'

// Load environment variables
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface GuestbookMessage {
  id: number
  message: string
  created_at: string
  reply?: string | null
  reply_created_at?: string | null
  random_name?: string
}

interface Statistics {
  total: number
  replied: number
  unreplied: number
  replyRate: number
  recentActivity: GuestbookMessage[]
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function fetchAllMessages(): Promise<GuestbookMessage[]> {
  const spinner = ora('Fetching messages...').start()
  
  const { data, error } = await supabase
    .from('guestbook_messages')
    .select('*')
    .order('created_at', { ascending: false })

  spinner.stop()

  if (error) {
    console.error(chalk.red('Error fetching messages:', error.message))
    return []
  }
  
  return data || []
}

async function fetchUnrepliedMessages(): Promise<GuestbookMessage[]> {
  const spinner = ora('Fetching unreplied messages...').start()
  
  const { data, error } = await supabase
    .from('guestbook_messages')
    .select('*')
    .or('reply.is.null,reply.eq.')
    .order('created_at', { ascending: false })

  spinner.stop()

  if (error) {
    console.error(chalk.red('Error fetching messages:', error.message))
    return []
  }
  
  return data || []
}

async function fetchRepliedMessages(): Promise<GuestbookMessage[]> {
  const spinner = ora('Fetching replied messages...').start()
  
  const { data, error } = await supabase
    .from('guestbook_messages')
    .select('*')
    .not('reply', 'is', null)
    .order('reply_created_at', { ascending: false })

  spinner.stop()

  if (error) {
    console.error(chalk.red('Error fetching messages:', error.message))
    return []
  }
  
  return data || []
}

async function calculateStatistics(): Promise<Statistics> {
  const allMessages = await fetchAllMessages()
  const replied = allMessages.filter(m => m.reply && m.reply.trim() !== '')
  const unreplied = allMessages.filter(m => !m.reply || m.reply.trim() === '')
  
  const recentActivity = allMessages
    .filter(m => m.reply_created_at)
    .sort((a, b) => new Date(b.reply_created_at!).getTime() - new Date(a.reply_created_at!).getTime())
    .slice(0, 10)

  return {
    total: allMessages.length,
    replied: replied.length,
    unreplied: unreplied.length,
    replyRate: allMessages.length > 0 ? (replied.length / allMessages.length) * 100 : 0,
    recentActivity
  }
}

function formatMessage(msg: GuestbookMessage, maxLength: number = 50): string {
  const text = msg.message.length > maxLength 
    ? msg.message.substring(0, maxLength) + '...' 
    : msg.message
  return text.replace(/\n/g, ' ')
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return date.toLocaleDateString()
}

function getStatusBadge(msg: GuestbookMessage): string {
  if (msg.reply && msg.reply.trim() !== '') {
    return chalk.gray('[✓]')
  }
  return chalk.green('[NEW]')
}

function clearScreen() {
  console.clear()
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

function displayHeader(): void {
  console.log(chalk.cyan.bold('\nGuestbook Management Dashboard'))
  console.log(chalk.gray('─'.repeat(60)) + '\n')
}

function displayStatisticsBox(stats: Statistics): void {
  const statsContent = `
${chalk.cyan.bold('Total Messages:')} ${chalk.bold(stats.total)}
${chalk.green.bold('Replied:')} ${chalk.bold(stats.replied)}
${chalk.yellow.bold('Unreplied:')} ${chalk.bold(stats.unreplied)}
${chalk.magenta.bold('Reply Rate:')} ${chalk.bold(stats.replyRate.toFixed(1) + '%')}
  `.trim()

  const box = boxen(statsContent, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    title: '📊 Statistics',
    titleAlignment: 'center'
  })

  console.log(box)
}

function displayMessageTable(messages: GuestbookMessage[]): void {
  if (messages.length === 0) {
    console.log(chalk.yellow('\n📭 No messages to display\n'))
    return
  }

  const table = new Table({
    head: [
      chalk.cyan('Status'),
      chalk.cyan('ID'),
      chalk.cyan('From'),
      chalk.cyan('Message'),
      chalk.cyan('Date')
    ],
    colWidths: [10, 6, 20, 40, 15],
    wordWrap: true,
    style: {
      head: [],
      border: ['gray']
    }
  })

  messages.slice(0, 20).forEach(msg => {
    table.push([
      getStatusBadge(msg),
      chalk.bold(msg.id.toString()),
      chalk.yellow(msg.random_name || 'Anonymous'),
      formatMessage(msg, 35),
      chalk.gray(formatDate(msg.created_at))
    ])
  })

  console.log(table.toString())
  
  if (messages.length > 20) {
    console.log(chalk.gray(`\n... and ${messages.length - 20} more messages\n`))
  }
}

// ============================================================================
// CORE FEATURES
// ============================================================================

async function addOrEditReply(messageId: number, existingReply?: string): Promise<boolean> {
  const action = existingReply ? 'Edit' : 'Add'
  
  const { reply } = await inquirer.prompt([
    {
      type: 'input',
      name: 'reply',
      message: `${action} your reply:`,
      default: existingReply || '',
      validate: (input: string) => {
        return input.length > 0 ? true : 'Reply cannot be empty'
      }
    }
  ])

  const spinner = ora('Updating message...').start()

  const { data, error } = await supabase
    .from('guestbook_messages')
    .update({ 
      reply,
      reply_created_at: new Date().toISOString()
    })
    .eq('id', messageId)
    .select()

  spinner.stop()

  if (error) {
    console.error(chalk.red('\n❌ Error updating message:', error.message))
    return false
  }

  if (!data || data.length === 0) {
    console.error(chalk.red('\n❌ Failed to update message'))
    return false
  }

  console.log(chalk.green(`\n✓ Reply ${action.toLowerCase()}ed successfully!\n`))
  return true
}

async function deleteReply(messageId: number): Promise<boolean> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Are you sure you want to delete this reply?',
      default: false
    }
  ])

  if (!confirm) {
    console.log(chalk.yellow('\n⚠ Delete cancelled\n'))
    return false
  }

  const spinner = ora('Deleting reply...').start()

  const { data, error } = await supabase
    .from('guestbook_messages')
    .update({ 
      reply: null,
      reply_created_at: null
    })
    .eq('id', messageId)
    .select()

  spinner.stop()

  if (error) {
    console.error(chalk.red('\n❌ Error deleting reply:', error.message))
    return false
  }

  console.log(chalk.green('\n✓ Reply deleted successfully!\n'))
  return true
}

async function showMessageDetails(msg: GuestbookMessage): Promise<void> {
  clearScreen()
  displayHeader()

  const detailsBox = boxen(
    `
${chalk.cyan.bold('ID:')} ${chalk.bold(msg.id)}
${chalk.cyan.bold('From:')} ${chalk.yellow(msg.random_name || 'Anonymous')}
${chalk.cyan.bold('Date:')} ${chalk.gray(formatDate(msg.created_at))}

${chalk.cyan.bold('Message:')}
${msg.message}

${chalk.cyan.bold('Reply:')}
${msg.reply ? chalk.green(msg.reply) : chalk.gray('No reply yet')}
${msg.reply_created_at ? chalk.gray('Replied: ' + formatDate(msg.reply_created_at)) : ''}
    `.trim(),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      title: '💬 Message Details',
      titleAlignment: 'center'
    }
  )

  console.log(detailsBox)

  const hasReply = msg.reply && msg.reply.trim() !== ''
  const actions: any[] = hasReply 
    ? [
        { name: '✏️  Edit Reply', value: 'Edit Reply' },
        { name: '🗑️  Delete Reply', value: 'Delete Reply' },
        new inquirer.Separator(),
        { name: chalk.yellow('← Back to List'), value: 'Back to List' },
        { name: chalk.red('← Back to Main Menu'), value: 'Main Menu' }
      ]
    : [
        { name: '💬 Add Reply', value: 'Add Reply' },
        new inquirer.Separator(),
        { name: chalk.yellow('← Back to List'), value: 'Back to List' },
        { name: chalk.red('← Back to Main Menu'), value: 'Main Menu' }
      ]

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: actions
    }
  ])

  switch (action) {
    case 'Add Reply':
      await addOrEditReply(msg.id)
      break
    case 'Edit Reply':
      await addOrEditReply(msg.id, msg.reply || '')
      break
    case 'Delete Reply':
      await deleteReply(msg.id)
      break
    case 'Back to List':
      return
    case 'Main Menu':
      return
  }

  // Refresh message details if action was taken
  if (action !== 'Back to List' && action !== 'Main Menu') {
    const { data } = await supabase
      .from('guestbook_messages')
      .select('*')
      .eq('id', msg.id)
      .single()
    
    if (data) {
      await showMessageDetails(data)
    }
  }
}

// ============================================================================
// MAIN VIEWS
// ============================================================================

async function showMessageBrowser(): Promise<void> {
  let continueLoop = true

  while (continueLoop) {
    clearScreen()
    displayHeader()
    console.log(chalk.cyan.bold('📬 Message Browser\n'))

    const messages = await fetchAllMessages()
    
    if (messages.length === 0) {
      console.log(chalk.yellow('No messages found!\n'))
      await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to main menu...' }])
      return
    }

    displayMessageTable(messages)

    const choices: any[] = [
      { name: chalk.red('← Back to Main Menu'), value: 'back' },
      new inquirer.Separator()
    ]
    
    const messageChoices = messages.map(msg => ({
      name: `${getStatusBadge(msg)} ID:${msg.id} | ${msg.random_name || 'Anonymous'} | ${formatMessage(msg, 40)}`,
      value: msg.id
    }))
    
    choices.push(...messageChoices)

    const { selectedId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedId',
        message: 'Select a message to view/reply (↑↓ to navigate):',
        choices,
        pageSize: 15,
        loop: false
      }
    ])

    if (selectedId === 'back') {
      continueLoop = false
    } else {
      const message = messages.find(m => m.id === selectedId)
      if (message) {
        await showMessageDetails(message)
      }
    }
  }
}

async function showMessageHistory(): Promise<void> {
  let continueLoop = true

  while (continueLoop) {
    clearScreen()
    displayHeader()
    console.log(chalk.cyan.bold('📚 Message History\n'))

    const { filter } = await inquirer.prompt([
      {
        type: 'list',
        name: 'filter',
        message: 'Filter messages:',
        choices: [
          { name: chalk.red('← Back to Main Menu'), value: 'back' },
          new inquirer.Separator(),
          { name: '📋 All Messages', value: 'all' },
          { name: '✓ Replied Only', value: 'replied' },
          { name: '📝 Unreplied Only', value: 'unreplied' }
        ]
      }
    ])

    if (filter === 'back') {
      continueLoop = false
      continue
    }

    let messages: GuestbookMessage[] = []
    
    switch (filter) {
      case 'all':
        messages = await fetchAllMessages()
        break
      case 'replied':
        messages = await fetchRepliedMessages()
        break
      case 'unreplied':
        messages = await fetchUnrepliedMessages()
        break
    }

    clearScreen()
    displayHeader()
    
    const filterTitle = filter === 'all' ? 'All Messages' 
                      : filter === 'replied' ? 'Replied Messages' 
                      : 'Unreplied Messages'
    
    console.log(chalk.cyan.bold(`📚 Message History - ${filterTitle}\n`))
    displayMessageTable(messages)

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: chalk.red('← Back to Main Menu'), value: 'back' },
          new inquirer.Separator(),
          { name: '🔍 View a Message', value: 'view' },
          { name: '🔄 Change Filter', value: 'filter' }
        ]
      }
    ])

    if (action === 'back') {
      continueLoop = false
    } else if (action === 'view') {
      const { messageId } = await inquirer.prompt({
        type: 'number',
        name: 'messageId',
        message: 'Enter message ID:',
        validate: (input: number | undefined) => {
          if (input === undefined) return 'Please enter a message ID'
          return messages.some(m => m.id === input) 
            ? true 
            : 'Please enter a valid message ID from the list'
        }
      })

      const message = messages.find(m => m.id === messageId)
      if (message) {
        await showMessageDetails(message)
      }
    }
  }
}

async function showBulkOperations(): Promise<void> {
  clearScreen()
  displayHeader()
  console.log(chalk.cyan.bold('⚡ Bulk Operations\n'))

  const messages = await fetchAllMessages()
  
  if (messages.length === 0) {
    console.log(chalk.yellow('No messages available for bulk operations!\n'))
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to main menu...' }])
    return
  }

  const choices = messages.map(msg => ({
    name: `${getStatusBadge(msg)} ID:${msg.id} | ${msg.random_name || 'Anonymous'} | ${formatMessage(msg, 40)}`,
    value: msg.id,
    checked: false
  }))

  console.log(chalk.gray('Tip: Press Enter without selecting anything to go back to main menu\n'))

  const { selectedIds } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selectedIds',
      message: 'Select messages (space to select, enter to confirm):',
      choices,
      pageSize: 15
    }
  ])

  if (selectedIds.length === 0) {
    console.log(chalk.yellow('\nNo messages selected. Returning to main menu...\n'))
    await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }])
    return
  }

  const selectedMessages = messages.filter(m => selectedIds.includes(m.id))
  const repliedCount = selectedMessages.filter(m => m.reply).length

  console.log(chalk.cyan(`\nSelected ${selectedIds.length} message(s)`))
  console.log(chalk.gray(`${repliedCount} with replies, ${selectedIds.length - repliedCount} without replies\n`))

  const { bulkAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'bulkAction',
      message: 'Choose bulk action:',
      choices: [
        { name: chalk.red('❌ Cancel / Back to Main Menu'), value: 'cancel' },
        new inquirer.Separator(),
        { name: '🗑️  Delete Replies', value: 'delete', disabled: repliedCount === 0 },
        { name: '💾 Export to JSON', value: 'export' }
      ]
    }
  ])

  if (bulkAction === 'cancel') {
    return
  }

  if (bulkAction === 'delete') {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.red(`Are you sure you want to delete ${repliedCount} reply/replies?`),
        default: false
      }
    ])

    if (confirm) {
      const spinner = ora('Deleting replies...').start()
      
      for (const id of selectedIds) {
        await supabase
          .from('guestbook_messages')
          .update({ reply: null, reply_created_at: null })
          .eq('id', id)
      }
      
      spinner.stop()
      console.log(chalk.green(`\n✓ Successfully deleted ${repliedCount} reply/replies!\n`))
    }
  } else if (bulkAction === 'export') {
    const exportData = selectedMessages.map(m => ({
      id: m.id,
      from: m.random_name,
      message: m.message,
      reply: m.reply,
      created_at: m.created_at,
      reply_created_at: m.reply_created_at
    }))

    const filename = `guestbook-export-${Date.now()}.json`
    const fs = await import('fs/promises')
    await fs.writeFile(filename, JSON.stringify(exportData, null, 2))
    console.log(chalk.green(`\n✓ Exported ${selectedIds.length} message(s) to ${filename}\n`))
  }

  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to continue...' }])
}

async function showStatistics(): Promise<void> {
  clearScreen()
  displayHeader()
  console.log(chalk.cyan.bold('📊 Statistics & Analytics\n'))

  const stats = await calculateStatistics()
  
  displayStatisticsBox(stats)

  // Recent Activity
  if (stats.recentActivity.length > 0) {
    console.log(chalk.cyan.bold('\n📝 Recent Replies (Last 10)\n'))
    
    const activityTable = new Table({
      head: [
        chalk.cyan('ID'),
        chalk.cyan('From'),
        chalk.cyan('Message'),
        chalk.cyan('Replied')
      ],
      colWidths: [6, 20, 35, 15],
      wordWrap: true,
      style: {
        head: [],
        border: ['gray']
      }
    })

    stats.recentActivity.forEach(msg => {
      activityTable.push([
        chalk.bold(msg.id.toString()),
        chalk.yellow(msg.random_name || 'Anonymous'),
        formatMessage(msg, 30),
        chalk.gray(formatDate(msg.reply_created_at!))
      ])
    })

    console.log(activityTable.toString())
  }

  console.log()
  await inquirer.prompt([{ type: 'input', name: 'continue', message: 'Press Enter to return to main menu...' }])
}

async function showDashboard(): Promise<void> {
  let running = true

  while (running) {
    clearScreen()
    displayHeader()

    const stats = await calculateStatistics()
    displayStatisticsBox(stats)

    const { choice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message: 'What would you like to do?',
        choices: [
          { name: '📬 View & Reply to Messages', value: 'messages' },
          { name: '📚 Message History', value: 'history' },
          { name: '⚡ Bulk Operations', value: 'bulk' },
          { name: '📊 Statistics & Analytics', value: 'stats' },
          new inquirer.Separator(),
          { name: chalk.red('🚪 Exit'), value: 'exit' }
        ],
        pageSize: 10
      }
    ])

    switch (choice) {
      case 'messages':
        await showMessageBrowser()
        break
      case 'history':
        await showMessageHistory()
        break
      case 'bulk':
        await showBulkOperations()
        break
      case 'stats':
        await showStatistics()
        break
      case 'exit':
        clearScreen()
        console.log(chalk.cyan('\n👋 Thanks for using the Guestbook Management Dashboard!\n'))
        running = false
        break
    }
  }
}

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================

async function main() {
  try {
    await showDashboard()
  } catch (error) {
    console.error(chalk.red('An error occurred:', error))
  }
}

main()
