# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install axios socket.io-client @/components/ui/aceternity

# If you haven't set up Aceternity UI, you may need to install and configure it
# Follow the Aceternity UI documentation for proper setup

# Navigate to the frontend directory
cd frontend

# Install core dependencies
npm install axios socket.io-client

# Install Aceternity UI dependencies
npm install @headlessui/react tailwindcss framer-motion

# Initialize Tailwind CSS (if not already done)
npx tailwindcss init -p

# Create a components folder (if it doesn't exist)
mkdir -p src/components/ui

# Now, manually copy the Aceternity UI components you need from https://ui.aceternity.com/
# into src/components/ui/

# Update your tailwind.config.js to include the new components
# Add this to the content array:
# "./src/components/**/*.{js,jsx,ts,tsx}"