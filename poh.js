// Shared UI logic for PathOfHideout essence and fossil pages.
(function(){
  // Defaults
  const defaultPrices = {
    'Scorn': 56,'Rage': 42,'Spite': 42,'Woe': 37,'Zeal': 30,'Envy': 24,'Sorrow': 23,'Loathing': 21,'Wrath': 21,'Contempt': 20,'Misery': 17,'Torment': 17,'Greed': 15,'Anger': 14,'Hatred': 14,'Suffering': 5.0,'Doubt': 4.0,'Dread': 3.0,'Fear': 1.0
  };

  const defaultFossilPrices = {
    'Metallic Fossil': 12,'Frigid Fossil': 10,'Serrated Fossil': 8,'Fundamental Fossil': 2,'Prismatic Fossil': 6,'Pristine Fossil': 5,'Dense Fossil': 7,'Aberrant Fossil': 4,'Aetheric Fossil': 4,'Bound Fossil': 3,'Corroded Fossil': 6,'Bloodstained Fossil': 3,'Hollow Fossil': 2,'Faceted Fossil': 2,'Jagged Fossil': 3,'Gilded Fossil': 1,'Opulent Fossil': 2,'Lucent Fossil': 1,'Fractured Fossil': 2,'Tangled Fossil': 2, 'Deft Fossil': 18, 'Scorched Fossil': 1
  };

  const defaultFossilWeights = Object.assign({}, defaultFossilPrices);

  // Shared storage helpers
  function saveJSON(key, obj){ try{ localStorage.setItem(key, JSON.stringify(obj)); }catch(e){} }
  function loadJSON(key){ try{ const s = localStorage.getItem(key); return s? JSON.parse(s): null }catch(e){return null} }

  // ---------- Essence UI ----------
  function initPrices(){
    const pricesTable = document.getElementById('pricesTable');
    const startType = document.getElementById('startType');
    if(!pricesTable || !startType) return;
    pricesTable.innerHTML = '';
    startType.innerHTML = '';
    const keys = Object.keys(defaultPrices);
    for(const k of keys){
      const row = document.createElement('div'); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px';
      const label = document.createElement('label'); label.textContent = k; label.style.flex='0 0 220px'; label.style.margin='0'; label.style.overflow='hidden'; label.style.textOverflow='ellipsis'; label.style.whiteSpace='nowrap';
      const input = document.createElement('input'); input.type='number'; input.step='0.1'; input.value = defaultPrices[k]; input.style.width='84px'; input.dataset.key = k;
      row.appendChild(label); row.appendChild(input); pricesTable.appendChild(row);
      const opt = document.createElement('option'); opt.value = k; opt.textContent = k; startType.appendChild(opt);
    }
    if(keys.length>0) startType.value = keys[keys.length-1];
  }

  function getPriceUnit(){ try{ const sel = document.querySelector('input[name="priceUnit"]:checked'); return sel? sel.value: 'chaos'; }catch(e){return 'chaos'} }

  function readPrices(){
    const inputs = Array.from(document.querySelectorAll('#pricesTable input'));
    const prices = {};
    const unit = getPriceUnit();
    const chaosPerDivLocal = Number(document.getElementById('chaosPerDiv')?.value) || fetchedChaosPerDiv || 0;
    inputs.forEach(i=>{
      const raw = Number(i.value) || 0;
      if(unit === 'chaos') prices[i.dataset.key] = raw; else prices[i.dataset.key] = (raw>0 && chaosPerDivLocal>0)? (chaosPerDivLocal/raw):0;
    });
    return prices;
  }

  function saveUserValues(){ try{
    const inputs = Array.from(document.querySelectorAll('#pricesTable input'));
    const displayed = {}; inputs.forEach(i=> displayed[i.dataset.key] = i.value);
    const obj = { prices: displayed, startCount: Number(document.getElementById('startCount')?.value)||0, startType: document.getElementById('startType')?.value||null, bluePerDiv: document.getElementById('bluePerDiv')?.value||null, chaosPerDiv: document.getElementById('chaosPerDiv')?.value||null, league: document.getElementById('leagueSelect')?.value||null, priceUnit: getPriceUnit() };
    saveJSON('poh_user_values', obj);
  }catch(e){} }

  function loadUserValues(){ return loadJSON('poh_user_values'); }
  function applyUserValues(obj){ try{ if(!obj) return; if(obj.startCount!=null) document.getElementById('startCount').value = obj.startCount; if(obj.startType) document.getElementById('startType').value = obj.startType; if(obj.bluePerDiv!=null) document.getElementById('bluePerDiv').value = obj.bluePerDiv; if(obj.chaosPerDiv!=null) document.getElementById('chaosPerDiv').value = obj.chaosPerDiv; if(obj.league && document.getElementById('leagueSelect')) document.getElementById('leagueSelect').value = obj.league; if(obj.priceUnit){ const sel = document.querySelectorAll('input[name="priceUnit"]'); sel.forEach(r=> r.checked = (r.value === obj.priceUnit)); } if(obj.prices){ const inputs = Array.from(document.querySelectorAll('#pricesTable input')); inputs.forEach(i=>{ const k=i.dataset.key; if(k && obj.prices[k]!=null) i.value = obj.prices[k]; }); } }catch(e){} }

  function attachInputSaveHandlers(){
    try{
      const priceInputs = Array.from(document.querySelectorAll('#pricesTable input'));
      priceInputs.forEach(inp => inp.addEventListener('change', saveUserValues));
      const unitRadios = Array.from(document.querySelectorAll('input[name="priceUnit"]'));
      unitRadios.forEach(r => r.addEventListener('change', (e)=>{ try{ const newUnit = e.target.value; const prevUnit = (newUnit==='chaos')? 'essPerDiv' : 'chaos'; convertDisplayedPrices(prevUnit, newUnit);}catch(err){} saveUserValues(); }));
      ['startCount','startType','bluePerDiv','chaosPerDiv','leagueSelect'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change', saveUserValues); });
    }catch(e){}
  }

  function convertDisplayedPrices(fromUnit, targetUnit){
    const inputs = Array.from(document.querySelectorAll('#pricesTable input'));
    const chaosPerDivLocal = Number(document.getElementById('chaosPerDiv')?.value) || fetchedChaosPerDiv || 0;
    if(fromUnit === targetUnit) return;
    inputs.forEach(i=>{ const v = Number(i.value) || 0; let out = v; if(fromUnit==='chaos' && targetUnit==='essPerDiv'){ if(v>0 && chaosPerDivLocal>0) out = chaosPerDivLocal / v; else out = 0; } else if(fromUnit==='essPerDiv' && targetUnit==='chaos'){ if(v>0 && chaosPerDivLocal>0) out = chaosPerDivLocal / v; else out = 0; } i.value = (Math.round(out*100)/100).toString(); });
  }

  function computeThreshold(pricesArr, cost){
    const minP = Math.min(...pricesArr); const maxP = Math.max(...pricesArr); let low = minP - cost - 10; let high = maxP + 10;
    for(let iter=0; iter<80; iter++){ const mid=(low+high)/2; const f = pricesArr.reduce((s,p)=> s + Math.max(p, mid), 0) / pricesArr.length; const lhs = f - cost; if(lhs > mid) low = mid; else high = mid; }
    return (low+high)/2;
  }

  // compute and render essence strategy
  function computeStrategy(){
    const pricesObj = readPrices(); const types = Object.keys(pricesObj); const pricesArr = types.map(t=> pricesObj[t]);
    const bluePerDiv = Number(document.getElementById('bluePerDiv')?.value) || 0; const chaosPerDiv = Number(document.getElementById('chaosPerDiv')?.value) || 0; let cost = 0;
    if(chaosPerDiv>0 && bluePerDiv>0){ cost = 30*(chaosPerDiv/bluePerDiv); } else if(fetchedChaosPerLifeforce!=null) cost = 30 * fetchedChaosPerLifeforce; else cost = 0;
    const C = computeThreshold(pricesArr, cost); const V = {}; types.forEach((t,i)=> V[t] = Math.max(pricesArr[i], C));
    const start = document.getElementById('startType')?.value; const count = Math.max(1, Math.floor(Number(document.getElementById('startCount')?.value)||1)); const expectedPer = V[start]; const totalExpected = expectedPer * count; const immediate = pricesObj[start]*count; const profit = totalExpected - immediate;
    const stopTypes = types.filter(t=> pricesObj[t] >= C);
    const q = stopTypes.length / types.length; let expectedFlipsPerEssence = 0; if(pricesObj[start] >= C) expectedFlipsPerEssence = 0; else expectedFlipsPerEssence = q>0? (1/q):0; const totalExpectedCraftCost = count * expectedFlipsPerEssence * cost;
    const res = document.getElementById('results'); if(!res) return; res.innerHTML = '';
    function fmtChaosDiv(v){ if(chaosPerDiv>0) return `${v.toFixed(3)} chaos / ${(v/chaosPerDiv).toFixed(3)} div`; return `${v.toFixed(3)} chaos / — div` }
    const summary = document.createElement('div'); summary.innerHTML = `<strong>Threshold (C):</strong> ${fmtChaosDiv(C)} — <strong>Stop types:</strong> ${stopTypes.join(', ')}`; res.appendChild(summary);
    const table = document.createElement('table'); table.className='results-table'; table.style.marginTop='10px'; const cg=document.createElement('colgroup'); for(let i=0;i<4;i++) cg.appendChild(document.createElement('col')); table.appendChild(cg); const hdr=document.createElement('tr'); hdr.innerHTML = '<th style="text-align:left">Type</th><th style="text-align:left">Price (c)</th><th style="text-align:left">Optimal Value (c)</th><th style="text-align:left">Optimal Action</th>'; table.appendChild(hdr);
    const sorted = types.slice().sort((a,b)=> (pricesObj[b]||0) - (pricesObj[a]||0)); sorted.forEach(t=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td style="padding-right:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t}</td><td style="text-align:left;overflow:hidden">${pricesObj[t].toFixed(2)}</td><td style="text-align:left;overflow:hidden">${V[t].toFixed(3)}</td><td style="padding-right:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pricesObj[t] >= C ? 'Keep / Stop' : 'Flip'}</td>`; table.appendChild(tr); }); res.appendChild(table);
    const footer = document.createElement('div'); footer.style.marginTop='10px'; footer.innerHTML = `<div><strong>Start:</strong> ${count} × ${start} (price ${fmtChaosDiv(pricesObj[start])})</div><div><strong>Craft per flip (computed):</strong> ${fmtChaosDiv(cost)}</div><div><strong>Expected final per essence:</strong> ${fmtChaosDiv(expectedPer)}</div><div><strong>Expected flips per essence:</strong> ${expectedFlipsPerEssence.toFixed(3)}</div><div><strong>Expected craft cost:</strong> ${fmtChaosDiv(totalExpectedCraftCost)}</div><div><strong>Expected total value:</strong> ${fmtChaosDiv(totalExpected)}</div><div style="color:${profit>=0? 'var(--accent)': '#f87171'}"><strong>Expected profit vs immediate sell:</strong> ${fmtChaosDiv(profit)}</div>`;
    res.appendChild(footer);
  }

  // ---------- Fossil UI ----------
  function initFossilsUI(){ const wrap = document.getElementById('fossilsTable'); const startType = document.getElementById('f_startType'); if(!wrap || !startType) return; wrap.innerHTML=''; startType.innerHTML=''; const keys=Object.keys(defaultFossilPrices); for(const k of keys){ const row=document.createElement('div'); row.style.display='flex'; row.style.justifyContent='flex-start'; row.style.alignItems='center'; row.style.gap='8px'; const label=document.createElement('label'); label.textContent=k; label.style.flex='0 0 180px'; label.style.margin='0'; label.style.overflow='hidden'; label.style.textOverflow='ellipsis'; label.style.whiteSpace='nowrap'; const price=document.createElement('input'); price.type='number'; price.step='0.1'; price.value=defaultFossilPrices[k]; price.style.width='84px'; price.dataset.key=k; price.className='fossil-price'; const weight=document.createElement('input'); weight.type='number'; weight.step='1'; weight.value=defaultFossilWeights[k]; weight.style.width='84px'; weight.dataset.key=k; weight.className='fossil-weight'; const weightLabel=document.createElement('div'); weightLabel.textContent='weight'; weightLabel.style.color='var(--muted)'; weightLabel.style.fontSize='12px'; row.appendChild(label); row.appendChild(price); row.appendChild(weightLabel); row.appendChild(weight); wrap.appendChild(row); const opt=document.createElement('option'); opt.value=k; opt.textContent=k; startType.appendChild(opt); } if(keys.length>0) startType.value = keys[0]; }

  function readFossilData(){ const prices={}; const weights={}; const priceUnit = (()=>{ try{ const s = document.querySelector('input[name="fossilPriceUnit"]:checked'); return s? s.value:'chaos' }catch(e){return 'chaos'} })(); const chaosPerDivLocal = Number(document.getElementById('f_chaosPerDiv')?.value) || fetchedChaosPerDiv || 0; const priceInputs = Array.from(document.querySelectorAll('.fossil-price')); priceInputs.forEach(inp=>{ const k=inp.dataset.key; const raw=Number(inp.value)||0; if(priceUnit==='chaos') prices[k]=raw; else prices[k] = (raw>0 && chaosPerDivLocal>0)? (chaosPerDivLocal/raw):0 }); const weightInputs=Array.from(document.querySelectorAll('.fossil-weight')); weightInputs.forEach(inp=>{ const k=inp.dataset.key; weights[k]=Math.max(0, Number(inp.value)||0) }); const total = Object.values(weights).reduce((s,v)=>s+v,0)||1; Object.keys(weights).forEach(k=> weights[k] = weights[k]/total); return { prices, weights }; }

  function computeFossilThreshold(pricesArr, weightsArr, cost){ const minP=Math.min(...pricesArr); const maxP=Math.max(...pricesArr); let low=minP-cost-10; let high=maxP+10; for(let iter=0; iter<120; iter++){ const mid=(low+high)/2; const f = pricesArr.reduce((s,p,i)=> s + weightsArr[i] * Math.max(p, mid), 0); const lhs = f - cost; if(lhs > mid) low = mid; else high = mid; } return (low+high)/2; }

  function convertDisplayedFossilPrices(fromUnit, targetUnit){ const inputs = Array.from(document.querySelectorAll('.fossil-price')); const chaosPerDivLocal = Number(document.getElementById('f_chaosPerDiv')?.value) || fetchedChaosPerDiv || 0; if(fromUnit===targetUnit) return; inputs.forEach(i=>{ const v=Number(i.value)||0; let out=v; if(fromUnit==='chaos' && targetUnit==='fossPerDiv'){ if(v>0 && chaosPerDivLocal>0) out = chaosPerDivLocal / v; else out = 0; } else if(fromUnit==='fossPerDiv' && targetUnit==='chaos'){ if(v>0 && chaosPerDivLocal>0) out = chaosPerDivLocal / v; else out = 0; } i.value = (Math.round(out*100)/100).toString(); }); }

  function computeFossilStrategy(){ const data = readFossilData(); const types = Object.keys(data.prices); const pricesArr = types.map(t=> data.prices[t]); const weightsArr = types.map(t=> data.weights[t]); const bluePerDiv = Number(document.getElementById('f_bluePerDiv')?.value) || 0; const chaosPerDiv = Number(document.getElementById('f_chaosPerDiv')?.value) || 0; let cost=0; if(chaosPerDiv>0 && bluePerDiv>0){ cost = 30 * (chaosPerDiv/bluePerDiv); } else if(fetchedChaosPerLifeforce!=null){ cost = 30 * fetchedChaosPerLifeforce; } else cost = 0; const C = computeFossilThreshold(pricesArr, weightsArr, cost); const V={}; types.forEach((t,i)=> V[t] = Math.max(data.prices[t], C)); const start=document.getElementById('f_startType')?.value; const count = Math.max(1, Math.floor(Number(document.getElementById('f_startCount')?.value)||1)); const expectedPer = V[start]; const totalExpected = expectedPer * count; const immediate = data.prices[start] * count; const profit = totalExpected - immediate; const stopTypes = types.filter(t=> data.prices[t] >= C); const q = stopTypes.reduce((s,t)=> s + (data.weights[t]||0), 0); let expectedFlipsPerFossil = 0; if(data.prices[start] >= C) expectedFlipsPerFossil = 0; else expectedFlipsPerFossil = q>0? (1/q):0; const totalExpectedCraftCost = count * expectedFlipsPerFossil * cost; const res = document.getElementById('fossilResults'); if(!res) return; res.innerHTML=''; function fmtChaosDiv(v){ if(chaosPerDiv>0) return `${v.toFixed(3)} chaos / ${(v/chaosPerDiv).toFixed(3)} div`; return `${v.toFixed(3)} chaos / — div`; } const summary=document.createElement('div'); summary.innerHTML = `<strong>Threshold (C):</strong> ${fmtChaosDiv(C)} — <strong>Stop types:</strong> ${stopTypes.join(', ')}`; res.appendChild(summary); const table = document.createElement('table'); table.className='results-table'; table.style.marginTop='10px'; const cg=document.createElement('colgroup'); for(let i=0;i<4;i++) cg.appendChild(document.createElement('col')); table.appendChild(cg); const hdr=document.createElement('tr'); hdr.innerHTML = '<th style="text-align:left">Type</th><th style="text-align:left">Price (c)</th><th style="text-align:left">Optimal Value (c)</th><th style="text-align:left">Action</th>'; table.appendChild(hdr); const sorted = types.slice().sort((a,b)=> (data.prices[b]||0) - (data.prices[a]||0)); sorted.forEach(t=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td>${t}</td><td>${data.prices[t].toFixed(2)}</td><td>${V[t].toFixed(3)}</td><td>${data.prices[t]>=C? 'Keep / Stop' : 'Flip'}</td>`; table.appendChild(tr); }); res.appendChild(table); const footer=document.createElement('div'); footer.style.marginTop='10px'; footer.innerHTML = `<div><strong>Start:</strong> ${count} × ${start} (price ${fmtChaosDiv(data.prices[start])})</div><div><strong>Craft per flip (computed):</strong> ${fmtChaosDiv(cost)}</div><div><strong>Expected final per fossil:</strong> ${fmtChaosDiv(expectedPer)}</div><div><strong>Expected flips per fossil:</strong> ${expectedFlipsPerFossil.toFixed(3)}</div><div><strong>Expected craft cost:</strong> ${fmtChaosDiv(totalExpectedCraftCost)}</div><div><strong>Expected total value:</strong> ${fmtChaosDiv(totalExpected)}</div><div style="color:${profit>=0? 'var(--accent)': '#f87171'}"><strong>Expected profit vs immediate sell:</strong> ${fmtChaosDiv(profit)}</div>`; res.appendChild(footer);
  }

  // debug and fetch helpers
  function updateDebug(payload, source='fallback'){ try{ const out = { timestamp: new Date().toISOString(), source, data: payload }; const el=document.getElementById('fetchDebug'); if(el) el.textContent = JSON.stringify(out, null, 2); }catch(e){} }

  let fetchedChaosPerLifeforce = null; let fetchedChaosPerDiv = null;

  async function fetchPoeNinjaPrices(){
    const url = 'https://jolly-dew-18cc.jw11011.workers.dev/';
    const prices = Object.assign({}, defaultPrices);
    function updateUI(pr){ const inputs = Array.from(document.querySelectorAll('#pricesTable input')); const unit = getPriceUnit(); const chaosPerDivLocal = Number(document.getElementById('chaosPerDiv')?.value) || fetchedChaosPerDiv || 0; inputs.forEach(i=>{ const k = i.dataset.key; if(k && pr[k] != null){ const chaosVal = pr[k]; if(unit === 'chaos'){ i.value = chaosVal; } else { if(chaosVal > 0 && chaosPerDivLocal > 0) i.value = (chaosPerDivLocal / chaosVal).toFixed(2); else i.value = ''; } } }); try{ updateDebug(pr, 'proxy'); }catch(e){} }
    try{
      const leagueSel = (document.getElementById('leagueSelect') && document.getElementById('leagueSelect').value) ? document.getElementById('leagueSelect').value : 'Standard';
      const fetchUrl = url + '?league=' + encodeURIComponent(leagueSel);
      const res = await fetch(fetchUrl, {mode: 'cors'});
      if(!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      if(data && Array.isArray(data.lines)){
        const prefix = 'Deafening Essence of ';
        data.lines.forEach(item => { const name = item.name || item.baseType || ''; if(typeof name === 'string' && name.startsWith(prefix)){ const key = name.substring(prefix.length).trim(); const chaos = item.chaosValue; if(key && prices[key] != null && typeof chaos === 'number') prices[key] = chaos; } });
      }
      // currency rates
      try{
        const leagueSel2 = (document.getElementById('leagueSelect') && document.getElementById('leagueSelect').value) ? document.getElementById('leagueSelect').value : 'Standard';
        const curUrl = 'https://wandering-lake-d156.jw11011.workers.dev/?league=' + encodeURIComponent(leagueSel2);
        const cres = await fetch(curUrl, {mode: 'cors'});
        if(cres && cres.ok){ const cdata = await cres.json(); const arr = Array.isArray(cdata) ? cdata : (Array.isArray(cdata.lines) ? cdata.lines : null); if(arr){ for(const it of arr){ const id = (it.detailsId || '').toLowerCase(); const name = (it.currencyTypeName || '').toLowerCase(); if(id.includes('primal-crystallised-lifeforce') || name.includes('primal crystallised lifeforce')){ if(typeof it.chaosEquivalent === 'number'){ fetchedChaosPerLifeforce = it.chaosEquivalent; try{ if(fetchedChaosPerDiv != null && fetchedChaosPerLifeforce > 0){ const bluePerDivVal = fetchedChaosPerDiv / fetchedChaosPerLifeforce; document.getElementById('bluePerDiv').value = bluePerDivVal.toFixed(3); } }catch(e){} } } if(id.includes('divine-orb') || name.includes('divine orb')){ if(typeof it.chaosEquivalent === 'number'){ fetchedChaosPerDiv = it.chaosEquivalent; const el=document.getElementById('chaosPerDiv'); if(el) el.value = fetchedChaosPerDiv.toFixed(2); try{ if(fetchedChaosPerDiv != null && fetchedChaosPerLifeforce > 0){ const bluePerDivVal = fetchedChaosPerDiv / fetchedChaosPerLifeforce; document.getElementById('bluePerDiv').value = bluePerDivVal.toFixed(3); } }catch(e){} } } } } }
      }catch(e){}
      updateUI(prices); return prices;
    }catch(err){ updateUI(prices); try{ updateDebug(prices, 'fallback'); }catch(e){} return prices; }
  }

  // wire up handlers where elements exist
  try{
    // Essence
    if(document.getElementById('pricesTable')){
      const cb = document.getElementById('computeBtn'); if(cb) cb.addEventListener('click', computeStrategy);
      const rb = document.getElementById('refreshPricesBtn'); if(rb) rb.addEventListener('click', ()=>{ fetchPoeNinjaPrices(); });
      initPrices(); attachInputSaveHandlers(); const saved = loadUserValues(); if(saved) applyUserValues(saved); else { try{ fetchPoeNinjaPrices(); }catch(e){} }
      const ls = document.getElementById('leagueSelect'); if(ls) ls.addEventListener('change', ()=> fetchPoeNinjaPrices());
    }

    // Fossils
    if(document.getElementById('fossilsTable')){
      initFossilsUI();
      const cb = document.getElementById('computeFossilBtn'); if(cb) cb.addEventListener('click', computeFossilStrategy);
      const rb = document.getElementById('refreshFossilBtn'); if(rb) rb.addEventListener('click', ()=>{ initFossilsUI(); attachFossilHandlers(); saveJSON('poh_fossil_values', {}); });
      attachFossilHandlers(); const savedF = loadJSON('poh_fossil_values'); if(savedF) { try{ if(savedF.f_startCount!=null) document.getElementById('f_startCount').value = savedF.f_startCount; if(savedF.f_startType) document.getElementById('f_startType').value = savedF.f_startType; }catch(e){} }
    }
  }catch(e){}

  // helpers used by fossil handlers (must be defined after)
  function saveFossilUserValues(){ try{ const priceInputs = Array.from(document.querySelectorAll('.fossil-price')); const weightInputs = Array.from(document.querySelectorAll('.fossil-weight')); const prices={}; const weights={}; priceInputs.forEach(i=> prices[i.dataset.key]=i.value); weightInputs.forEach(i=> weights[i.dataset.key]=i.value); const obj = { prices, weights, f_startCount: Number(document.getElementById('f_startCount')?.value)||0, f_startType: document.getElementById('f_startType')?.value||null, f_bluePerDiv: document.getElementById('f_bluePerDiv')?.value||null, f_chaosPerDiv: document.getElementById('f_chaosPerDiv')?.value||null, fossilPriceUnit: (document.querySelector('input[name="fossilPriceUnit"]:checked')||{}).value||'chaos' }; saveJSON('poh_fossil_values', obj); }catch(e){} }
  function loadFossilUserValues(){ return loadJSON('poh_fossil_values'); }
  function applyFossilUserValues(obj){ try{ if(!obj) return; if(obj.f_startCount!=null) document.getElementById('f_startCount').value = obj.f_startCount; if(obj.f_startType) document.getElementById('f_startType').value = obj.f_startType; if(obj.f_bluePerDiv!=null) document.getElementById('f_bluePerDiv').value = obj.f_bluePerDiv; if(obj.f_chaosPerDiv!=null) document.getElementById('f_chaosPerDiv').value = obj.f_chaosPerDiv; if(obj.fossilPriceUnit){ const sel=document.querySelectorAll('input[name="fossilPriceUnit"]'); sel.forEach(r=> r.checked = (r.value === obj.fossilPriceUnit)); } if(obj.prices){ const inputs = Array.from(document.querySelectorAll('.fossil-price')); inputs.forEach(i=>{ const k=i.dataset.key; if(k && obj.prices[k]!=null) i.value = obj.prices[k]; }); } if(obj.weights){ const inputs = Array.from(document.querySelectorAll('.fossil-weight')); inputs.forEach(i=>{ const k=i.dataset.key; if(k && obj.weights[k]!=null) i.value = obj.weights[k]; }); } }catch(e){} }
  function attachFossilHandlers(){ try{ const priceInputs = Array.from(document.querySelectorAll('.fossil-price')); const weightInputs = Array.from(document.querySelectorAll('.fossil-weight')); priceInputs.forEach(i=> i.addEventListener('change', saveFossilUserValues)); weightInputs.forEach(i=> i.addEventListener('change', saveFossilUserValues)); const radios = Array.from(document.querySelectorAll('input[name="fossilPriceUnit"]')); radios.forEach(r=> r.addEventListener('change', (e)=>{ try{ const newUnit = e.target.value; const prevUnit = (newUnit === 'chaos') ? 'fossPerDiv' : 'chaos'; convertDisplayedFossilPrices(prevUnit, newUnit); }catch(err){} saveFossilUserValues(); })); ['f_startCount','f_startType','f_bluePerDiv','f_chaosPerDiv'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change', saveFossilUserValues); }); }catch(e){} }

})();
