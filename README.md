# HoYoLAB Auto Check-In
This is a fork of torikushiii's multi-featured Honkai: Star Rail tool ([starrail-auto](https://github.com/torikushiii/starrail-auto)) that has been pared down to contain just the Google Apps Script for automatically performing the HoYoLAB check-in, and then added to in order to support Genshin Impact's check-in.

# Services
Use the script with Google Apps Script to run automatically in the cloud.
- [Google Apps Script](https://github.com/torikushiii/starrail-auto/tree/master/services/google-script)

# Features
- [x] Auto Check-in
- [x] Multiple accounts
- [x] Discord notifications

# Pre-requisites
- Google Account

# Set up
1. Go to [Google Apps Script](https://script.google.com/home).
2. Create a new project.
    ![](https://i.imgur.com/y3FgPUV.png)
3. You will be greeted with this screen, delete the contents of `myFunction` and click on "Untitled project" to rename it.
    ![](https://i.imgur.com/4dRgXLe.png)
4. Copy the contents of `index.js` and paste it into the editor.
    ![](https://i.imgur.com/ZaA2oSX.png)
5. Click on "Project settings".
    ![](https://i.imgur.com/GMhLjEw.png)
6. Scroll down and add the following to the "Script properties" section:
   ```
   COOKIE
   DISCORD_WEBHOOK
   ```
    ![](https://i.imgur.com/BudKBiI.png)
7. Add `COOKIE` with your cookie.
   - **IF YOU WANT TO RUN IT WITH MULTIPLE ACCOUNTS, SEPARATE THE COOKIES WITH A HASH (#).**
   - **EXAMPLE: `COOKIE=cookie1#cookie2#cookie3`**
8. Add `DISCORD_WEBHOOK` with your Discord webhook (optional).
9. Click on "Save script properties".
10. Click on "Editor" and then "Save Project" and "Run" to run it once.
    ![](https://i.imgur.com/4B8jZea.png)
    ![](https://i.imgur.com/SvNODZL.png)
11. When first running the script, you will be prompted to authorize the script.
    ![](https://i.imgur.com/igXjtkO.png)
12. Click on "Review Permissions".
13. Choose your Google account if prompted.
14. You will be prompted to allow the script to access your Google account.
    ![](https://i.imgur.com/n7gsH6o.png)
15. Click on "Allow".
16. After that when you run the script, the Execution log will show the output.
    ![](https://i.imgur.com/KFGR003.png)

# Getting your cookie
1. Go to the Daily Check-In page [here](https://act.hoyolab.com/bbs/event/signin/hkrpg/index.html?act_id=e202303301540311).
2. Log in with your miHoYo account.
3. Open the browser console (F12).
4. Click on the "Console" tab.
5. Type in `document.cookie` in the console and press Enter.
6. Copy the output from the console.
   ![](https://i.imgur.com/hFCL4yN.png)
7. Paste it into the "Value" field for "COOKIE" in the "Script properties" section.
   - **IF YOU WANT TO RUN IT WITH MULTIPLE ACCOUNTS, SEPARATE THE COOKIES WITH A HASH (#).**
   - **EXAMPLE: `COOKIE=cookie1#cookie2#cookie3`**
8. Click on "Save script properties".

# Trigger
If you want to automate the script, you can add a trigger to run it daily.
1. Click on the "Triggers" icon.
    ![](https://i.imgur.com/hAjfBhr.png)
2. Click on "Add Trigger".
    ![](https://i.imgur.com/WCVRpKA.png)
3. Choose the following settings:
    - Choose which function to run: `run`
    - Choose which deployment should run: `Head`
    - Select event source: `Time-driven`
    - Select type of time based trigger: `Day timer`
    - Select time of day: `Midnight to 1am` or any time when the check-in resets
    ![](https://i.imgur.com/HSDge0k.png)
4. Click on "Save".

# Discord Webhooks
This is an **OPTIONAL** feature. If you want to receive a Discord notification when the check-in is successful, you can create a Discord webhook and add it to the `config.js` file.

1. Go to edit channel settings. (Create your own server if you don't have one.)
   ![](https://i.imgur.com/FWfK3My.png)
2. Go to the "Integrations" tab and click on "Create Webhook".
   ![](https://i.imgur.com/DnELZJl.png)
3. Create a name for your webhook and click on "Copy Webhook URL".
   ![](https://i.imgur.com/AkfTTBB.png)
4. Paste the URL into the `DISCORD_WEBHOOK` field at the `config.js` file.
5. Click on "Save Changes".
   ![](https://i.imgur.com/KFYeonU.png)
6. You should receive a Discord notification when the check-in is successful.
   ![](https://i.imgur.com/MOkfwrK.png)
7. And if you enable stamina check, you should receive a Discord notification when your stamina is above your set threshold and when it capped.
   ![](https://i.imgur.com/B1uDNiT.png)
