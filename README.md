# LeetGitSj

LeetGitSj is an automated platform that syncs your accepted LeetCode submissions directly to a GitHub repository, turning your coding practice into a green contribution graph. No browser extensions required—everything runs automatically in the background.

## 🚀 Features

- **Automatic Syncing**: Every accepted LeetCode submission is automatically committed to your linked GitHub repository.
- **No Browser Extensions**: Works fully server-side. Solve on your phone, tablet, or another computer, and it still syncs.
- **Background Worker**: Powered by a robust background job queue (BullMQ + Redis) that reliably processes submissions.
- **Secure Authentication**: Uses GitHub OAuth for user login and a dedicated GitHub App for secure, scoped repository write access.
- **Premium UI**: Built with a stunning, modern dark-mode interface featuring glassmorphism and a dynamic, floating smoke particle background.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom design tokens and Framer Motion for animations.
- **Database**: [PostgreSQL (Neon)](https://neon.tech/) with [Prisma ORM](https://www.prisma.io/).
- **Authentication**: [Auth.js (NextAuth v5)](https://authjs.dev/)
- **Background Jobs**: [BullMQ](https://docs.bullmq.io/) with Upstash Redis.
- **Infrastructure**: Designed for deployment on Vercel with a custom Node.js worker for the background queue.

## 📦 Local Development

### 1. Clone the repository
```bash
git clone https://github.com/your-username/leetgit.git
cd leetgit
npm install
```

### 2. Set up environment variables
Copy the template file to create your local environment:
```bash
cp .env.example .env.local
```
Then, fill out the variables in `.env.local`:
- **Auth.js**: Generate a secret using `npx auth secret`.
- **GitHub OAuth**: Create an OAuth app for user login.
- **GitHub App**: Create a GitHub App for repo access, download its private key, and set up a webhook.
- **Neon Postgres**: Get your database connection string.
- **Upstash Redis**: Get your Redis connection string.

*(Note: Never commit `.env` or `.env.local` to version control. The repository ignores these by default, except for `.env.example`.)*

### 3. Initialize the database
Push the schema to your Neon database:
```bash
npx prisma db push
```

### 4. Run the development server
Start both the Next.js app and the background worker concurrently:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## 📖 How it works

1. **Sign In**: Authenticate securely using your GitHub account.
2. **Link LeetCode**: Provide your LeetCode session token and connect the official LeetGitSj GitHub App to the repository where you want your code saved.
3. **Solve & Sync**: Whenever you solve a problem on LeetCode, the platform detects the accepted submission and dispatches a background job. The worker processes the code and commits it directly to your GitHub repo.
