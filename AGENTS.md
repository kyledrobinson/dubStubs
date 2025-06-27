# AGENT DIRECTIVES — shimm3r

> Your mission is to **build boldly**, design with **restraint**, and **execute with purpose**.
> No ego. No fluff. Only precision, clarity, and world-class craft.

---

## 🔧 MODUS OPERANDI

- You are assisting in the creation and launch of **shimm3r.com** **any other projects** — a design- development- and agent-focused AI startup.
- Follow instructions *to the letter*. Nothing more. Nothing less.
- Be smart. Be strategic. Don't overbuild. Don't oversell.
- Avoid feature creep at all cost. Avoid over-engineering and overthinking.
- Always prioritize writing clean, simple, and modular code.
- do what the user asks for, exactly are precisely. nothing more, nothing less.
- **Simple, clean, modular code only.** No magical thinking, no overengineering.
- Default to clarity: if something's confusing, it needs fixing.
- Think like a product designer and a systems engineer — at the same time.
- If you’re unsure: clarify. Then execute.
- Check that you've implemented every requirement fully & completely.
- Prioritize simplicity and minimalism in your solutions.
- Use simple & easy-to-understand language. Write in short sentences.
- keep our codebase simple: resist creating new files unless it really makes sense.

---

## ⚙️ TECH STACK

- **Frontend**: React (w/ TailwindCSS), HTML5, CSS3, SVG, Framer Motion  
- **Backend**: Node.js + Express (experimental Rust+WASM for high-perf agents)  
- **Database**: MySQL (primary) + SQLite (lightweight local), possibly Supabase, or google spreadsheets for rapid prototyping  
- **Auth**: Clerk or Firebase for fast, secure auth with good DX  
- **Payments**: Stripe (simple, flexible, proven)  
- **Hosting**: Vercel for frontend, Namecheap for legacy DNS and deployment  
- **CI/CD**: GitHub Actions for auto-deploy and testing  
- **Image & Asset Handling**: Cloudinary (image optimization), DALL·E/YOLO integration  
- **Experimental**: WebAssembly, Lottie, CesiumJS, OpenAI Codex, PyScript  

---

## 📁 CURRENT FILE STRUCTURE

_(generate with:)_  
```bash
brew install tree
tree -L 4 -a -I 'node_modules|.git|__pycache__|.DS_Store|.pytest_cache|.vscode|.next'

---

# UI DESIGN PRINCIPLES
- Be generous with explaining your thought process, not just what the code does.
- Obvious syntax doesn't need explanation.
Example: const x = 5 does not need a comment.
- Comment decisions, architecture, tradeoffs, "why this and not that."
- Don’t delete existing comments unless they are provably wrong.
- Maintain clarity in the code as if someone else will take over tomorrow.
- Light and dark modes made solely in css are preferred, and always required.

---

✍️ COMMENTS POLICY
- Be generous with explaining your thought process, not just what the code does.
- Obvious syntax doesn't need explanation.
Example: const x = 5 does not need a comment.
- Comment decisions, architecture, tradeoffs, "why this and not that."
- Don’t delete existing comments unless they are provably wrong.
- Maintain clarity in the code as if someone else will take over tomorrow.

---

🧠 MENTAL MODEL
- Simple > Clever
- Readable > Obscure
- Predictable > Magical
- Documented > Assumed
- Modular > Monolithic

---

🚨 RED FLAGS
- Too many files? Re-evaluate.
- One function doing too much? Refactor.
- Lots of comments trying to explain convoluted logic? Rewrite the logic.
- Functions over 50 lines? Probably a problem.
- If you’re saying “I’ll clean this up later” — clean it up now.

---

✅ WHEN YOU SUBMIT WORK
- Before pushing code or changes:
- Did you follow the instructions exactly?
- Did you keep it simple and modular?
- Did you avoid unnecessary abstractions?
- Did you add strategic comments?
- Did you update the file structure, if needed?
- Did you document anything new in this file?

---

#API RULES
- Guidance on `.env` files: How to use them for storing API keys and other sensitive credentials.
- Instructions for `dotenv`: How to load these variables into the application.
- Security best practices: Emphasizing never hardcoding API keys and ensuring .env files are excluded from version control (e.g., via .gitignore).

---

# HEADER COMMENTS
- EVERY file HAS TO start with 3 comments!
- the first comment needs to be the exact location of the file, for example: location/location/file-name.tsx (or .py or .md etc)
- the 2nd and 3rd comment should be a clear description of what this file was created to do. what IS and ISN'T the purpose of this file.
- NEVER delete these "header comments" from the files you're editing.

---

# IMPORTANT
- BE VERY SUSPICIOUS OF EVERY COMPLICATION in our code. SIMPLE = GOOD, COMPLEX = BAD.
- Always prioritize writing clean, simple, and modular code.
- do not add unnecessary complications.
- Implement precisely what the user asks for, without additional features or complexity.
- Prioritize simplicity and minimalism in your solutions.


