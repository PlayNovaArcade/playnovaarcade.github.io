# Publishing PlayNova for $0 - and the truth about money

**Status: PlayNova is NOT online.** Nothing has been uploaded anywhere. The steps
below are how *you* (with an adult's help where noted) put it online.

I am not a lawyer or a financial adviser, and the rules of hosts and ad networks
change. Everything here was checked against the companies' own pages in October
2026 - but **always re-read the current terms yourself before you sign up.**

---

## 1. Read this first: money, age and what is realistic

**No income is promised.** A site like this earns nothing until it has visitors,
and nothing from ads until an ad network approves it. For a brand-new site, that
usually takes much longer than a few weeks. Earning $300 this month from ads is
not a realistic expectation. Plan for "free to build, slow to grow", and treat any
money as a bonus.

### What needs an adult (you are 15)

| Thing | Rule I found | What to do |
|-------|--------------|------------|
| **Google AdSense** | Applicants must be **18 or older**. Google says a person under 18 *may have a parent or guardian sign up using their own Google Account*; if approved, payments go to that adult. | Only a parent/guardian can apply, in **their** name, with **their** Google account and bank details. Do not use a fake age or an adult's account without them knowing. They are responsible for following the rules. |
| **Payments and taxes** | Money paid by an ad network goes to the account holder (the adult). Taxes and bank rules depend on that adult and your country. | Ask the adult to check tax and banking rules in Azerbaijan. I cannot give tax advice. |
| **Hosting accounts** | Netlify's website terms say users must be at least 13 (and "your country's minimum age may be older"); the account contract itself was not visible to me. Cloudflare's terms state no minimum age on the page I read. I did **not** confirm other age rules. | Ask a parent or guardian to help you create the account and agree to the terms. |
| **Regions** | AdSense is not available everywhere. Azerbaijan appeared in AdSense's *payment-method* table, but that is **not** the same as a confirmed "supported country" list. | Check Google's current country list and payment-methods page before you plan around it. |
| **Custom domain (your own .com)** | Costs money every year (price varies). I could not confirm whether AdSense requires one. | Skip it at the start. Use the free address from the host. Decide later, after you read AdSense's page on "owning the site". |

**Never** share your passport/ID, home address, bank details, or passwords with
anyone who emails or messages you about "approving your AdSense", "buying traffic",
or "guaranteed earnings". Real ad networks do not charge you to be approved.

---

## 2. Where to host it for free (commercial-use check)

You said you want to run ads, so the host's terms matter. Not every free host
allows a site that makes money.

| Host | Free? | Fine for a site with ads? | Notes |
|------|-------|---------------------------|-------|
| **Cloudflare Pages** | Yes | **Best fit.** I found no rule in Cloudflare's terms that bans commercial use of free services. | Free limits I read: 500 builds/month, 20,000 files, 25 MiB per file, 100 custom domains per project. PlayNova uses about 40 files. Their terms ban processing credit-card data on free-service sites - PlayNova has no shop, so this is fine. |
| **Netlify** | Yes | **Probably OK, with a caveat.** An answer in Netlify's community forum (2021) says free-plan commercial use is allowed. That is a forum post, not the terms. | Read Netlify's current plan page and subscription agreement. Plan limits change. |
| **Vercel (Hobby)** | Yes | **No.** Vercel says the Hobby plan is limited to non-commercial, personal use. | Do not use it for a site with ads. |
| **GitHub Pages** | Yes | **Avoid.** GitHub says Pages is not allowed as a free host "to run your online business", or for sites mainly meant for commercial transactions. It does not mention ads, so it is a grey area. | Good for hobby projects with no money involved. Not recommended here. |

**Recommendation:** Cloudflare Pages. Netlify is a fine second choice.

---

## 3. Put it online (the beginner way - no Git needed)

Menu names on these websites change from time to time. If a button is not where
I say, look for the same idea.

1. **Fill in the placeholders** (see `README.md`, section 5) - contact email,
   About text, hosting provider name and dates. Do not publish a home address,
   phone number or your school. A new free email just for the site is a good idea.
2. **Try it on your computer** first (`README.md`, section 4).
3. With a parent or guardian, **create a free account** on Cloudflare
   (or Netlify). Use the dedicated email.
4. **Cloudflare:** open *Workers & Pages* -> *Create* -> choose the *Pages* option ->
   *Upload assets* (direct upload). Give the project a name. Drag in the **contents
   of the `playnova` folder** so that `index.html` is at the top level, not inside
   an extra folder. Then *Deploy*.
   **Netlify:** the "Netlify Drop" page lets you drag the folder onto the page.
5. You will get a free address (for example `something.pages.dev`). **Open it on
   your phone** and play every game once. Check that links, the favicon and the
   About / Privacy / Terms pages work.
6. **Set the real address** so search engines and social sites see correct links:
   `node tools/set-domain.js https://your-real-address` (or Find & Replace, see
   `README.md`), then upload the folder again.
7. **Updating later:** change a file, upload the folder again. The host replaces
   the old version.
8. **Optional - Git:** if you later want automatic deploys, put the folder in a Git
   repository on a service such as GitHub (used only to *store* code, not to host
   the site) and connect it to Cloudflare Pages. Not needed to start.
9. **Optional - Google Search Console:** free, lets you submit `sitemap.xml` and see
   if Google can read the site. It does not promise any ranking. Check Google's age
   rules for the account you use.

The `_headers` file adds a few safety headers. Cloudflare Pages and Netlify read it;
other hosts may ignore it, which is harmless.

---

## 4. How ads could work later

Ads are **off**. `js/ads.js` contains a switch and one empty function. No ad
network, tracking script, publisher ID or fake ad exists anywhere in the project.

**Do these in order - skipping steps can get an ad account banned:**

1. **Get real visitors first** and keep improving the games. Ad networks look for
   original, useful content. A site with six games is a start; more games and
   better descriptions help.
2. **A parent/guardian applies** to an ad network (for example AdSense) under their
   own account, and the network must **approve the site** and review it. Follow
   exactly what the network tells you to add to the pages.
3. **Update the legal pages BEFORE ads appear.** Today they say the site collects no
   personal data and uses no ads. That stops being true once ads are on. Change:
   - `privacy.html` - the "does not collect personal information" line, the
     "no analytics or advertising" line, and the "Advertising in the future" section.
   - `index.html` - the sentence near the bottom saying PlayNova does not collect
     personal information.
   - Ad networks use cookies and similar technology. In some regions (for example
     the EU/UK) visitors must be asked for consent first, and some networks require
     a specific consent tool. Check the network's current rules, and ask a
     qualified adult or professional to review your privacy policy.
4. **Add the network's code:** paste the approved script into the `<head>` of the
   pages, write the ad markup in `renderApprovedAd()` in `js/ads.js`, then set
   `enabled: true`. Slots exist on the home page and below the game on game pages.
   Do **not** type a publisher ID anywhere until the network gives you one.
5. **Never click your own ads, never ask others to, and never place ads where people
   tap while playing.** This is the fastest way to get banned. The slots are placed
   away from the game controls on purpose.
6. Re-test on a phone after the change. I could not test real ads, because none are
   connected.

### Other realistic ways to earn (no promises)

- **Direct sponsors / "advertise here":** only makes sense after the site has steady
  visitors. Needs an adult for contracts and payments.
- **Affiliate programs:** most have their own age and country rules, usually need
  an adult account, and work for sites that recommend products. They are a poor fit
  for a games-only site.
- **Selling a service** (for example, building simple websites for local businesses):
  usually the fastest route to real money, but it still needs adult consent for
  contracts and payment, and takes sales effort. PlayNova can be a portfolio piece.

**Not included on purpose:** shops, subscriptions, crypto, gambling-style features,
loot boxes. They add legal and age problems this project avoids.

---

## 5. Checklist before you share the link

- [ ] All five `[REPLACE ...]` placeholders are filled in (search for `[REPLACE`).
- [ ] The real address replaced `https://YOUR-DOMAIN-HERE.example`.
- [ ] Contact email works and is **not** your main personal email.
- [ ] No personal details you do not want public (home address, school, phone).
- [ ] You played all six games on a real phone and a computer.
- [ ] A parent/guardian knows about the site and the accounts.
- [ ] Privacy Policy and Terms were read by an adult (they are templates).
- [ ] Ads stay **off** until an ad network has approved the site and the privacy
      policy has been updated.
