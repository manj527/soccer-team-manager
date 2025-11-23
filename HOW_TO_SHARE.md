# How to Share and Run the App

Since this is currently running on your local computer (`localhost`), your team manager cannot access it directly unless you are on the same Wi-Fi network or you deploy it to the internet.

Here are the two best options:

## Option 1: Deploy to the Internet (Recommended)
This gives you a permanent link (e.g., `soccer-manager.vercel.app`) that anyone can open on their phone.

1.  **Create a GitHub Repository**:
    *   Go to [github.com/new](https://github.com/new) and create a repo named `soccer-team-manager`.
    *   Run these commands in your terminal:
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        git branch -M main
        git remote add origin https://github.com/YOUR_USERNAME/soccer-team-manager.git
        git push -u origin main
        ```

2.  **Deploy with Vercel (Free & Easy)**:
    *   Go to [vercel.com](https://vercel.com) and sign up/login with GitHub.
    *   Click **"Add New..."** -> **"Project"**.
    *   Select your `soccer-team-manager` repository.
    *   Click **"Deploy"**.
    *   Vercel will give you a URL. Send that URL to your manager!

## Option 2: Run Locally & Share on Same Wi-Fi
If you are in the same room and on the same Wi-Fi network:

1.  Find your computer's local IP address:
    *   **Mac**: System Settings -> Wi-Fi -> Details (look for IP Address, e.g., `192.168.1.5`).
2.  Start the app with the `--host` flag:
    ```bash
    npm run dev -- --host
    ```
3.  The terminal will show a "Network" URL (e.g., `http://192.168.1.5:5173`).
4.  Tell your manager to type that exact URL into their phone's browser.

**Note**: Option 2 stops working as soon as you close your laptop or stop the server. Option 1 is permanent.
