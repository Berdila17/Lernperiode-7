
let alleLaender = [];
let gefilterteLaender = [];
let nurFavoriten = false;
const favKey = "favCountries";
const favoriten = new Set(JSON.parse(localStorage.getItem(favKey) || "[]")); 


const countriesEl  = document.getElementById("countries");
const statusEl     = document.getElementById("status");
const searchInput  = document.getElementById("searchInput");
const searchBtn    = document.getElementById("searchBtn");
const sortSelect   = document.getElementById("sortSelect");
const resetBtn     = document.getElementById("resetBtn");
const onlyFavCb    = document.getElementById("onlyFav");
const favInfo      = document.getElementById("favInfo");
const darkToggle   = document.getElementById("darkToggle");
const favViewBtn   = document.getElementById("toggleFavView");
const loadingBox   = document.getElementById("loading");

const detailBox    = document.getElementById("detail");
const detailClose  = document.getElementById("detailClose");
const detailFlag   = document.getElementById("detailFlag");
const detailName   = document.getElementById("detailName");
const detailIso2   = document.getElementById("detailIso2");
const detailIso3   = document.getElementById("detailIso3");


const setStatus = (m)=> statusEl.textContent = m ?? "";
const showLoading = (on)=> loadingBox.classList.toggle("hidden", !on);
const saveFavs = ()=> localStorage.setItem(favKey, JSON.stringify([...favoriten]));
const updateFavInfo = ()=> favInfo.textContent = "Favoriten: " + favoriten.size;


async function ladeLaender(){
  setStatus("Lade Länder…"); showLoading(true);
  try{
    const res = await fetch("https://countriesnow.space/api/v0.1/countries/flag/images");
    if(!res.ok) throw new Error("API nicht ok");
    const json = await res.json();
    alleLaender = (json.data || []).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    gefilterteLaender = alleLaender;
    render();
    setStatus(gefilterteLaender.length + " Länder geladen.");
  }catch(e){
    console.error(e);
    setStatus("Fehler beim Laden der Länder 😢");
  }finally{
    showLoading(false);
  }
}


function render(){
  let liste = [...alleLaender];

  
  const q = (searchInput.value||"").trim().toLowerCase();
  if(q) liste = liste.filter(l => (l.name||"").toLowerCase().includes(q));

  
  if(nurFavoriten || (onlyFavCb && onlyFavCb.checked)){
    liste = liste.filter(l => favoriten.has(l.name));
  }


  const mode = sortSelect.value;
  if(mode==="name-asc")  liste.sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  if(mode==="name-desc") liste.sort((a,b)=>(b.name||"").localeCompare(a.name||""));

  gefilterteLaender = liste;

  if(!liste.length){
    countriesEl.innerHTML = '<p class="muted">Keine Länder gefunden.</p>';
    setStatus("0 Länder gefunden.");
    return;
  }

  countriesEl.innerHTML = liste.map((land,i)=>{
    const name = land.name ?? "Unbekannt";
    const flag = land.flag ?? land.flag_url ?? "";
    const active = favoriten.has(name) ? "active" : "";
    return `
      <article class="card" data-idx="${i}">
        <button class="star ${active}" data-star title="Favorit umschalten">⭐</button>
        <img src="${flag}" alt="Flagge von ${name}" class="flag" loading="lazy">
        <div class="name">${name}</div>
      </article>
    `;
  }).join("");

  setStatus(liste.length + " Länder gefunden.");
  updateFavInfo();
}


function openDetail(land){
  if(!land) return;
  const name = land.name ?? "Unbekannt";
  const flag = land.flag ?? land.flag_url ?? "";
  detailFlag.src = flag;
  detailFlag.alt = "Flagge von " + name;
  detailName.textContent = name;
  detailIso2.textContent = land.iso2 || "–";
  detailIso3.textContent = land.iso3 || "–";
  detailBox.classList.remove("hidden");
  detailBox.scrollIntoView({behavior:"smooth",block:"center"});
}
function closeDetail(){ detailBox.classList.add("hidden"); }
detailClose.addEventListener("click", closeDetail);
document.addEventListener("keydown", e=>{ if(e.key==="Escape") closeDetail(); });


countriesEl.addEventListener("click", (e)=>{
  const starBtn = e.target.closest("[data-star]");
  const card = e.target.closest(".card");
  if(!card) return;
  const idx = Number(card.dataset.idx);
  const land = gefilterteLaender[idx];
  if(starBtn){
    const name = land.name;
    if(favoriten.has(name)) favoriten.delete(name); else favoriten.add(name);
    saveFavs();
    render();
    return;
  }
  openDetail(land);
});


searchBtn.addEventListener("click", render);
searchInput.addEventListener("input", render);
sortSelect.addEventListener("change", render);
resetBtn.addEventListener("click", ()=>{
  searchInput.value=""; sortSelect.value=""; if(onlyFavCb) onlyFavCb.checked=false; nurFavoriten=false;
  render(); closeDetail();
  setStatus(alleLaender.length + " Länder geladen.");
});
if(onlyFavCb){
  onlyFavCb.addEventListener("change", ()=>{ render(); });
}


favViewBtn.addEventListener("click", ()=>{
  nurFavoriten = !nurFavoriten;
  favViewBtn.classList.toggle("active", nurFavoriten);
  render();
});


const themeKey = "themeDark";
if(localStorage.getItem(themeKey)==="1"){ document.body.classList.add("dark"); }
const updateDarkIcon = ()=> darkToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
updateDarkIcon();
darkToggle.addEventListener("click", ()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem(themeKey, document.body.classList.contains("dark") ? "1" : "0");
  updateDarkIcon();
});


ladeLaender();
