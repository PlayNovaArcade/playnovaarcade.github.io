# PlayNova - Play More. Discover More.

A free, original mini-games website. Ten games with sound effects, no sign-up,
no downloads, no tracking. Everything runs in the visitor's browser.

> **Live at:** https://playnovaarcade.github.io/ (hosted on GitHub Pages).
> See `PUBLISHING.md` for hosting, updates and the honest notes about money.

---

## 1. What is in the box

| Game | What it is |
|------|------------|
| Snake Rush | Classic snake: eat orbs, grow, speed up. Golden bonus stars, two modes, swipe + buttons on phones. |
| Merge Tiles | 2048-style sliding number puzzle with smooth animations. Keys or swipe. |
| Sky Hopper | One-tap arcade: hop through pillars, medals at 10 / 25 / 50. |
| Pop-Up Bop | 30-second whack-the-critter game with golden bonuses, spiky traps and combos. |
| Reaction Speed Test | Wait for green, then react. False-start penalty, saved best time. |
| Memory Match | Flip cards and find pairs. Easy / Medium / Hard, moves and timer. |
| Number Guessing | Higher / lower clues. Three ranges and a "smart limit". |
| Tic-Tac-Toe | Two players, or against a simple computer opponent. |
| Clicker Challenge | Click as much as you can in 15 seconds. |
| Pattern Echo | Watch the pattern, repeat it. Each pad plays its own note. |

**Sound:** every game has short sound effects, made live in the browser (`js/sound.js`, no audio
files). They only play after the player clicks, taps or presses a key, never on page load. One
**Sound** button on every game page (or the M key) turns them on or off for all games.

Site features: search, category filters, A-Z / Z-A sort, favorites, recently
played, "popular on this device", random game button, About / Contact / Privacy /
Terms pages, a 404 page, sitemap, robots.txt, social-share image, favicon.

**Why "Pattern Echo" and not "Simon"?** "Simon" is a trademarked product. The game
here is an original memory-pattern game with its own name, look and shapes.

---

## 2. Why plain HTML, CSS and JavaScript?

I picked the simplest stack that can do everything in your brief:

- **No build step, no installs, no dependencies.** You can double-click
  `index.html` and it works. Hosting is "upload the folder".
- **Nothing to break later.** Frameworks need updates and tooling. This does not.
- **Fast.** About 200 KB of code in total, no external fonts, no external scripts.

**The trade-off:** with React/Vite/Next you get components and a build pipeline,
which is nicer once a site has dozens of games or accounts. Here, every game page
is its own small `.html` file, and the header, footer and cards are shared through
JavaScript (`js/layout.js`, `js/cards.js`). Adding game number 7 means copying one
page and adding one entry to a list (see section 6). If you grow to 50+ games,
moving to a framework would be worth it. For ten games, it is not.

---

## 3. Folder map

```
playnova/
  index.html            Home page
  about.html  contact.html  privacy.html  terms.html  404.html
  games/                One page per game
  css/styles.css        Shared look (colours are at the top as variables)
  css/games.css         Game-specific styles
  js/catalog.js         THE LIST OF GAMES (titles, text, categories)
  js/layout.js          Shared header + footer
  js/home.js            Home page: search, filters, favorites, popular, recent
  js/cards.js           Game card component
  js/storage.js         Safe localStorage (favorites, recents, best scores)
  js/filter.js          Search / filter / sort logic
  js/ads.js             Ads: OFF by default. No ad network is connected.
  js/sound.js           Sound effects for all games + the Sound on/off button
  js/games/*.js         The ten games
  assets/               Favicon, share image
  sitemap.xml  robots.txt  _headers (ignored by GitHub Pages)
  tools/set-domain.js   Optional helper: sets your real web address everywhere
  README.md  PUBLISHING.md
```

---

## 4. Run it on your computer

**Easiest:** open the `playnova` folder and double-click `index.html`.

**Recommended (closer to real hosting):** open a terminal in the folder and run one of:

```
python3 -m http.server 8000      # then open http://localhost:8000
npx serve                        # needs Node.js
```

Everything works either way. All scores and favorites are saved in your browser
(`localStorage`). If your browser blocks storage, the site still works for that
visit and simply forgets things when you close the tab.

---

## 5. Edit things

- **Colours:** the variables at the top of `css/styles.css` (`--blue`, `--violet`, ...).
- **Texts and game descriptions:** `js/catalog.js` (card text) and each `games/*.html` (page text).
- **Contact, About, Privacy and Terms:** see the next section.
- **Turn the header/footer links around:** `js/layout.js`.

### Contact, About, Privacy and Terms

These are filled in: contact email `playnova.support@gmail.com`, About text, GitHub
Pages as the host, and the "last updated" dates. They are plain-language pages,
not legal advice. They describe what the site does today (it collects no personal
data). Update them whenever you change something, and **especially before turning
on ads or analytics** - see `PUBLISHING.md`. When you change them, also change the
"Last updated" date.

### The web address

All pages use `https://playnovaarcade.github.io`. If you move to your own domain
later (for example `https://playnovaarcade.com`):

1. Use "Find and Replace in all files" to replace `https://playnovaarcade.github.io`
   with the new address.
2. Upload the changed files again.

(`tools/set-domain.js` only replaces the original placeholder, so it is not needed
any more.)

---

## 6. Add a new game

1. Copy any file in `games/` (for example `clicker-challenge.html`) and rename it.
   Change the title, description, headings, canonical link, `data-game-id`, and text.
2. Copy a script in `js/games/`, rename it, and write your game. A game is one
   function that draws into the page and returns `{ destroy }` so timers and
   listeners are cleaned up when the player leaves (see `js/lifecycle.js`).
3. Add an entry in `js/catalog.js` (id, title, url, categories, description, colours).
   The card, search, filters, favorites and "related games" pick it up automatically.
4. Add the game's page to `sitemap.xml`.
5. Add a picture for it in `js/thumbnails.js` (or it gets a plain placeholder).

---

## 7. What was tested, and what was not

**Tested by me, in a real browser engine (headless Chromium via Playwright), with
a controlled fake clock so timing games are repeatable - 685 automated checks
passed and the page console showed no errors:**

- All 16 pages load; no broken links, images or scripts; titles, descriptions,
  canonical, Open Graph, favicon present and unique where they should be.
- Home: search, category filters, sort, empty state, favorites (add/remove, badge,
  persistence), recently played, popular, random-game button, mobile menu.
- The four newer games: Snake (eating, growing, pause, walls, wrap mode, best per mode),
  Merge Tiles (merging, scoring, no tile on a move that changes nothing, swipe), Sky
  Hopper (hopping scores points, crash, best, restart), Pop-Up Bop (countdown, bopping,
  combo reset, spiky penalty, 30-second end, best).
- Sound: every game page has the Sound button; no audio is created before the player
  interacts; the on/off choice carries across games; every sound plays without errors.
- The first six games: start, play, win/lose/game-over, restart, best-score saving,
  keyboard controls, reaction false-start penalty, Memory difficulty levels,
  Number Guessing limits and invalid input, Tic-Tac-Toe wins/draws/computer blocks,
  Clicker 15 s end and no double-count from held keys, Pattern Echo sequence and
  notes.
- Corrupt or blocked `localStorage` does not crash anything.
- Restarting or resetting a game mid-round leaves no stale timers behind. (Cleanup
  when you leave a game page is built in, but I did not test it separately.)
- No horizontal scrolling at six phone/tablet/desktop widths, and the main
  buttons are big enough to tap.
- Text and button colour contrast was calculated separately from these checks,
  and the low spots were fixed. It was not run through an accessibility audit tool.
- With ads OFF, no ad slots are visible, and no page loads any ad, analytics or
  other outside script (the site makes no network requests except its own files).

**NOT tested - please be aware:**

- **Safari, Firefox, and real phones/tablets.** Only Chromium was available.
  Please play each game once on your own phone before sharing the link.
- **Screen readers** (NVDA, VoiceOver, TalkBack). The pages use proper headings,
  labels, focus handling and `aria-live` messages, but I could not listen to them.
- **Hearing the sounds.** The sound code ran without errors, but I could not listen to it,
  so check the volume and feel on your own device. Also real-world speed on slow phones.
- **Touch controls on a real phone** (swipes in Snake and Merge Tiles, the Snake buttons,
  tapping in Sky Hopper and Pop-Up Bop). They were tested with a simulated mouse only.
- **Social-preview cards** (how the link looks when shared on WhatsApp, Discord, etc.)
  were not checked on the real apps.
- **Google/ad-network review.** Not applicable yet - ads are off.
- **The legal pages.** They are templates and have not been reviewed by a lawyer.

The automated test files live in my workspace and are not part of this download,
because they depend on tools that only exist there. The manual checklist above
is what to repeat after you change something.

---

## 8. Honest notes

- **SEO:** the pages have good titles, descriptions and sitemap, which helps
  search engines understand them. Nothing here can promise any ranking or traffic.
- **Money:** no earnings are promised anywhere on the site or in these files.
  Read the money section in `PUBLISHING.md` - it explains what is realistic, and
  what needs an adult.
- **"Popular on this device"** counts only plays on the visitor's own device.
  It is labelled that way on purpose; it is not a worldwide ranking.
