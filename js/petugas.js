// ── Data pegawai untuk autocomplete petugas ──
// Sumber: master/pegawai.json (dimuat saat init)
let PEGAWAI = JSON.parse(localStorage.getItem('cawi_pegawai_override') || 'null') || [];

async function preloadPegawai() {
  if (localStorage.getItem('cawi_pegawai_override')) return;
  try {
    const res  = await fetch('master/pegawai.json');
    PEGAWAI = await res.json();
  } catch(e) {}
}

function filterPetugas() {
  const q = document.getElementById('p_nama').value.trim().toLowerCase();
  const drop = document.getElementById('petugasDrop');
  if (!q) { drop.style.display = 'none'; return; }
  const matches = PEGAWAI.filter(p => p.nama.toLowerCase().includes(q)).slice(0, 10);
  if (!matches.length) { drop.style.display = 'none'; return; }
  drop.innerHTML = matches.map(p =>
    `<div class="ac-item" onmousedown="selectPetugas(this)" data-nama="${p.nama.replace(/"/g,'&quot;')}" data-nip="${p.nip}">
      <div class="ac-name">${p.nama}</div>
      <div class="ac-sub">${p.jabatan}</div>
    </div>`
  ).join('');
  drop.style.display = 'block';
}

function selectPetugas(el) {
  document.getElementById('p_nama').value = el.dataset.nama;
  document.getElementById('p_nip').value  = el.dataset.nip;
  document.getElementById('petugasDrop').style.display = 'none';
}

function hidePetugasDrop() {
  setTimeout(() => {
    const drop = document.getElementById('petugasDrop');
    if (drop) drop.style.display = 'none';
  }, 150);
}
