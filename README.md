This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Task Manager

A modern task management application built with Next.js, React, and TypeScript, featuring natural language processing for task creation, voice input support, and calendar integration.

## Features

- 📅 Calendar view for tasks
- 🎤 Voice input support
- 📝 Natural language task creation
- ⭐ Priority levels (urgent, high, medium, low)
- 🏷️ Task categorization
- 🔍 Search functionality
- 💾 Offline support with IndexedDB
- 📱 Responsive design

## Tech Stack

- Next.js 14
- React
- TypeScript
- TailwindCSS
- Lucide Icons
- IndexedDB
- date-fns
- ShadcnUI components

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/springsteenptrck/task-manager.git
```

2. Install dependencies:
```bash
cd task-manager
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

- Type or speak your task using natural language
- Include date and time in your task description (e.g., "Meeting tomorrow at 3pm")
- Set priority by including words like "urgent", "high", "medium", or "low"
- View your tasks in the calendar
- Search through tasks using the search bar