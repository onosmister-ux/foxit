// Data
const equityData = [
  { m:'Jan', equity:800, balance:600 },
  { m:'Feb', equity:1100, balance:900 },
  { m:'Mar', equity:950, balance:1050 },
  { m:'Apr', equity:1400, balance:1200 },
  { m:'May', equity:1650, balance:1350 },
  { m:'Jun', equity:1500, balance:1450 },
  { m:'Jul', equity:1800, balance:1600 },
  { m:'Aug', equity:2000, balance:1500 },
  { m:'Sep', equity:1900, balance:1750 },
  { m:'Oct', equity:2100, balance:1900 },
  { m:'Nov', equity:1950, balance:2000 },
  { m:'Dec', equity:2250, balance:2100 },
];
const rows = [
  { id:1281951, type:'Sell', symbol:'GBPJPY', open:'12 Aug 2024, 03:35', close:'12 Aug 2024, 04:35', lots:'20.00', profit:-1746.03 },
  { id:1281952, type:'Buy', symbol:'EURUSD', open:'11 Aug 2024, 11:20', close:'11 Aug 2024, 13:05', lots:'5.50', profit:842.12 },
  { id:1281953, type:'Buy', symbol:'XAUUSD', open:'10 Aug 2024, 09:12', close:'10 Aug 2024, 15:40', lots:'2.00', profit:1240.00 },
  { id:1281954, type:'Sell', symbol:'GBPUSD', open:'09 Aug 2024, 14:00', close:'09 Aug 2024, 14:45', lots:'10.00', profit:-320.50 },
  { id:1281955, type:'Buy', symbol:'USDJPY', open:'08 Aug 2024, 08:30', close:'08 Aug 2024, 10:00', lots:'8.00', profit:560.30 },
];
const tickers = [
  { sym:'EURUSD', price:'1.0842', up:true, ch:'+0.12%' },
  { sym:'GBPJPY', price:'190.42', up:false, ch:'-0.34%' },
  { sym:'XAUUSD', price:'3343.44', up:true, ch:'+0.82%' },
  { sym:'USDJPY', price:'154.21', up:true, ch:'+0.21%' },
  { sym:'GBPUSD', price:'1.2718', up:false, ch:'-0.09%' },
  { sym:'BTCUSD', price:'67,421.10', up:true, ch:'+1.44%' },
];

// Ticker
const track = document.getElementById('tickerTrack');
function renderTicker(){
  const double = [...tickers, ...tickers];
  track.innerHTML = double.map(t=>`<div class="ticker-item ${t.up?'up':'down'}"><b>${t.sym}</b> ${t.price} ${t.up?'▲':'▼'} ${t.ch}</div>`).join('');
}
renderTicker();

// Chart
const svg = document.getElementById('equitySvg');
const tooltip = document.getElementById('tooltip');
const xLabels = document.getElementById('xLabels');
const W=700, H=200, PAD=20, MAX=2500;
const getX = i => PAD + (i/(equityData.length-1))*(W-PAD*2);
const getY = v => H - PAD - (v/MAX)*(H-PAD*2);

function buildPath(key){
  return equityData.map((d,i)=>`${i===0?'M':'L'} ${getX(i)} ${getY(d[key])}`).join(' ');
}
function buildArea(key){
  const p = buildPath(key);
  return `${p} L ${getX(equityData.length-1)} ${H-PAD} L ${getX(0)} ${H-PAD} Z`;
}

function drawChart(){
  svg.innerHTML = `
    <path d="${buildArea('equity')}" fill="#E6F4FF" opacity="0.6"/>
    <path d="${buildPath('equity')}" fill="none" stroke="#2D9CDB" stroke-width="2.5" stroke-linecap="round"/>
    <path d="${buildPath('balance')}" fill="none" stroke="#0A2540" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="0"/>
  `;
  equityData.forEach((d,i)=>{
    const cx=getX(i), cy=getY(d.equity);
    const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot.setAttribute('cx',cx); dot.setAttribute('cy',cy); dot.setAttribute('r', i===7?6:0);
    dot.setAttribute('fill','#0A2540'); dot.setAttribute('stroke','#fff'); dot.setAttribute('stroke-width','2');
    dot.style.cursor='pointer';
    dot.addEventListener('mouseenter',()=>showTip(i,cx,cy));
    dot.addEventListener('mouseleave',()=>tooltip.classList.remove('show'));
    if(i===7) svg.appendChild(dot);
    // invisible hit area
    const hit=document.createElementNS('http://www.w3.org/2000/svg','rect');
    hit.setAttribute('x',cx-15); hit.setAttribute('y',0); hit.setAttribute('width',30); hit.setAttribute('height',H);
    hit.setAttribute('fill','transparent'); hit.style.cursor='pointer';
    hit.addEventListener('mouseenter',()=>showTip(i,cx,cy));
    svg.appendChild(hit);
  });
  xLabels.innerHTML = equityData.map(d=>`<span>${d.m}</span>`).join('');
}
function showTip(i,cx,cy){
  const d=equityData[i];
  tooltip.innerHTML=`<b>${d.m} 25</b><br/>Equity - $${d.equity}<br/>Balance - $${d.balance}`;
  tooltip.style.left = (cx/700*100)+'%';
  tooltip.style.top = (cy)+'px';
  tooltip.classList.add('show');
}
drawChart();

// Gauge - fixed logic
const percent = 84;
const total = Math.PI * 80; // half circumference ~251.2
const offset = total - (percent/100)*total;
document.getElementById('gaugeFill').setAttribute('stroke-dashoffset', offset);
document.getElementById('needle').style.transform = `translateX(-50%) rotate(${-90 + percent*1.8}deg)`;

// Table
const body=document.getElementById('tableBody');
const typeF=document.getElementById('typeFilter');
const symF=document.getElementById('symbolFilter');
const search=document.getElementById('searchInput');
function renderTable(){
  const t=typeF.value, s=symF.value, q=search.value.toLowerCase();
  const filtered = rows.filter(r=>{
    if(t!=='All Types' && r.type!==t) return false;
    if(s!=='All Symbols' && r.symbol!==s) return false;
    if(q && !`${r.id} ${r.symbol}`.toLowerCase().includes(q)) return false;
    return true;
  });
  body.innerHTML = filtered.map(r=>`
    <tr>
      <td>${r.id}</td>
      <td><span class="pill ${r.type==='Buy'?'buy':'sell'}">${r.type}</span></td>
      <td>${r.open}</td>
      <td>${r.close}</td>
      <td><b>${r.symbol}</b></td>
      <td>${r.lots}</td>
      <td class="profit ${r.profit<0?'down':'up'}">${r.profit<0?'-':'+'}$${Math.abs(r.profit).toFixed(2)}</td>
    </tr>
  `).join('');
}
typeF.addEventListener('change',renderTable);
symF.addEventListener('change',renderTable);
search.addEventListener('input',renderTable);
renderTable();

// Sidebar toggle
document.getElementById('openSidebar').addEventListener('click',()=>document.getElementById('sidebar').classList.add('open'));
document.getElementById('closeSidebar').addEventListener('click',()=>document.getElementById('sidebar').classList.remove('open'));
