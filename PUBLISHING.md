# Publishing PlayNova for $0 - and the truth about money

**Status: PlayNova is online** at https://playnovaarcade.github.io/
(GitHub Pages). This file explains how to update it and what is realistic about money.

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
| **Hosting accounts** | GitHub's terms require users to be at least 13 (some countries set a higher age). I did **not** confirm other age rules. | Make sure a parent or guardian knows about the account. |
| **Regions** | AdSense is not available everywhere. Azerbaijan appeared in AdSense's *payment-method* table, but that is **not** the same as a confirmed "supported country" list. | Check Google's current country list and payment-methods page before you plan around it. |
| **Custom domain (your own .com)** | Costs money every year (price varies). I could not confirm whether AdSense requires one. | Skip it at the start. Use the free address from the host. Decide later, after you read AdSense's page on "owning the site". |

**Never** share your passport/ID, home address, bank details, or passwords with
anyone who emails or messages you about "approving your AdSense", "buying traffic",
or "guaranteed earnings". Real ad networks do not charge you to be approved.

---

## 2. Where PlayNova is hosted

PlayNova is live on **GitHub Pages**: https://playnovaarcade.github.io/
The code is stored in the GitHub repository `playnovaarcade/playnovaarcade.github.io`, and
GitHub publishes the `main` branch automatically.

**One thing to know before ads:** GitHub says Pages is "not intended for or
allowed to be used as a free web-hosting service to run your online business", or
for sites mainly meant for commercial transactions. It does not mention ads, so a
free games site with ads is a grey area. GitHub Pages is a great fit while the site
has no ads. Before you turn ads on, re-read GitHub's current rules. If you want to
be on the safe side, you can connect the **same GitHub repository** to Cloudflare
Pages (free, and its terms had no rule against commercial use when checked) without
re-uploading anything.

GitHub's limits: the published site can be up to 1 GB and has a soft bandwidth
limit of 100 GB per month. PlayNova is about 0.25 MB.

---

## 3. Updating the site

Menu names on GitHub change from time to time. If a button is not where I say,
look for the same idea.

1. Change the file on your computer (or ask Claude to change it).
2. Open https://github.com/playnovaarcade/playnovaarcade.github.io, go to the folder the file
   belongs in (for example `games/` for a game page), click **Add file -> Upload
   files**, and drag in the changed files. Files with the same name are replaced.
3. Click **Commit changes**. The live site updates within a few minutes.
4. Keep `index.html` at the top level of the repository, never inside an extra
   folder - otherwise the site shows a 404 error.
5. Open the site on your phone and play the changed game once.

**Google Search Console** is set up for the site and the sitemap is submitted. It
does not promise any ranking. Leave the file `google1881e49ab8bae4a1.html` in the
repository: Google uses it to confirm you own the site.

The `_headers` file is only read by hosts such as Cloudflare Pages and Netlify.
GitHub Pages ignores it, which is harmless.

---

## 4. How ads could work later

Ads are **off**. `js/ads.js` contains a switch and one empty function. No ad
network, tracking script, publisher ID or fake ad exists anywhere in the project.

**Do these in order - skipping steps can get an ad account banned:**

1. **Get real visitors first** and keep improving the games. Ad networks look for
   original, useful content. A site with ten games is a start; more games and
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

- [x] Placeholders filled in and the real address set everywhere.
- [ ] Contact email works and is **not** your main personal email.
- [ ] No personal details you do not want public (home address, school, phone).
- [ ] You played all ten games on a real phone and a computer.
- [ ] A parent/guardian knows about the site and the accounts.
- [x] Privacy Policy and Terms were read.
- [ ] Ads stay **off** until an ad network has approved the site and the privacy
      policy has been updated.
