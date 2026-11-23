import { categoryIconSvg } from '../data/categoryIcons.ts';
import { directoryGridGroups, directoryGroupById, directoryGroupList, directoryMoreGroups, subgroupsForGroup } from '../lib/directoryGroups.ts';
import { directoryMatcher } from '../lib/directoryMatch.ts';
import {
  buildDirectoryView,
  directoryPageSize,
  filterDirectoryRows,
  type DirectoryCard,
  type DirectoryIndexRow,
  type DirectoryQueryState,
} from '../lib/directoryView.ts';

const RECENT_KEY = 'bastropia-directory-recent';
const TOWNS = ['Bastrop', 'Elgin', 'Smithville', 'Cedar Creek', 'Paige', 'McDade', 'Red Rock', 'Rosanky', 'Dale', 'Wyldwood', 'Camp Swift'];

type Origin = { lat: number; lng: number } | null;

function readRecent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string').slice(0, 5) : [];
  } catch {
    return [];
  }
}

function remember(query: string) {
  const value = query.trim();
  if (value.length < 2) return;
  const next = [value, ...readRecent().filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 5);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* private browsing */
  }
}

function hydrate(raw: Partial<DirectoryIndexRow>): DirectoryIndexRow {
  return {
    id: String(raw.id || raw.n || ''),
    n: raw.n || '',
    c: raw.c || '',
    t: raw.t || '',
    p: raw.p || '',
    h: raw.h || '/directory',
    ph: raw.ph || '',
    pt: raw.pt || '',
    w: raw.w || '',
    fb: raw.fb || '',
    maps: raw.maps || '',
    hr: raw.hr || '',
    r: raw.r ?? 3,
    b: raw.b || '',
    lg: raw.lg || '',
    lat: raw.lat,
    lng: raw.lng,
  };
}

function icon(key: string) {
  const span = document.createElement('span');
  span.className = 'biz-mark';
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = categoryIconSvg[key] || categoryIconSvg.store;
  return span;
}

function linkAction(card: DirectoryCard, kind: string) {
  const item = [...card.actions, ...card.menu].find((action) => action.kind === kind);
  return item;
}

function renderCard(card: DirectoryCard) {
  const item = document.createElement('li');
  item.className = 'biz-row';
  const hit = document.createElement('a');
  hit.className = 'biz-hit';
  hit.href = card.href;
  hit.setAttribute('aria-label', card.name);
  if (card.external) {
    hit.target = '_blank';
    hit.rel = 'noopener noreferrer';
  }
  if (card.logo) {
    const mark = document.createElement('span');
    mark.className = 'biz-mark has-logo';
    const image = document.createElement('img');
    image.className = 'biz-logo';
    image.alt = '';
    image.src = card.logo;
    image.decoding = 'async';
    mark.append(image);
    hit.append(mark);
  } else {
    hit.append(icon(card.icon));
  }
  const copy = document.createElement('span');
  copy.className = 'biz-copy';
  const name = document.createElement('span');
  name.className = 'biz-name';
  name.textContent = card.name;
  if (card.badge) {
    const badge = document.createElement('span');
    badge.className = card.badge === 'Featured' ? 'badge badge-featured' : card.badge === 'Spotlight' ? 'badge badge-spotlight' : 'badge';
    badge.textContent = card.badge === 'Partner page' ? 'Partner' : card.badge;
    name.append(badge);
  }
  const meta = document.createElement('span');
  meta.className = 'biz-line';
  meta.textContent = `${card.trade} · ${card.placeLabel}`;
  if (card.noAddress) {
    const soft = document.createElement('span');
    soft.className = 'biz-soft';
    soft.textContent = ' · no address listed';
    meta.append(soft);
  }
  if (card.open) {
    const pill = document.createElement('span');
    pill.className = card.open === 'Closed' ? 'biz-open is-closed' : 'biz-open';
    pill.textContent = card.open;
    meta.append(pill);
  }
  copy.append(name, meta);
  if (card.address) {
    const address = document.createElement('span');
    address.className = 'biz-addr';
    address.textContent = card.address;
    copy.append(address);
  }
  hit.append(copy);
  const actions = document.createElement('div');
  actions.className = 'biz-actions';
  const visible = card.actions.filter((action) => action.kind !== 'share' || action.label !== 'More');
  const more = card.actions.find((action) => action.label === 'More');
  for (const action of visible) {
    if (action.kind === 'share') continue;
    const anchor = document.createElement('a');
    anchor.className = action.variant === 'call' ? 'dir-btn is-call' : 'dir-btn';
    anchor.href = action.href;
    anchor.textContent = action.label;
    anchor.setAttribute('aria-label', action.aria);
    if (action.external) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
    actions.append(anchor);
  }
  if (more && card.menu.length) {
    const details = document.createElement('details');
    details.className = 'biz-more';
    const summary = document.createElement('summary');
    summary.setAttribute('aria-label', more.aria);
    summary.textContent = '···';
    const menu = document.createElement('div');
    menu.className = 'biz-menu';
    for (const action of card.menu) {
      if (action.kind === 'share') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'dir-btn';
        button.textContent = 'Share';
        button.setAttribute('aria-label', action.aria);
        button.dataset.share = card.href;
        button.dataset.shareName = card.name;
        menu.append(button);
      } else {
        const anchor = document.createElement('a');
        anchor.className = 'dir-btn';
        anchor.href = action.href;
        anchor.textContent = action.label;
        anchor.setAttribute('aria-label', action.aria);
        if (action.external) {
          anchor.target = '_blank';
          anchor.rel = 'noopener noreferrer';
        }
        menu.append(anchor);
      }
    }
    details.append(summary, menu);
    actions.append(details);
  } else if (visible.length < 3) {
    const detailsLink = linkAction(card, 'details');
    if (detailsLink && !visible.some((action) => action.kind === 'details')) {
      const anchor = document.createElement('a');
      anchor.className = 'dir-btn';
      anchor.href = detailsLink.href;
      anchor.textContent = 'Details';
      anchor.setAttribute('aria-label', detailsLink.aria);
      actions.append(anchor);
    }
  }
  item.append(hit, actions);
  return item;
}

export function bootDirectory() {
  const root = document.getElementById('directory-app');
  const input = document.getElementById('q') as HTMLInputElement | null;
  const listHost = document.getElementById('directory-list');
  const heading = document.getElementById('directory-heading');
  const count = document.getElementById('directory-count');
  const range = document.getElementById('directory-range');
  const more = document.getElementById('directory-more') as HTMLAnchorElement | null;
  const emptyHost = document.getElementById('directory-empty');
  const countyHost = document.getElementById('directory-county');
  const recentHost = document.getElementById('directory-recent');
  const sheet = document.getElementById('directory-sheet') as HTMLDialogElement | null;
  const dock = document.getElementById('directory-dock');
  if (!root || !input || !listHost || !heading || !count) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let rows: DirectoryIndexRow[] = [];
  let ready = false;
  let loading: Promise<void> | null = null;
  let origin: Origin = null;
  let limit = directoryPageSize();
  let timer = 0;
  let sheetOpener: HTMLElement | null = null;
  let sheetDraft: DirectoryQueryState = blankState();

  function blankState(): DirectoryQueryState {
    return { q: '', town: '', category: '', sub: '', sort: '', wide: false };
  }

  function stateFromDom(): DirectoryQueryState {
    return {
      q: root!.dataset.q || '',
      town: root!.dataset.town || '',
      category: root!.dataset.category || '',
      sub: root!.dataset.sub || '',
      sort: (root!.dataset.sort as DirectoryQueryState['sort']) || '',
      wide: root!.dataset.wide === '1',
    };
  }

  let state = stateFromDom();
  const page = Math.max(1, Number(root.dataset.page || '1') || 1);
  limit = page * directoryPageSize();
  let pinnedTown = root.dataset.townSource === 'chip' ? state.town : '';
  let drafting = false;

  function writeUrl(kind: 'type' | 'commit' = 'type') {
    const url = new URL(location.href);
    const set = (key: string, value: string) => {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    };
    set('q', state.q);
    set('town', state.town);
    set('category', state.category);
    set('sub', state.sub);
    set('sort', state.sort);
    set('wide', state.wide ? '1' : '');
    url.searchParams.delete('page');
    const next = `${url.pathname}${url.search}`;
    const current = `${location.pathname}${location.search}`;
    if (kind === 'commit') {
      if (next !== current) history.pushState({ dir: true }, '', next);
      drafting = false;
    } else if (next !== current && !drafting) {
      history.pushState({ dir: true }, '', next);
      drafting = true;
    } else if (next !== current) {
      history.replaceState({ dir: true }, '', next);
    }
    root!.dataset.q = state.q;
    root!.dataset.town = state.town;
    root!.dataset.category = state.category;
    root!.dataset.sub = state.sub;
    root!.dataset.sort = state.sort;
    root!.dataset.wide = state.wide ? '1' : '0';
  }

  function syncInputFromQuery(query: string) {
    const parsed = directoryMatcher().parse(query);
    state.q = parsed.text || '';
    state.town = pinnedTown || parsed.town || '';
  }

  function paint(focusNew = false) {
    const previous = listHost!.querySelectorAll('.biz-row').length;
    const view = buildDirectoryView(rows, state, { limit, origin });
    root!.dataset.mode = view.mode;
    heading!.textContent = view.mode === 'results' ? view.heading : 'All businesses';
    count!.textContent = view.live;
    if (range) {
      range.textContent = view.range;
      range.hidden = !view.range;
    }
    listHost!.replaceChildren();
    if (view.empty && emptyHost) {
      emptyHost.hidden = false;
      emptyHost.replaceChildren();
      const title = document.createElement('p');
      title.className = 'dir-empty-title';
      const query = view.empty.query ? `“${view.empty.query}”` : 'that filter';
      title.append('No matches for ');
      const strong = document.createElement('strong');
      strong.textContent = query;
      title.append(strong);
      if (view.empty.town && view.empty.town !== 'Countywide') {
        title.append(' in ');
        const town = document.createElement('strong');
        town.textContent = view.empty.town;
        title.append(town);
      }
      title.append('.');
      emptyHost.append(title);
      if (view.empty.countyCount) {
        const retry = document.createElement('a');
        retry.href = hrefOf({ ...state, town: '' });
        retry.textContent = `${view.empty.countyCount} ${view.empty.countyCount === 1 ? 'match' : 'matches'} in all of Bastrop County`;
        emptyHost.append(retry);
      }
      if (view.empty.suggestion) {
        const suggest = document.createElement('button');
        suggest.type = 'button';
        suggest.className = 'dir-suggest';
        suggest.textContent = `Try ${view.empty.suggestion.term} (${view.empty.suggestion.count})`;
        suggest.addEventListener('click', () => {
          input!.value = view.empty!.suggestion!.term;
          applyNow();
        });
        emptyHost.append(suggest);
      }
      const tiles = document.createElement('div');
      tiles.className = 'dir-empty-grid';
      for (const group of view.empty.groups) {
        const tile = document.createElement('a');
        tile.href = hrefOf({ ...blankState(), category: group.id });
        tile.append(icon(group.icon), document.createTextNode(group.label));
        tiles.append(tile);
      }
      emptyHost.append(tiles);
      const tell = document.createElement('p');
      tell.append('Know a business we’re missing? ');
      const submit = document.createElement('a');
      submit.href = '/directory/submit';
      submit.textContent = 'Tell us';
      tell.append(submit);
      emptyHost.append(tell);
    } else if (emptyHost) {
      emptyHost.hidden = true;
      emptyHost.replaceChildren();
    }
    if (view.matches.length) {
      const list = document.createElement('ul');
      list.className = 'biz-list';
      for (const card of view.matches) list.append(renderCard(card));
      listHost!.append(list);
    }
    if (countyHost) {
      countyHost.replaceChildren();
      countyHost.hidden = view.countywideTotal === 0;
      if (view.countywideTotal) {
        const line = document.createElement('p');
        line.className = 'dir-county-line';
        if (view.fallback) {
          line.append(view.fallback.detail + ' · ');
          const see = document.createElement('a');
          see.className = 'dir-see';
          see.href = hrefOf({ ...state, town: '' });
          see.textContent = `${view.fallback.seeAll} →`;
          see.addEventListener('click', (event) => {
            event.preventDefault();
            pinnedTown = '';
            const parsed = directoryMatcher().parse(input!.value);
            input!.value = parsed.text;
            state.town = '';
            state.q = parsed.text;
            state.wide = false;
            writeUrl('commit');
            paint();
          });
          line.append(see);
        } else {
          line.textContent = `${view.countywideTotal} more have no street address on file`;
        }
        countyHost.append(line);
        if (!view.fallback && !state.wide && view.matches.length) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'dir-more';
          button.textContent = 'Show listings with no street address';
          button.addEventListener('click', () => {
            state.wide = true;
            writeUrl('commit');
            paint();
          });
          countyHost.append(button);
        } else {
          const list = document.createElement('ul');
          list.className = 'biz-list';
          for (const card of view.countywide) list.append(renderCard(card));
          countyHost.append(list);
        }
      }
    }
    if (more) {
      const hidden = view.matches.length >= view.total;
      more.hidden = hidden;
      more.href = hrefOf(state, Math.floor(view.matches.length / directoryPageSize()) + 2);
    }
    const clear = document.querySelector<HTMLButtonElement>('.looking-clear');
    if (clear) clear.hidden = !input!.value;
    updateChips();
    if (focusNew) {
      const cards = listHost!.querySelectorAll('.biz-row');
      const next = cards[previous] as HTMLElement | undefined;
      const target = next?.querySelector<HTMLElement>('.biz-hit');
      target?.setAttribute('tabindex', '-1');
      target?.focus();
    }
  }

  function hrefOf(next: DirectoryQueryState, pageNumber = 1) {
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.town) params.set('town', next.town);
    if (next.category) params.set('category', next.category);
    if (next.sub) params.set('sub', next.sub);
    if (next.sort) params.set('sort', next.sort);
    if (next.wide) params.set('wide', '1');
    if (pageNumber > 1) params.set('page', String(pageNumber));
    const search = params.toString();
    return search ? `/directory?${search}` : '/directory';
  }

  function updateChips() {
    const categoryName = state.category ? directoryGroupById(state.category)?.short || directoryGroupById(state.category)?.label || state.category : 'Category';
    document.querySelectorAll<HTMLElement>('[data-chip]').forEach((chip) => {
      const key = chip.dataset.chip;
      const on = key === 'town' ? Boolean(state.town) : key === 'category' ? Boolean(state.category) : key === 'sort' ? Boolean(state.sort) : false;
      (chip.closest('[data-chip-wrap]') || chip).classList.toggle('is-on', on);
      const label = chip.querySelector('[data-chip-label]');
      if (!label) return;
      if (key === 'town') label.textContent = state.town ? `📍 ${state.town}` : 'Town';
      if (key === 'category') label.textContent = categoryName;
      if (key === 'sort') label.textContent = state.sort === 'near' ? 'Nearest' : state.sort === 'az' ? 'A–Z' : 'Sort';
    });
    document.querySelectorAll<HTMLAnchorElement>('[data-clear]').forEach((link) => {
      const key = link.dataset.clear;
      const on = key === 'town' ? Boolean(state.town) : key === 'category' ? Boolean(state.category) : false;
      link.hidden = !on;
      if (key === 'town') {
        link.href = hrefOf({ ...state, town: '' });
        link.setAttribute('aria-label', `Remove ${state.town} filter`);
      }
      if (key === 'category') {
        link.href = hrefOf({ ...state, category: '', sub: '' });
        link.setAttribute('aria-label', `Remove ${categoryName} filter`);
      }
    });
  }

  function applyNow(kind: 'type' | 'commit' = 'type') {
    syncInputFromQuery(input!.value);
    if (state.q) remember(state.q);
    limit = directoryPageSize();
    state.wide = false;
    writeUrl(kind);
    root!.dataset.mode = state.q || state.town || state.category ? 'results' : 'browse';
    if (ready) paint();
  }

  function schedule() {
    window.clearTimeout(timer);
    timer = window.setTimeout(applyNow, 120);
  }

  async function loadIndex() {
    if (ready) return;
    if (loading) return loading;
    loading = fetch('/directory/index.json', { headers: { accept: 'application/json' } })
      .then((response) => response.json())
      .then((payload) => {
        rows = (payload.rows || []).map(hydrate);
        ready = true;
        paint();
      })
      .catch(() => undefined);
    return loading;
  }

  function showRecent() {
    if (!recentHost) return;
    const items = readRecent();
    recentHost.replaceChildren();
    if (!items.length || input!.value.trim()) {
      recentHost.hidden = true;
      return;
    }
    recentHost.hidden = false;
    const label = document.createElement('p');
    label.className = 'dir-kicker';
    label.textContent = 'Recent';
    recentHost.append(label);
    for (const item of items) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = item;
      button.addEventListener('click', () => {
        input!.value = item;
        applyNow();
        input!.blur();
      });
      recentHost.append(button);
    }
  }

  function setSearching(on: boolean) {
    document.body.classList.toggle('dir-searching', on);
    dock?.classList.toggle('is-stuck', on);
    if (on && !reduce) dock?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    else if (on) dock?.scrollIntoView({ block: 'start' });
  }

  input.addEventListener('focus', () => {
    setSearching(true);
    if (state.q || state.town || state.category) root!.dataset.mode = 'results';
    showRecent();
    void loadIndex();
  });
  input.addEventListener('input', () => {
    root!.dataset.mode = 'results';
    setSearching(true);
    if (recentHost) recentHost.hidden = true;
    schedule();
  });
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    window.clearTimeout(timer);
    applyNow('commit');
    input!.blur();
  });
  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      if (document.activeElement === input) return;
      setSearching(false);
      if (recentHost) recentHost.hidden = true;
      if (!state.q && !state.town && !state.category && !state.sub) root!.dataset.mode = 'browse';
    }, 150);
  });
  document.querySelector<HTMLButtonElement>('.looking-clear')?.addEventListener('click', () => {
    input!.value = '';
    state.q = '';
    applyNow();
    input!.focus();
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-fill]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      input!.value = link.dataset.fill || link.textContent || '';
      setSearching(true);
      root!.dataset.mode = 'results';
      applyNow();
    });
  });
  more?.addEventListener('click', (event) => {
    if (!ready) return;
    event.preventDefault();
    limit += directoryPageSize();
    paint(true);
  });

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const share = target?.closest<HTMLElement>('[data-share]');
    if (!share) return;
    event.preventDefault();
    const url = new URL(share.dataset.share || '/directory', location.origin).toString();
    const payload = { title: share.dataset.shareName || 'Bastropia', url };
    if (navigator.share) navigator.share(payload).catch(() => undefined);
    else navigator.clipboard?.writeText(url).catch(() => undefined);
  });

  function fillSheet() {
    if (!sheet) return;
    const townHost = sheet.querySelector('[data-sheet-towns]');
    const catHost = sheet.querySelector('[data-sheet-cats]');
    const moreHost = sheet.querySelector('[data-sheet-more]');
    const subHost = sheet.querySelector('[data-sheet-subs]');
    const apply = sheet.querySelector<HTMLButtonElement>('[data-sheet-apply]');
    if (!townHost || !catHost || !apply) return;
    const draftRows = () => filterDirectoryRows(rows, { ...sheetDraft, wide: false }, origin);
    const render = () => {
      townHost.replaceChildren();
      const all = document.createElement('button');
      all.type = 'button';
      all.className = sheetDraft.town ? 'dir-chip' : 'dir-chip is-on';
      all.textContent = 'All towns';
      all.setAttribute('aria-pressed', String(!sheetDraft.town));
      all.addEventListener('click', () => {
        sheetDraft.town = '';
        render();
      });
      townHost.append(all);
      for (const town of TOWNS) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = sheetDraft.town === town ? 'dir-chip is-on' : 'dir-chip';
        const townCount = filterDirectoryRows(rows, { ...sheetDraft, town, wide: false }, origin);
        const extra = townCount.matches.length === 0 ? townCount.countywide.length : 0;
        button.textContent = extra ? `${town} ${townCount.matches.length} (+${extra} countywide)` : `${town} ${townCount.matches.length}`;
        button.setAttribute('aria-pressed', String(sheetDraft.town === town));
        button.addEventListener('click', () => {
          sheetDraft.town = town;
          render();
        });
        townHost.append(button);
      }
      const catCounts = new Map<string, number>();
      for (const group of directoryGroupList()) {
        const found = filterDirectoryRows(rows, { ...sheetDraft, category: group.id, sub: '', wide: false }, origin);
        catCounts.set(group.id, found.matches.length || found.countywide.length);
      }
      const addGroup = (host: Element, group: { id: string; label: string; short?: string; emoji?: string; icon: string }) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = sheetDraft.category === group.id ? 'dir-cat is-on' : 'dir-cat';
        button.setAttribute('aria-pressed', String(sheetDraft.category === group.id));
        const mark = icon(group.icon);
        const name = document.createElement('span');
        name.textContent = group.short || group.label;
        const count = document.createElement('span');
        count.textContent = String(catCounts.get(group.id) || 0);
        button.append(mark, name, count);
        button.addEventListener('click', () => {
          sheetDraft.category = sheetDraft.category === group.id ? '' : group.id;
          sheetDraft.sub = '';
          render();
        });
        host.append(button);
      };
      catHost.replaceChildren();
      for (const group of directoryGridGroups()) addGroup(catHost, group);
      if (moreHost) {
        moreHost.replaceChildren();
        for (const group of directoryMoreGroups()) addGroup(moreHost, group);
      }
      if (subHost) {
        subHost.replaceChildren();
        const subs = sheetDraft.category ? subgroupsForGroup(sheetDraft.category) : [];
        subHost.parentElement?.toggleAttribute('hidden', subs.length === 0);
        for (const sub of subs) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = sheetDraft.sub === sub ? 'dir-chip is-on' : 'dir-chip';
          button.textContent = sub;
          button.setAttribute('aria-pressed', String(sheetDraft.sub === sub));
          button.addEventListener('click', () => {
            sheetDraft.sub = sheetDraft.sub === sub ? '' : sub;
            render();
          });
          subHost.append(button);
        }
      }
      sheet.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((button) => {
        const value = button.dataset.sort || '';
        const on = (sheetDraft.sort || '') === value;
        button.classList.toggle('is-on', on);
        button.setAttribute('aria-pressed', String(on));
      });
      const draft = draftRows();
      const total = draft.matches.length || draft.countywide.length;
      apply.textContent = `Show ${total} ${total === 1 ? 'place' : 'places'}`;
    };
    render();
  }

  async function openSheet(opener: HTMLElement) {
    if (!sheet) return;
    await loadIndex();
    sheetOpener = opener;
    sheetDraft = { ...state };
    fillSheet();
    if (typeof sheet.showModal === 'function' && !sheet.open) sheet.showModal();
    sheet.querySelector<HTMLElement>('[data-sheet-apply]')?.focus();
  }

  document.querySelectorAll<HTMLButtonElement>('[data-sheet-open]').forEach((button) => {
    button.addEventListener('click', () => openSheet(button));
  });
  document.querySelectorAll<HTMLAnchorElement>('[data-clear]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      if (link.dataset.clear === 'town') {
        pinnedTown = '';
        const parsed = directoryMatcher().parse(input!.value);
        input!.value = parsed.text;
        state.town = '';
        state.q = parsed.text;
      } else {
        state.category = '';
        state.sub = '';
      }
      state.wide = false;
      writeUrl('commit');
      root!.dataset.mode = state.q || state.town || state.category ? 'results' : 'browse';
      if (ready) paint();
    });
  });
  window.addEventListener('popstate', () => {
    const params = new URLSearchParams(location.search);
    pinnedTown = params.get('town') || '';
    state = {
      q: params.get('q') || '',
      town: pinnedTown,
      category: params.get('category') || '',
      sub: params.get('sub') || '',
      sort: (params.get('sort') as DirectoryQueryState['sort']) || '',
      wide: params.get('wide') === '1',
    };
    input!.value = state.q;
    drafting = false;
    limit = directoryPageSize();
    root!.dataset.mode = state.q || state.town || state.category ? 'results' : 'browse';
    if (ready) paint();
    else void loadIndex();
  });
  sheet?.querySelector('[data-sheet-apply]')?.addEventListener('click', async () => {
    pinnedTown = sheetDraft.town;
    if (!sheetDraft.town) {
      const parsed = directoryMatcher().parse(input!.value);
      input!.value = parsed.text;
    }
    syncInputFromQuery(input!.value);
    state = { ...state, ...sheetDraft, q: state.q, town: pinnedTown || state.town, wide: false };
    if (state.sort === 'near' && !origin) {
      origin = await new Promise<Origin>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
        );
      });
    }
    limit = directoryPageSize();
    writeUrl('commit');
    root!.dataset.mode = state.q || state.town || state.category ? 'results' : 'browse';
    paint();
    sheet?.close();
    sheetOpener?.focus();
  });
  sheet?.querySelector('[data-sheet-reset]')?.addEventListener('click', () => {
    sheetDraft = { ...sheetDraft, town: '', category: '', sub: '', sort: '' };
    fillSheet();
  });
  sheet?.querySelectorAll<HTMLButtonElement>('[data-sort]').forEach((button) => {
    button.addEventListener('click', () => {
      sheetDraft.sort = (button.dataset.sort as DirectoryQueryState['sort']) || '';
      fillSheet();
    });
  });
  sheet?.addEventListener('close', () => {
    sheetOpener?.focus();
  });
  let touchY = 0;
  sheet?.addEventListener('touchstart', (event) => {
    touchY = event.touches[0]?.clientY || 0;
  });
  sheet?.addEventListener('touchend', (event) => {
    const end = event.changedTouches[0]?.clientY || 0;
    if (end - touchY > 70) sheet.close();
  });

  const top = document.getElementById('directory-top');
  const onScroll = () => {
    if (!top) return;
    const keyboard = document.activeElement === input;
    top.hidden = keyboard || window.scrollY < window.innerHeight * 2;
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  top?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    input?.focus();
  });

  if (state.q || state.town || state.category) void loadIndex();
  else {
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback;
    if (idle) idle(() => void loadIndex());
  }
}
