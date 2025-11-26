# API Health Check Dashboard & Alert System

This project is a Next.js frontend application with Tailwind CSS and SQLite, designed to monitor API health, display dashboards, and manage alerts as described in the project proposal.

## Getting Started

1. **Install dependencies:**
   ```zsh
   npm install
   ```
2. **Initialize the database:**
   ```zsh
   curl http://localhost:3000/api/init-db
   ```
3. **Run the development server:**
   ```zsh
   npm run dev
   ```
4. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

## Project Structure
- `src/db.ts`: SQLite database connection and schema setup
- `src/app/api/init-db/route.ts`: API route to initialize the database
- `src/app/`: Next.js app directory

## Next Steps
- Implement API CRUD endpoints
- Build dashboard UI for API health and alerts
- Add health check scheduling and alert logic

---

For more details, see the attached project proposal.
