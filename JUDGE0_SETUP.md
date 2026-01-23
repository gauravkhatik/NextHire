# Judge0 API Setup Guide

This application uses Judge0 API for secure code execution of Python, Java, and C++ code.

## Setup Instructions

### Option 1: RapidAPI (Recommended for Quick Start)

1. **Sign up for RapidAPI**
   - Go to https://rapidapi.com/
   - Create a free account

2. **Subscribe to Judge0 API**
   - Search for "Judge0 CE" in RapidAPI
   - Subscribe to the free tier (usually 50 requests/day)

3. **Get your API Key**
   - Go to your RapidAPI dashboard
   - Copy your API key (X-RapidAPI-Key)

4. **Set Environment Variables**
   - Add to your `.env.local` file:
     ```
     RAPIDAPI_KEY=your_rapidapi_key_here
     JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
     ```

### Option 2: Self-Hosted Judge0 (For Production)

1. **Deploy Judge0**
   - Follow instructions at: https://github.com/judge0/judge0
   - Deploy to your own server or cloud provider

2. **Set Environment Variables**
   - Add to your `.env.local` file:
     ```
     JUDGE0_API_URL=your_judge0_instance_url
     JUDGE0_API_KEY=your_api_key_if_required
     ```

## Environment Variables

Add these to your `.env.local` file:

```env
# For RapidAPI
RAPIDAPI_KEY=your_rapidapi_key_here
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com

# OR for self-hosted Judge0
JUDGE0_API_URL=https://your-judge0-instance.com
JUDGE0_API_KEY=your_api_key
```

## Supported Languages

- **JavaScript**: Executed locally (no API key needed)
- **Python**: Requires Judge0 API
- **Java**: Requires Judge0 API
- **C++**: Requires Judge0 API

## Testing

After setting up the API key, test code execution:
1. Go to an interview meeting
2. Select Python, Java, or C++
3. Write and run code
4. Check the output panel

## Troubleshooting

- **"Judge0 API key not configured"**: Make sure you've set `RAPIDAPI_KEY` or `JUDGE0_API_KEY` in your environment variables
- **Rate limit errors**: Upgrade your RapidAPI plan or use self-hosted Judge0
- **Execution timeouts**: Code execution is limited to 5 seconds per request

