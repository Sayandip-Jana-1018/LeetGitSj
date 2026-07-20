<img width="3392" height="2400" alt="Screenshot_2026-07-20-16-38-39-18_40deb401b9ffe8e1df2f1cc5ba480b12" src="https://github.com/user-attachments/assets/ce2e127b-4147-44e3-a651-65d50a9ca207" />
<img width="3392" height="2400" alt="Screenshot_2026-07-20-16-37-57-17_40deb401b9ffe8e1df2f1cc5ba480b12" src="https://github.com/user-attachments/assets/fdf78360-0624-4724-a5b3-27b96fa19567" />
<img width="3392" height="2400" alt="Screenshot_2026-07-20-16-37-12-90_40deb401b9ffe8e1df2f1cc5ba480b12" src="https://github.com/user-attachments/assets/0b6e6600-2738-4a45-8cbf-0d9f919fe18b" />
<img width="3392" height="2400" alt="Screenshot_2026-07-20-16-37-01-11_40deb401b9ffe8e1df2f1cc5ba480b12" src="https://github.com/user-attachments/assets/f2668973-0db8-452b-89ff-b8f49e9cc34f" />
<img width="3392" height="2400" alt="Screenshot_2026-07-20-16-36-48-13_40deb401b9ffe8e1df2f1cc5ba480b12" src="https://github.com/user-attachments/assets/62a013e1-4f48-44b5-b00a-5335997a43ef" />



# LeetGitSj 🚀

LeetGitSj is an automated platform that syncs your accepted LeetCode submissions directly to a GitHub repository, turning your coding practice into a green contribution graph. No browser extensions required—everything runs automatically in the background!

## ✨ Features

- **Automatic Background Sync**: Every accepted LeetCode submission is automatically committed to your linked GitHub repository.
- **Zero Configuration**: Works fully server-side without needing browser extensions. Solve on your phone, tablet, or PC, and it still syncs seamlessly.
- **Smart Queue System**: Powered by a robust background job queue (BullMQ + Redis) that reliably processes your submissions without rate-limiting issues.
- **Secure Authentication**: Uses GitHub OAuth for user login and a dedicated GitHub App for secure, scoped repository write access.
- **Premium Dark Mode UI**: Built with a stunning, modern dark-mode interface featuring glassmorphism, dynamic floating smoke particles, tilt effects, and smooth micro-animations.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom design tokens and Framer Motion for beautiful animations.
- **Database**: [PostgreSQL (Neon)](https://neon.tech/) with [Prisma ORM](https://www.prisma.io/).
- **Authentication**: [Auth.js (NextAuth v5)](https://authjs.dev/)
- **Background Jobs**: [BullMQ](https://docs.bullmq.io/) with Upstash Redis for scalable background processing.
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

## 📄 License
MIT License
