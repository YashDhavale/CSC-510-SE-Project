TiffinTrails Installation Guide
This document explains how to install and run TiffinTrails locally.

⚙️ Prerequisites
Before starting, ensure the following are installed on your system:

Node.js (v20 or higher)
npm (comes with Node.js)
Python (v3)

💻 Install Node.js
TiffinTrails is built using Node.js, which is required to run the backend and frontend.

If you don’t have Node.js installed yet, please download and install it by following the official instructions here:
👉 [https://nodejs.org/en/download](https://nodejs.org/en/download)

After installation, verify Node.js and npm are installed by running:
```
node -v
npm -v
```
If both commands return version numbers, Node.js and npm are ready to use.

💾 Clone and Setup the Project
# Clone the repository
```
git clone https://github.com/YashDhavale/CSC-510-SE-Project.git
cd CSC-510-SE-Project
cd src/frontend
```
📦 Install Dependencies
```
npm install
cd ..
cd backend
npm install
```
🚀 Start the Development Server
For both the Frontend and Backend
```
npm start
```
The app should now be accessible at: 👉 [http://localhost:3000](http://localhost:3000)
