# Buddy Hunt - Social Streaming Platform

A premium social streaming platform where users can watch movies together, hang out in virtual mansions, and connect with friends in real-time.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup Instructions

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd buddy-hunt
   npm install
   ```

2. **Supabase Setup**
   
   **Option A: Use Existing Supabase Project**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project or use existing one
   - Go to Settings > API
   - Copy your Project URL and anon public key
   
   **Option B: Local Development**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Start local Supabase
   supabase start
   ```

3. **Environment Configuration**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env with your Supabase credentials
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

4. **Database Setup**
   ```bash
   # Run migrations (if using local Supabase)
   supabase db reset
   
   # Or apply migrations to remote database
   supabase db push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🔧 Troubleshooting Supabase Connection Issues

### Common Permission Errors

**Error: "You don't have permission to access this resource"**

This usually happens due to:

1. **Missing Environment Variables**
   - Ensure `.env` file exists with correct values
   - Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
   - Restart your dev server after changing `.env`

2. **Incorrect Supabase URL/Key**
   - Verify URL format: `https://your-project-id.supabase.co`
   - Ensure you're using the `anon` key, not the `service_role` key for client-side
   - Check for extra spaces or characters

3. **Row Level Security (RLS) Issues**
   - Tables have RLS enabled but no policies allow access
   - User not authenticated when trying to access protected data
   - Policies don't match the current user context

4. **Table/Migration Issues**
   - Tables don't exist (migrations not run)
   - Column names don't match the code
   - Database schema out of sync

### Quick Fixes

1. **Check Environment Variables**
   ```bash
   # In your terminal, verify variables are loaded
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

2. **Test Supabase Connection**
   - Open browser console (F12)
   - Look for connection test messages
   - Check for detailed error messages

3. **Verify Database Setup**
   ```bash
   # Check if tables exist
   supabase db diff
   
   # Reset database if needed
   supabase db reset
   ```

4. **Check RLS Policies**
   - Go to Supabase Dashboard > Authentication > Policies
   - Ensure policies exist for your tables
   - Test with RLS disabled temporarily (not for production)

### Getting Your Supabase Credentials

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (or create a new one)
3. **Go to Settings > API**
4. **Copy the following:**
   - Project URL (starts with `https://`)
   - `anon` `public` key (long string starting with `eyJ`)

### Environment File Example

```env
# Replace with your actual values
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjU0ODAwMCwiZXhwIjoxOTUyMTI0MDAwfQ.example-signature-here
```

## 📱 Features

- **Cinema Rooms**: Watch streams and content together in 4K
- **Social Mansions**: Hang out in virtual spaces with voice/video chat
- **Real-time Messaging**: End-to-end encrypted private messages
- **Virtual Gifts**: Send animated gifts to show appreciation
- **User Profiles**: Customizable profiles with privacy controls
- **OAuth Authentication**: Sign in with Google, Facebook, Apple

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Real-time**: Supabase Realtime, WebRTC
- **Deployment**: Vite, Docker, Kubernetes

## 📚 Documentation

- [API Documentation](./api/openapi.yaml)
- [Database Schema](./supabase/migrations/)
- [Deployment Guide](./infrastructure/deployment-scripts/)
- [Security Implementation](./security/e2ee-implementation.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you're still having issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase project is active and not paused
3. Ensure your database has the required tables and RLS policies
4. Try creating a fresh Supabase project and updating your credentials

For additional help, please open an issue with:
- Your error message
- Browser console logs
- Environment setup details (without sensitive keys)