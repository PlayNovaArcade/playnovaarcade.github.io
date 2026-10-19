/* ==========================================================================
   PlayNova - dom.js
   Tiny helpers for building page elements safely.

   Why this exists: we never paste text into the page with innerHTML.
   Everything goes through textContent, so a search term like
   <script>alert(1)</script> is shown as plain text and can never run.
   ========================================================================== */
(function () {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  /**
   * Create an element.
   *   el('button', { class: 'btn', text: 'Play', attrs: { type: 'button' }, on: { click: fn } }, [children])
   */
  function el(tag, props, children) {
    var node = document.createElement(tag);
    props = props || {};
    if (props.class) node.className = props.class;
    if (props.text !== undefined && props.text !== null) node.textContent = String(props.text);
    if (props.attrs) {
      Object.keys(props.attrs).forEach(function (name) {
        var value = props.attrs[name];
        if (value !== undefined && value !== null && value !== false) node.setAttribute(name, value === true ? '' : String(value));
      });
    }
    if (props.on) {
      Object.keys(props.on).forEach(function (type) {
        node.addEventListener(type, props.on[type]);
      });
    }
    appendAll(node, children);
    return node;
  }

  function appendAll(node, children) {
    (children || []).forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
  }

  /** Build an <svg> from trusted, hard-coded markup written in our own source files. */
  function svg(markup, attrs) {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = markup; // markup comes from our own code, never from visitors
    var node = wrapper.firstElementChild;
    if (node && attrs) {
      Object.keys(attrs).forEach(function (name) {
        node.setAttribute(name, attrs[name]);
      });
    }
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  /**
   * A "stat" is one of the little score boxes above a game (Time, Moves, Best...).
   * Returns { root, set(value) } so a game can update it without rebuilding anything.
   */
  function stat(label, initial) {
    var value = el('span', { class: 'stat-value', text: initial === undefined ? '-' : initial });
    var root = el('li', { class: 'stat' }, [el('span', { class: 'stat-label', text: label }), value]);
    return {
      root: root,
      set: function (next) {
        var text = String(next);
        if (value.textContent !== text) value.textContent = text;
      }
    };
  }

  function statsBar(stats) {
    return el('ul', { class: 'stats' }, stats.map(function (s) { return s.root; }));
  }

  /**
   * A row of toggle buttons where exactly one is selected (used for difficulty and mode).
   *   segmented('Difficulty', [{value:'easy', label:'Easy'}, ...], 'easy', function (value) { ... })
   * Returns { root, set(value) }.
   */
  function segmented(label, options, current, onChange) {
    var buttons = {};
    var group = el('div', { class: 'segmented', attrs: { role: 'group', 'aria-label': label } });

    function set(value) {
      Object.keys(buttons).forEach(function (key) {
        buttons[key].setAttribute('aria-pressed', key === value ? 'true' : 'false');
      });
    }

    options.forEach(function (option) {
      var button = el('button', {
        class: 'filter-chip',
        text: option.label,
        attrs: { type: 'button', 'aria-pressed': option.value === current ? 'true' : 'false' },
        on: {
          click: function () {
            set(option.value);
            onChange(option.value);
          }
        }
      });
      buttons[option.value] = button;
      group.appendChild(button);
    });

    return { root: group, set: set };
  }

  window.PlayNovaDom = { el: el, svg: svg, clear: clear, stat: stat, statsBar: statsBar, segmented: segmented, SVG_NS: SVG_NS };
})();
