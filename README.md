# Glossy Salon AI

Build a beautifully designed "Nail Salon Business Co-Pilot" dashboard for salon owners named "Glossy Nails AI Co-Pilot". Use a gorgeous, modern aesthetic featuring soft rose-gold, blush pink, and clean white tones. Create a clean sidebar layout with exactly three tabbed modules:

1. REVIEW & COMPLAINT SOLVER (Maps to: Smart Email Generator)

- Provide a text input area for users to paste a customer review or complaint.

- Provide a dropdown selector for "Audience Type" with options: Client, Manager, Team.

- Provide a dropdown selector for "Tone Variation" with options: Formal Apology, Informal/Friendly, Persuasive/Promotional.

- Clicking "Generate Response" must produce a complete, context-based email response tailored to the selected audience and tone.

2. DAILY SALON CHECKLIST & SCHEDULER (Maps to: AI Task Planner / Scheduler)

- Provide input fields for: "Available Staff Members", "High-Priority Salon Tasks", and "Estimated Busy Hours".

- Clicking "Generate Daily Plan" must output a structured daily schedule that distributes tasks based on urgency.

- Crucial: The output must explicitly include a dedicated section titled "Time Optimization Strategy" offering actionable advice on managing peak salon hours.

3. Y2K FESTIVAL DESIGN GENERATOR & INSIGHTS (Maps to: AI Research Assistant)

- Provide a text input for a trend theme or client request (e.g., "Y2K Festival Vibes").

- Clicking "Extract Insights" must analyze the trend request and output:

  * A summary of the aesthetic elements.

  * Key recommendations for specific nail art techniques and materials.

  * Ready-to-use social media copy to simplify marketing execution.

Include a permanent footer banner visible across all tabs that reads: "Disclaimer: Responsible AI - AI-generated text should be reviewed before sending to clients." Ensure all layouts are fully responsive for mobile and desktop, and display a loading spinner when data is processing.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://rosy-ai-co-pilot.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3fa71df4-4f51-4dc0-90a4-6f896ab69166).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
