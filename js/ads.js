/* ==========================================================================
   PlayNova - ads.js
   FUTURE ADVERTISING SUPPORT. Ads are OFF. Nothing here loads any ad
   network, tracks anyone, or shows fake ads. The site works fully without it.

   How it works
   ------------
   Pages contain empty "slots" such as:
       <div class="ad-slot" data-ad-slot="home-banner"></div>
   While ads are off, every slot is hidden, so there are no gaps on the page.

   Slots used on the site:
       home-banner              between homepage sections
       game-below-instructions  under the "How to play" box on game pages
       game-below-game          under the game area on game pages
   (Never put ads on top of the game area itself, and keep them well away from
   buttons people tap while playing. Accidental clicks are against the rules of
   every real ad network.)

   Turning on real ads later (read PUBLISHING.md first!)
   -----------------------------------------------------
   1. A parent or guardian (18+) must apply to a real ad network, such as
      Google AdSense, and the network must APPROVE the site.
   2. Follow that network's policies: label ads, no accidental clicks, and
      update privacy.html (ad networks usually use cookies, so visitors in
      some regions must be asked for consent first).
   3. Paste the network's script tag into the <head> of the pages, then
      write the network's ad markup inside renderApprovedAd() below.
   4. Set enabled to true.

   Do NOT type any publisher ID into this file until the network has approved
   the site and given you one.
   ========================================================================== */
(function () {
  'use strict';

  var AD_SETTINGS = {
    // Master switch. Leave false until a real ad network has approved the site.
    enabled: false,

    // Set to true only to PREVIEW where the slots sit. Shows a dashed box that is
    // clearly labelled as reserved space. It is not an ad and earns nothing.
    showPlaceholders: false
  };

  /**
   * INTEGRATION POINT - the only place real ad code should ever go.
   * Called once for every slot while AD_SETTINGS.enabled is true.
   * Put the approved ad unit inside slotElement and return true.
   * Return false to leave the slot hidden.
   */
  function renderApprovedAd(slotElement, slotName) { // eslint-disable-line no-unused-vars
    return false; // no ad network connected
  }

  function showPlaceholder(slot, name) {
    var label = document.createElement('span');
    label.className = 'ad-slot-label';
    label.textContent = 'Reserved ad space (ads are switched off)';
    var box = document.createElement('div');
    box.className = 'ad-slot-box';
    box.textContent = 'Slot: ' + name;
    slot.appendChild(label);
    slot.appendChild(box);
  }

  function init() {
    var slots = document.querySelectorAll('[data-ad-slot]');
    Array.prototype.forEach.call(slots, function (slot) {
      var name = slot.getAttribute('data-ad-slot');
      var rendered = false;

      if (AD_SETTINGS.enabled) {
        try {
          rendered = renderApprovedAd(slot, name) === true;
        } catch (error) {
          rendered = false; // an ad problem must never break the page
        }
      }

      if (rendered) {
        slot.hidden = false;
      } else if (AD_SETTINGS.showPlaceholders) {
        showPlaceholder(slot, name);
        slot.hidden = false;
      } else {
        slot.hidden = true;
      }
    });
  }

  window.PlayNovaAds = { init: init, settings: AD_SETTINGS };
  init();
})();
