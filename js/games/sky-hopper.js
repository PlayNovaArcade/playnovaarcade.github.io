/* ==========================================================================
   PlayNova - Sky Hopper
   Tap to hop. Guide Nova the little comet through the gaps between the
   crystal pillars. Every gap is one point. It gets faster and tighter.

   States:  ready -> playing -> over   (paused if you switch tabs)
   ========================================================================== */
(function () {
  'use strict';

  var D = window.PlayNovaDom;
  var Storage = window.PlayNovaStorage;
  var Lifecycle = window.PlayNovaLifecycle;
  var Sound = window.PlayNovaSound;

  // The game is drawn on a 360 x 540 "world" that is scaled to fit the screen.
  var W = 360;
  var H = 540;
  var GROUND = 60; // height of the ground strip
  var PLAYER_X = 100;
  var RADIUS = 15;
  var GRAVITY = 1500; // pixels per second, per second
  var HOP = -430; // upward speed after a hop
  var MAX_FALL = 620;
  var PILLAR_W = 62;
  var SPACING = 205; // distance between pillars
  var RESTART_DELAY_MS = 550; // stops an accidental tap from skipping the result

  var MEDALS = [
    { at: 50, name: 'Gold', color: '#ffc552' },
    { at: 25, name: 'Silver', color: '#d7def5' },
    { at: 10, name: 'Bronze', color: '#ff9f5a' }
  ];

  function medalFor(score) {
    for (var i = 0; i < MEDALS.length; i++) if (score >= MEDALS[i].at) return MEDALS[i];
    return null;
  }

  window.PlayNovaGamePage.start(function mount(root) {
    var GAME_ID = 'sky-hopper';
    var lc = Lifecycle.create();

    var state = 'ready';
    var y = H / 2;
    var vy = 0;
    var pillars = []; // { x, gapY, gap, scored }
    var score = 0;
    var best = Storage.numberFrom(Storage.getBest(GAME_ID), 'score');
    var lastTime = 0;
    var clock = 0; // seconds, used for small animations
    var scroll = 0; // how far the background has moved
    var rafId = 0;
    var overAt = 0;
    var flapTimer = 0;
    var stars = [];
    for (var s = 0; s < 40; s++) stars.push({ x: Math.random() * W, y: Math.random() * (H - GROUND - 40), r: Math.random() * 1.4 + 0.4, depth: Math.random() * 0.5 + 0.2 });

    /* ----- Build the screen ----- */

    var scoreStat = D.stat('Score', '0');
    var bestStat = D.stat('Best', best === null ? '-' : best);

    var canvas = D.el('canvas', { class: 'game-canvas', attrs: { 'aria-hidden': 'true' } });
    var overlayTitle = D.el('h2');
    var overlayText = D.el('p');
    var overlayButton = D.el('button', {
      class: 'btn btn-primary',
      attrs: { type: 'button' },
      on: {
        click: function (event) {
          event.stopPropagation();
          if (state === 'paused') {
            resume();
            focusWrap();
          } else {
            playAgain();
          }
        }
      }
    });
    var overlay = D.el('div', { class: 'game-overlay', attrs: { hidden: true } }, [overlayTitle, overlayText, overlayButton]);
    var wrap = D.el('div', {
      class: 'canvas-wrap hopper-wrap',
      attrs: { tabindex: '0', role: 'group', 'aria-label': 'Sky Hopper. Press Space or tap to hop.' }
    }, [canvas, overlay]);

    var status = D.el('p', { class: 'status-line', attrs: { role: 'status', 'aria-live': 'polite' } });

    root.appendChild(D.statsBar([scoreStat, bestStat]));
    root.appendChild(wrap);
    root.appendChild(status);
    root.appendChild(D.el('p', { class: 'note', text: 'Tap, click, or press Space or the Up arrow to hop. Medals at 10, 25 and 50.' }));

    var stage = root.closest('.game-stage') || root;

    /* ----- Game flow ----- */

    function difficulty() {
      return {
        speed: Math.min(235, 150 + score * 2.2),
        gap: Math.max(122, 172 - score * 1.6)
      };
    }

    function addPillar(x) {
      var gap = difficulty().gap;
      var minY = 60 + gap / 2;
      var maxY = H - GROUND - 50 - gap / 2;
      pillars.push({ x: x, gapY: minY + Math.random() * (maxY - minY), gap: gap, scored: false });
    }

    function reset() {
      state = 'ready';
      y = H / 2 - 30;
      vy = 0;
      score = 0;
      pillars = [];
      scoreStat.set('0');
      overlay.hidden = true;
      status.textContent = 'Tap or press Space to start.';
      startLoop();
    }

    function startPlaying() {
      state = 'playing';
      status.textContent = '';
      pillars = [];
      addPillar(W + 60);
      Sound.play('start');
      try { wrap.scrollIntoView({ block: 'nearest' }); } catch (error) { /* older browsers */ }
    }

    function hop() {
      if (state === 'ready') startPlaying();
      if (state === 'over') {
        if (performance.now() - overAt >= RESTART_DELAY_MS) playAgain();
        return;
      }
      if (state === 'paused') {
        resume();
        return;
      }
      if (state !== 'playing') return;
      vy = HOP;
      flapTimer = 0.15;
      Sound.play('flap');
    }

    function playAgain() {
      reset();
      focusWrap();
    }

    function crash() {
      state = 'over';
      overAt = performance.now();
      Sound.play('hit');

      var isNewBest = score > 0 && (best === null || score > best);
      if (isNewBest) {
        best = score;
        Storage.setBest(GAME_ID, null, { score: score });
        bestStat.set(best);
      }
      var medal = medalFor(score);
      lc.setTimeout(function () {
        if (state !== 'over') return;
        Sound.play(isNewBest ? 'best' : 'lose');
        overlayTitle.textContent = isNewBest ? 'New best: ' + score + '!' : 'Score: ' + score;
        overlayText.textContent = (medal ? medal.name + ' medal! ' : '') +
          (best !== null ? 'Best: ' + best + '. ' : '') +
          (medal ? '' : 'Reach 10 for a bronze medal.');
        overlayButton.textContent = 'Play again';
        overlay.hidden = false;
      }, 450);
      status.textContent = 'Crash! You scored ' + score + (medal ? ' and won a ' + medal.name.toLowerCase() + ' medal.' : '.');
    }

    function pause() {
      if (state !== 'playing') return;
      state = 'paused';
      overlayTitle.textContent = 'Paused';
      overlayText.textContent = 'Tap or press Space to carry on.';
      overlayButton.textContent = 'Resume';
      overlay.hidden = false;
    }

    function resume() {
      if (state !== 'paused') return;
      state = 'playing';
      overlay.hidden = true;
      vy = Math.min(vy, 0);
      lastTime = 0;
      startLoop();
    }

    function focusWrap() {
      try { wrap.focus({ preventScroll: true }); } catch (error) { wrap.focus(); }
    }

    /* ----- Physics ----- */

    function update(dt) {
      clock += dt;
      if (flapTimer > 0) flapTimer -= dt;

      if (state === 'ready') {
        y = H / 2 - 30 + Math.sin(clock * 3) * 8; // gentle bobbing while waiting
        scroll += 40 * dt;
        return;
      }
      if (state === 'over') {
        // Fall to the ground after a crash.
        if (y < H - GROUND - RADIUS) {
          vy = Math.min(MAX_FALL, vy + GRAVITY * dt);
          y = Math.min(H - GROUND - RADIUS, y + vy * dt);
        }
        return;
      }
      if (state !== 'playing') return;

      var level = difficulty();
      scroll += level.speed * dt;
      vy = Math.min(MAX_FALL, vy + GRAVITY * dt);
      y += vy * dt;
      if (y < RADIUS) {
        y = RADIUS;
        vy = 0;
      }

      pillars.forEach(function (p) { p.x -= level.speed * dt; });
      if (pillars.length && pillars[0].x < -PILLAR_W) pillars.shift();
      var last = pillars[pillars.length - 1];
      if (!last || last.x < W - SPACING) addPillar((last ? last.x : W) + SPACING);

      // Scoring and collisions
      for (var i = 0; i < pillars.length; i++) {
        var p = pillars[i];
        if (!p.scored && p.x + PILLAR_W / 2 < PLAYER_X) {
          p.scored = true;
          score++;
          scoreStat.set(score);
          Sound.play(score % 10 === 0 ? 'coin' : 'point');
        }
        var forgive = 3; // a tiny bit of mercy so near-misses feel fair
        var r = RADIUS - forgive;
        if (PLAYER_X + r > p.x && PLAYER_X - r < p.x + PILLAR_W) {
          if (y - r < p.gapY - p.gap / 2 || y + r > p.gapY + p.gap / 2) {
            crash();
            return;
          }
        }
      }

      if (y + RADIUS >= H - GROUND) {
        y = H - GROUND - RADIUS;
        crash();
      }
    }

    /* ----- Drawing ----- */

    function resize() {
      var cssWidth = wrap.clientWidth;
      if (!cssWidth) return;
      var ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * ratio);
      canvas.height = Math.round(cssWidth * ratio * H / W);
      draw();
    }

    function pillarPath(ctx, x, top, height, capAtBottom) {
      var grad = ctx.createLinearGradient(x, 0, x + PILLAR_W, 0);
      grad.addColorStop(0, '#5b3fd6');
      grad.addColorStop(0.45, '#9b7bff');
      grad.addColorStop(1, '#4a2fb8');
      ctx.fillStyle = grad;
      ctx.fillRect(x, top, PILLAR_W, height);
      // A crystal cap at the open end
      var capY = capAtBottom ? top + height - 18 : top;
      ctx.fillStyle = '#c9b6ff';
      ctx.fillRect(x - 5, capY, PILLAR_W + 10, 18);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(x + 8, top, 6, height);
    }

    function draw() {
      var ctx = canvas.getContext('2d');
      if (!ctx) return;
      var scale = canvas.width / W;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);

      // Sky
      var sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#0a0f1f');
      sky.addColorStop(1, '#1b1550');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Stars drift slowly (parallax)
      stars.forEach(function (star) {
        var sx = ((star.x - scroll * star.depth * 0.2) % W + W) % W;
        ctx.globalAlpha = 0.45 + 0.35 * Math.sin(clock * 2 + star.x);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // A distant planet
      ctx.fillStyle = 'rgba(122,77,255,0.35)';
      ctx.beginPath();
      ctx.arc(((290 - scroll * 0.05) % (W + 200) + W + 200) % (W + 200) - 100, 120, 46, 0, Math.PI * 2);
      ctx.fill();

      // Pillars
      pillars.forEach(function (p) {
        var top = p.gapY - p.gap / 2;
        var bottom = p.gapY + p.gap / 2;
        pillarPath(ctx, p.x, 0, top, true);
        pillarPath(ctx, p.x, bottom, H - GROUND - bottom, false);
      });

      // Ground with moving stripes
      ctx.fillStyle = '#121a35';
      ctx.fillRect(0, H - GROUND, W, GROUND);
      ctx.fillStyle = '#2a63f0';
      ctx.fillRect(0, H - GROUND, W, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      var offset = scroll % 40;
      for (var gx = -offset; gx < W; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, H - GROUND + 5);
        ctx.lineTo(gx + 20, H - GROUND + 5);
        ctx.lineTo(gx + 6, H);
        ctx.lineTo(gx - 14, H);
        ctx.closePath();
        ctx.fill();
      }

      // Nova the comet: a tail of sparks, a glowing body, one big eye
      var tilt = Math.max(-0.5, Math.min(1.1, vy / 600));
      ctx.save();
      ctx.translate(PLAYER_X, y);
      ctx.rotate(state === 'ready' ? 0 : tilt);
      for (var t = 1; t <= 4; t++) {
        ctx.globalAlpha = 0.5 - t * 0.1;
        ctx.fillStyle = '#ff8a4c';
        ctx.beginPath();
        ctx.arc(-t * 9, Math.sin(clock * 20 + t) * 2, RADIUS - t * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowColor = '#ffc552';
      ctx.shadowBlur = 18;
      var body = ctx.createRadialGradient(-4, -5, 2, 0, 0, RADIUS);
      body.addColorStop(0, '#fff3c4');
      body.addColorStop(1, '#ffb43d');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // wing
      ctx.fillStyle = '#ff8a4c';
      ctx.beginPath();
      var wingUp = flapTimer > 0 ? -12 : 2;
      ctx.ellipse(-4, wingUp * 0.5 + 3, 9, 5, flapTimer > 0 ? -0.6 : 0.3, 0, Math.PI * 2);
      ctx.fill();
      // eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(6, -4, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0a0f1f';
      ctx.beginPath();
      ctx.arc(7.5, -4, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Big score at the top
      if (state !== 'ready') {
        ctx.font = '800 44px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(10,15,31,0.8)';
        ctx.strokeText(String(score), W / 2, 64);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(String(score), W / 2, 64);
      } else {
        ctx.font = '700 20px system-ui, -apple-system, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#eef1ff';
        ctx.fillText('Tap or press Space to hop', W / 2, H - GROUND - 120);
      }
    }

    /* ----- The animation loop ----- */

    function frame(time) {
      rafId = 0;
      if (!lastTime) lastTime = time;
      var dt = Math.min(0.034, (time - lastTime) / 1000); // cap big jumps (slow devices, tab switches)
      lastTime = time;
      update(dt);
      draw();
      var stillMoving = state === 'ready' || state === 'playing' || (state === 'over' && y < H - GROUND - RADIUS);
      if (stillMoving) rafId = window.requestAnimationFrame(frame);
    }

    function startLoop() {
      if (rafId) return;
      lastTime = 0;
      rafId = window.requestAnimationFrame(frame);
    }

    /* ----- Input ----- */

    lc.on(wrap, 'pointerdown', function (event) {
      if (event.button > 0) return;
      if (event.target.closest && event.target.closest('button')) return;
      event.preventDefault();
      focusWrap();
      hop();
    });

    lc.on(document, 'keydown', function (event) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if (event.key !== ' ' && event.key !== 'ArrowUp' && event.key !== 'w' && event.key !== 'W') return;
      var target = event.target;
      var tag = target && target.tagName ? target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button' || tag === 'a') return;
      var active = document.activeElement;
      if (state !== 'playing' && active && active !== document.body && !stage.contains(active)) return;
      event.preventDefault();
      hop();
    });

    lc.on(document, 'visibilitychange', function () { if (document.hidden) pause(); });
    lc.on(window, 'blur', pause);
    lc.on(window, 'resize', resize);

    resize();
    reset();

    return {
      destroy: function () {
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = 0;
        lc.destroy();
      }
    };
  });
})();
