async function loadText(path){
  const r = await fetch(path);
  return await r.text();
}

function parseCsvGeneric(csv){
  // Handles either:
  // DATE,VALUE   (typical FRED download)
  // observation_date,TSIFRGHT (what your file shows)
  const lines = csv.trim().split("\n");
  const header = lines[0].split(",").map(s=>s.trim());
  const dateIdx = header.findIndex(h => h.toLowerCase() === "date" || h.toLowerCase() === "observation_date");
  const valIdx = header.findIndex(h => h.toLowerCase() === "value" || h.toLowerCase() === "tsifrght" || h.toLowerCase() === "wpu301");

  const pts = [];
  for(const ln of lines.slice(1)){
    const parts = ln.split(",").map(s=>s.trim());
    const d = parts[dateIdx];
    const v = parts[valIdx];
    if(!d || !v || v === ".") continue;
    const num = Number(v);
    if(Number.isFinite(num)) pts.push({date:d, value:num});
  }
  return pts;
}

function meterEl(name, score){
  const el = document.createElement("div");
  el.className = "meter";
  el.innerHTML = `
    <div class="meterTop">
      <div class="meterName">${name}</div>
      <div class="meterScore">${score.toFixed(1)}</div>
    </div>
    <div class="meterBar"><div class="meterFill"></div></div>
  `;
  const fill = el.querySelector(".meterFill");
  fill.style.width = `${Math.max(0,Math.min(100,score*10))}%`;
  fill.style.background = "linear-gradient(90deg,#2b6cb0,#9fb0c3)";
  return el;
}

async function main(){
  const risk = {
    "Energy Exposure": 8.0,
    "Labor + Throughput": 6.0,
    "Vendor / Logistics": 7.0,
    "Capex Timing": 6.0
  };
  const idx = (Object.values(risk).reduce((a,b)=>a+b,0))/Object.values(risk).length;
  document.getElementById("riskIndex").textContent = idx.toFixed(1);

  const meters = document.getElementById("meters");
  Object.entries(risk).forEach(([k,v]) => meters.appendChild(meterEl(k,v)));

  const coststack = await (await fetch("data/coststack.json")).json();
  new Chart(document.getElementById("costPie"),{
    type:"pie",
    data:{ labels: coststack.map(x=>x.category), datasets:[{data: coststack.map(x=>x.pct)}] },
    options:{plugins:{legend:{labels:{color:"#e8eef6"}}}}
  });

  const freight = parseCsvGeneric(await loadText("data/fred_tsifrght.csv"));
  new Chart(document.getElementById("freightLine"),{
    type:"line",
    data:{ labels: freight.map(p=>p.date), datasets:[{label:"Freight TSI (FRED)", data: freight.map(p=>p.value)}] },
    options:{
      plugins:{legend:{labels:{color:"#e8eef6"}}},
      scales:{x:{ticks:{color:"#9fb0c3"}}, y:{ticks:{color:"#9fb0c3"}}}
    }
  });

  const ppi = parseCsvGeneric(await loadText("data/fred_wpu301.csv"));
  new Chart(document.getElementById("freightPpi"),{
    type:"line",
    data:{ labels: ppi.map(p=>p.date), datasets:[{label:"PPI Freight & Mail (FRED)", data: ppi.map(p=>p.value)}] },
    options:{
      plugins:{legend:{labels:{color:"#e8eef6"}}},
      scales:{x:{ticks:{color:"#9fb0c3"}}, y:{ticks:{color:"#9fb0c3"}}}
    }
  });
}

main();
