# StudySync AI - Deployment Guide

This guide outlines the steps to deploy the StudySync AI project. The recommended platform is **Vercel** for the Next.js application and **Neon** for the PostgreSQL database.

## Prerequisites

Before starting, ensure you have accounts with:
*   [GitHub](https://github.com/) (to host your code)
*   [Vercel](https://vercel.com/) (to host the Next.js app)
*   [Neon](https://neon.tech/) (for the PostgreSQL database)
*   [Cloudinary](https://cloudinary.com/) (for image/file storage)
*   [Pusher](https://pusher.com/) (for real-time features)
*   [Upstash](https://upstash.com/) (for Redis caching)
*   [Google Cloud Console](https://console.cloud.google.com/) (for Google OAuth)
*   [GitHub Developer Settings](https://github.com/settings/developers) (for GitHub OAuth)

## Step 1: Push Code to GitHub

Your code should already be in your GitHub repository: `https://github.com/srahi904/StudySync`.

## Step 2: Database Setup (Neon)

1.  Log in to [Neon](https://neon.tech/).
2.  Create a new project named `studysync`.
3.  Copy the **Connection String** (Dashboard -> Connection Details).
4.  Ensure you have both the **pooled** connection string (for `DATABASE_URL`) and the **direct** connection string (for `DIRECT_URL`).

## Step 3: Deployment on Vercel

1.  Log in to [Vercel](https://vercel.com/).
2.  Click **"Add New"** -> **"Project"**.
3.  Import the `StudySync` repository from your GitHub.
4.  In the **Environment Variables** section, add all keys from your `.env` file (see the Checklist below).
    *   **CRITICAL**: Set `NEXTAUTH_URL` to your Vercel deployment URL (e.g., `https://studysync-ai.vercel.app`).
    *   **CRITICAL**: Set `NEXT_PUBLIC_APP_URL` to the same Vercel URL.
5.  Click **Deploy**.

## Environment Variables Checklist

Ensure these variables are added to Vercel:

| Category | Variable | Description |
| :--- | :--- | :--- |
| **Database** | `DATABASE_URL` | Neon pooled connection string |
| | `DIRECT_URL` | Neon direct connection string |
| **NextAuth** | `NEXTAUTH_URL` | Your production URL (e.g., `https://your-app.vercel.app`) |
| | `NEXTAUTH_SECRET` | A random 32-character string |
| **Google OAuth**| `GOOGLE_CLIENT_ID`| From Google Cloud Console |
| | `GOOGLE_CLIENT_SECRET`| From Google Cloud Console |
| **GitHub OAuth**| `GITHUB_CLIENT_ID`| From GitHub Developer Settings |
| | `GITHUB_CLIENT_SECRET`| From GitHub Developer Settings |
| **Email (SMTP)** | `SMTP_HOST` | e.g., `smtp.gmail.com` |
| | `SMTP_PORT` | e.g., `587` |
| | `SMTP_USER` | Your email address |
| | `SMTP_PASSWORD` | App password (not account password) |
| | `SMTP_FROM` | Sender email |
| **Cloudinary** | `CLOUDINARY_CLOUD_NAME`| Cloudinary Dashbaord |
| | `CLOUDINARY_API_KEY` | Cloudinary Dashboard |
| | `CLOUDINARY_API_SECRET`| Cloudinary Dashboard |
| **Gemini AI** | `GOOGLE_GENERATIVE_AI_API_KEY`| From Google AI Studio |
| **Pusher** | `NEXT_PUBLIC_PUSHER_KEY`| Pusher App Keys |
| | `NEXT_PUBLIC_PUSHER_CLUSTER`| Pusher Cluster (e.g., `ap2`) |
| | `PUSHER_APP_ID` | Pusher App ID |
| | `PUSHER_SECRET` | Pusher App Secret|
| **Upstash Redis**| `UPSTASH_REDIS_REST_URL`| Upstash Redis Dashboard |
| | `UPSTASH_REDIS_REST_TOKEN`| Upstash Redis Dashboard |
| **App** | `NEXT_PUBLIC_APP_NAME`| `StudySync AI` |

## Step 4: Update OAuth Redirect URIs

After deploying, you **MUST** update your OAuth redirect URIs in Google and GitHub:

*   **Google**: Add `https://your-app.vercel.app/api/auth/callback/google`
*   **GitHub**: Add `https://your-app.vercel.app/api/auth/callback/github`

## Step 5: Post-Deployment

1.  Run the database push again if needed on the production database (usually handled by the "build" script in `package.json`).
2.  Test login, chat, and AI features on the live site.
