# WhatsApp Chat Parser

> **WARNING. FORK MADE FULLY WITH AI.**

The goal of this fork is to store history/backup of multiple chats and to be able to switch between different conversations.

---

## Original Project

Please support the original project creator:
[Pustur/whatsapp-chat-parser-website](https://github.com/Pustur/whatsapp-chat-parser-website)

---

## Key Changes & Features of This Fork

This fork has been modified from the original with the following key differences and features:

*   Removed upload functionality.
*   Checks for WhatsApp Backup folders under the following directory:
    ` /usr/share/nginx/html/chats`
*   Each chat needs to be placed in its own dedicated folder within the above directory, structured as follows:
    ` /WhatsApp Chat with (name)/WhatsApp Chat with (name).txt`
*   Media files (images, videos, etc.) can be placed alongside the `.txt` file within its respective chat folder.
    *(Original phrasing: "Media can be places with the txt file")*
*   A pull-out sidebar is available, listing all detected chats for easy navigation.
*   Different chats can be accessed directly via URL, using the following pattern:
    ` localhost:4000/chat/(name)`
    (Where `(name)` corresponds to the chat folder name, e.g., `John Doe` if the folder is `WhatsApp Chat with John Doe`)

---

**Note on "Media can be places with the txt file":** The original phrasing was kept for strict content adherence, though "placed" might be more conventional. The meaning is clear: media files should reside in the same directory as their corresponding chat text file.
